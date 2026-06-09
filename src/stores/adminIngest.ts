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

import {
  activateAdminKey,
  getAdminIngestStatus,
  startAdminIngestJob,
} from '@/api';
import type {
  AdminIngestJobStatus,
  AdminIngestMode,
  AdminIngestStatusResponse,
} from '@/types/api';

const INGEST_POLL_INTERVAL_MS = 3000;

let activeIngestPollTimer: ReturnType<typeof window.setInterval> | null = null;

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

        this.startPolling();

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

      activeIngestPollTimer = window.setInterval(() => {
        void this.pollStatus();
      }, INGEST_POLL_INTERVAL_MS);
    },

    stopPolling() {
      if (activeIngestPollTimer) {
        window.clearInterval(activeIngestPollTimer);
        activeIngestPollTimer = null;
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
    },
  },
});
