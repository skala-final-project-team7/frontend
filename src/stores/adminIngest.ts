/**
 * --------------------------------------------------
 * 작성자 : OpenAI Codex
 * 작성목적 : LINA Admin 데이터 수집 진행 상태 Pinia store.
 *           Admin Key 활성화, ingest 시작, 3초 간격 polling 상태를 컴포넌트 밖에서 일관되게 관리한다.
 * 작성일 : 2026-06-09
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-06-09, 최초 작성, Admin ingest 실행 및 polling 상태 store 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Pinia 2.3.x 기준
 * --------------------------------------------------
 */
import { defineStore } from 'pinia';

import { activateAdminKey, getAdminIngestStatus, startAdminIngestJob } from '@/api';
import type { AdminIngestJobStatus, AdminIngestMode, AdminIngestStatusResponse } from '@/types/api';

const INGEST_POLL_INTERVAL_MS = 3000;
const ELAPSED_CLOCK_INTERVAL_MS = 1000;
const MAX_SPEED_SAMPLES = 4;

let activeIngestPollTimer: number | null = null;
let activeElapsedClockTimer: number | null = null;

type IngestSpeedSample = {
  processedPages: number;
  elapsedSeconds: number;
};

type AdminIngestState = {
  activatedUntil: string | null;
  jobId: string;
  status: AdminIngestJobStatus | '';
  startedAt: string | null;
  totalPages: number;
  processedPages: number;
  failedPages: number;
  isActivatingKey: boolean;
  isStartingIngest: boolean;
  isPolling: boolean;
  lastError: string;
  speedSamples: IngestSpeedSample[];
  clockNowMs: number;
};

export const useAdminIngestStore = defineStore('adminIngest', {
  state: (): AdminIngestState => ({
    activatedUntil: null,
    jobId: '',
    status: '',
    startedAt: null,
    totalPages: 0,
    processedPages: 0,
    failedPages: 0,
    isActivatingKey: false,
    isStartingIngest: false,
    isPolling: false,
    lastError: '',
    speedSamples: [],
    clockNowMs: Date.now(),
  }),

  getters: {
    hasActiveJob(state): boolean {
      return Boolean(state.jobId);
    },

    isTerminalStatus(state): boolean {
      return state.status === 'COMPLETED' || state.status === 'FAILED';
    },

    progressPercent(state): number {
      if (state.totalPages <= 0) {
        return state.status === 'COMPLETED' ? 100 : 0;
      }

      return Math.min(100, Math.round((state.processedPages / state.totalPages) * 100));
    },

    isAdminKeyActive(state): boolean {
      return state.activatedUntil ? new Date(state.activatedUntil).getTime() > Date.now() : false;
    },

    elapsedSeconds(state): number {
      if (!state.startedAt) {
        return 0;
      }

      return Math.max(
        0,
        Math.floor((state.clockNowMs - new Date(state.startedAt).getTime()) / 1000),
      );
    },

    formattedElapsed(): string {
      return formatDuration(this.elapsedSeconds);
    },

    averagePagesPerSecond(state): number {
      if (state.speedSamples.length < 2) {
        return 0;
      }

      const intervalRates: number[] = [];

      for (let index = 1; index < state.speedSamples.length; index += 1) {
        const previousSample = state.speedSamples[index - 1];
        const currentSample = state.speedSamples[index];
        const elapsedDelta = currentSample.elapsedSeconds - previousSample.elapsedSeconds;
        const processedDelta = currentSample.processedPages - previousSample.processedPages;

        if (elapsedDelta > 0 && processedDelta >= 0) {
          intervalRates.push(processedDelta / elapsedDelta);
        }
      }

      if (intervalRates.length === 0) {
        return 0;
      }

      return intervalRates.reduce((sum, rate) => sum + rate, 0) / intervalRates.length;
    },

    estimatedRemainingSeconds(): number | null {
      if (this.status === 'COMPLETED') {
        return 0;
      }

      if (this.status === 'FAILED' || this.totalPages <= 0) {
        return null;
      }

      const remainingPages = Math.max(0, this.totalPages - this.processedPages);

      if (remainingPages === 0) {
        return 0;
      }

      if (this.averagePagesPerSecond <= 0) {
        return null;
      }

      return Math.ceil(remainingPages / this.averagePagesPerSecond);
    },

    formattedEta(): string {
      if (this.estimatedRemainingSeconds === null) {
        return '계산 중';
      }

      return formatDuration(this.estimatedRemainingSeconds);
    },
  },

  actions: {
    applyActivation(activatedUntil: string) {
      this.activatedUntil = activatedUntil;
      this.lastError = '';
    },

    applyIngestStatus(response: AdminIngestStatusResponse) {
      this.jobId = response.jobId;
      this.status = response.status;
      this.startedAt = response.startedAt;
      this.totalPages = response.totalPages;
      this.processedPages = response.processedPages;
      this.failedPages = response.failedPages;
      this.lastError = '';
      this.clockNowMs = Date.now();
      this.captureSpeedSample(response);
    },

    captureSpeedSample(response: Pick<AdminIngestStatusResponse, 'processedPages' | 'startedAt'>) {
      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(response.startedAt).getTime()) / 1000),
      );
      const nextSample: IngestSpeedSample = {
        processedPages: response.processedPages,
        elapsedSeconds,
      };

      if (this.speedSamples.at(-1)?.elapsedSeconds === nextSample.elapsedSeconds) {
        this.speedSamples[this.speedSamples.length - 1] = nextSample;
        return;
      }

      this.speedSamples = [...this.speedSamples, nextSample].slice(-MAX_SPEED_SAMPLES);
    },

    async ensureAdminKeyActive() {
      if (this.isAdminKeyActive) {
        return this.activatedUntil;
      }

      this.isActivatingKey = true;

      try {
        const response = await activateAdminKey();
        this.applyActivation(response.activatedUntil);
        return response.activatedUntil;
      } finally {
        this.isActivatingKey = false;
      }
    },

    async startIngest(mode: AdminIngestMode = 'full') {
      this.isStartingIngest = true;
      this.lastError = '';

      try {
        await this.ensureAdminKeyActive();
        const response = await startAdminIngestJob({ mode });

        this.jobId = response.jobId;
        this.status = response.status;
        this.startedAt = response.startedAt;
        this.totalPages = 0;
        this.processedPages = 0;
        this.failedPages = 0;
        this.speedSamples = [];
        this.clockNowMs = Date.now();

        if (response.status === 'COMPLETED' || response.status === 'FAILED') {
          this.stopPolling();
        } else {
          this.startPolling();
        }

        return response;
      } finally {
        this.isStartingIngest = false;
      }
    },

    async pollStatus() {
      if (!this.jobId) {
        return;
      }

      try {
        const response = await getAdminIngestStatus(this.jobId);
        this.applyIngestStatus(response);

        if (response.status === 'COMPLETED' || response.status === 'FAILED') {
          this.stopPolling();
        }
      } catch (error) {
        this.lastError =
          error instanceof Error ? error.message : '수집 상태를 조회하는 중 오류가 발생했습니다.';
        this.stopPolling();
      }
    },

    startPolling() {
      this.stopPolling();
      this.isPolling = true;
      this.startElapsedClock();

      activeIngestPollTimer = window.setInterval(() => {
        void this.pollStatus();
      }, INGEST_POLL_INTERVAL_MS);
    },

    startElapsedClock() {
      this.clockNowMs = Date.now();

      activeElapsedClockTimer = window.setInterval(() => {
        this.clockNowMs = Date.now();
      }, ELAPSED_CLOCK_INTERVAL_MS);
    },

    stopPolling() {
      if (activeIngestPollTimer) {
        window.clearInterval(activeIngestPollTimer);
        activeIngestPollTimer = null;
      }

      if (activeElapsedClockTimer) {
        window.clearInterval(activeElapsedClockTimer);
        activeElapsedClockTimer = null;
      }

      this.isPolling = false;
    },

    reset() {
      this.stopPolling();
      this.jobId = '';
      this.status = '';
      this.startedAt = null;
      this.totalPages = 0;
      this.processedPages = 0;
      this.failedPages = 0;
      this.isActivatingKey = false;
      this.isStartingIngest = false;
      this.lastError = '';
      this.speedSamples = [];
      this.clockNowMs = Date.now();
    },
  },
});

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');

  return `${minutes}:${seconds}`;
}
