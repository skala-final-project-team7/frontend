<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin SCR-800 문서 데이터 관리 탭 컨텐츠.
          데이터 파이프라인 카드, 데이터 현황 벤토, 최근 동기화 이력을 렌더링한다.
작성일 : 2026-06-10
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-10, feature14-refactor.2, AdminEntryPage에서 운영 탭 컨텐츠 분리
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { AlertTriangle, HardDriveDownload, Info } from '@lucide/vue';

import { useToast } from '@/composables/useToast';
import { useAdminIngestStore } from '@/stores';
import type {
  AdminDataOverview,
  AdminIngestJobStatus,
  AdminSyncHistoryResponse,
  AdminSyncStatus,
} from '@/types/api';
import {
  BaseButton,
  EmptyState,
  linaFlagImageUrl,
  linaRunningImageUrl,
  linaWaitingImageUrl,
  linaDeskImageUrl,
} from '@/shared';

const props = defineProps<{
  adminDataOverview: AdminDataOverview | null;
  adminSyncHistory: AdminSyncHistoryResponse['syncHistory'];
}>();

const emit = defineEmits<{
  'view-all-sync': [];
  'refresh-requested': [];
}>();

const DEFAULT_ADMIN_ACTION_HINT =
  '데이터 불러오기 버튼을 누르면 관리자 권한 확인 후 전체 수집을 시작합니다.';
const adminActionHint = ref(DEFAULT_ADMIN_ACTION_HINT);

const { showToast } = useToast();
const adminIngestStore = useAdminIngestStore();
const {
  averagePagesPerSecond,
  failedPages,
  formattedElapsed,
  formattedEta,
  isPolling,
  isStartingIngest,
  lastError,
  processedPages,
  progressPercent,
  status,
  totalPages,
} = storeToRefs(adminIngestStore);

type AdminDisplayStatus = AdminSyncStatus | AdminIngestJobStatus;

const shouldShowRetryIngest = computed(() => status.value === 'FAILED');
const shouldDisablePipelineActions = computed(
  () =>
    isStartingIngest.value ||
    (isPolling.value && status.value !== 'FAILED' && status.value !== 'COMPLETED'),
);

// ── 데이터 현황 ──────────────────────────────────────────────────────
const contentVolumeCards = computed(() => {
  if (!props.adminDataOverview) return [];
  return [
    {
      testId: 'totalSpaces',
      label: '스페이스',
      value: formatNumber(props.adminDataOverview.totalSpaces),
    },
    {
      testId: 'totalPages',
      label: '페이지',
      value: formatNumber(props.adminDataOverview.totalPages),
    },
    {
      testId: 'totalAttachments',
      label: '첨부파일',
      value: formatNumber(props.adminDataOverview.totalAttachments),
    },
  ];
});

const lastSyncRelativeText = computed(() =>
  props.adminDataOverview ? formatRelativeTime(props.adminDataOverview.lastSyncAt) : '',
);

// 마지막 동기화가 24시간을 넘기면 LED를 경고색으로 바꿔 지연을 드러낸다.
const isLastSyncStale = computed(() => {
  if (!props.adminDataOverview) return false;
  return Date.now() - new Date(props.adminDataOverview.lastSyncAt).getTime() > 24 * 60 * 60_000;
});

// 데이터 현황 차트는 GET /api/admin/sync 의 syncHistory(최신순)를 최근 7건만
// 시간순(과거→최신)으로 뒤집어 그린다.
const MAX_SYNC_CHART_ITEMS = 7;

const recentSyncItemsChronological = computed(() =>
  [...props.adminSyncHistory.slice(0, MAX_SYNC_CHART_ITEMS)].reverse(),
);

const syncChartBars = computed(() => {
  const syncItems = recentSyncItemsChronological.value;
  const maxUpdatedPages = Math.max(...syncItems.map((item) => item.updatedPages), 1);
  // 하루에 여러 번 동기화되면 날짜 라벨이 중복되므로 시각 라벨을 함께 노출한다.
  const dateLabels = syncItems.map((item) => formatChartDate(item.completedAt));
  const hasDuplicateDateLabels = new Set(dateLabels).size !== dateLabels.length;
  return syncItems.map((item, index) => ({
    syncId: item.syncId,
    label: dateLabels[index],
    timeLabel: hasDuplicateDateLabels ? formatChartHour(item.completedAt) : '',
    heightPercent: Math.max(Math.round((item.updatedPages / maxUpdatedPages) * 100), 6),
    updatedPages: item.updatedPages,
    isFailed: item.status === 'FAILED',
    isLatest: index === syncItems.length - 1,
  }));
});

const syncChartMaxLabel = computed(() => {
  const maxUpdatedPages = Math.max(
    ...recentSyncItemsChronological.value.map((item) => item.updatedPages),
    0,
  );
  return `최대 ${formatNumber(maxUpdatedPages)}p`;
});

const durationChart = computed(() => {
  const syncItems = recentSyncItemsChronological.value;
  if (syncItems.length === 0) return null;

  // viewBox(300x56) 가장자리에서 점·선이 잘리지 않도록 양끝에 여백을 두고 좌표를 잡는다.
  const maxDuration = Math.max(...syncItems.map((item) => item.duration), 1);
  const points = syncItems.map((item, index) => {
    const x = syncItems.length === 1 ? 150 : 10 + (index / (syncItems.length - 1)) * 280;
    const y = 48 - (item.duration / maxDuration) * 38;
    return {
      syncId: item.syncId,
      x: Math.round(x),
      y: Math.round(y),
      xPercent: (x / 300) * 100,
      yPercent: (y / 56) * 100,
      isFailed: item.status === 'FAILED',
      isLatest: index === syncItems.length - 1,
      dateLabel: formatChartDate(item.completedAt),
      durationSeconds: item.duration,
    };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},56 L${points[0].x},56 Z`;
  const completedItems = syncItems.filter((item) => item.status === 'COMPLETED');
  const averageDuration =
    completedItems.length > 0
      ? Math.round(
          completedItems.reduce((total, item) => total + item.duration, 0) / completedItems.length,
        )
      : 0;

  return { points, linePath, areaPath, averageDuration };
});

// Qdrant 기본 플랜 상한: 4 GB — 플랜 변경 시 이 값을 수정한다.
const VECTOR_DB_CAPACITY_GB = 4;
const vectorDbUsedGb = computed(() => {
  if (!props.adminDataOverview) return 0;
  const m = props.adminDataOverview.vectorDbSize.match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
});
const vectorDbUsagePercent = computed(() =>
  Math.min(100, Math.round((vectorDbUsedGb.value / VECTOR_DB_CAPACITY_GB) * 100)),
);
const isVectorDbLow = computed(() => vectorDbUsagePercent.value >= 80);
const vectorDbFillColor = computed(() => {
  if (vectorDbUsagePercent.value >= 80) return 'var(--color-error)';
  if (vectorDbUsagePercent.value >= 60) return 'var(--color-warning)';
  return 'var(--color-success)';
});

const hoveredDurationPoint = ref<{
  syncId: string;
  xPercent: number;
  yPercent: number;
  isFailed: boolean;
  dateLabel: string;
  durationSeconds: number;
} | null>(null);

const hoveredBarId = ref<string | null>(null);

// 페이드아웃(150ms) 중 null이 된 hoveredDurationPoint 대신 마지막 값을 유지해 컨텐츠 공백 방지
const displayedDurationPoint = ref<typeof hoveredDurationPoint.value>(null);
watch(hoveredDurationPoint, (val) => {
  if (val !== null) displayedDurationPoint.value = val;
});

// ── 파이프라인 UI 계산값 ──────────────────────────────────────────────
const pipelineStatusLabel = computed(() =>
  status.value ? getStatusLabel(status.value) : '대기 중',
);
const pipelineStatusClasses = computed(() =>
  status.value ? getStatusClasses(status.value) : 'bg-bg-200 text-overlay-dark-80',
);
const ingestPrimaryButtonLabel = computed(() => {
  if (isStartingIngest.value) return '데이터 불러오는 중';
  if (shouldShowRetryIngest.value) return '다시 시도';
  return '데이터 불러오기';
});
const pipelineDescription = computed(() => {
  if (lastError.value) return lastError.value;
  switch (status.value) {
    case 'STARTED':
      return '수집할 문서를 확인하고 있습니다.';
    case 'IN_PROGRESS':
      return failedPages.value > 0
        ? '문서를 수집하고 있습니다. 실패한 문서는 다시 시도합니다.'
        : '문서를 수집하고 있습니다. 잠시만 기다려 주세요.';
    case 'COMPLETED':
      return '전체 수집이 완료되었습니다. 아래 데이터 현황에서 확인할 수 있습니다.';
    case 'FAILED':
      return '수집에 실패했습니다. 다시 시도해 주세요.';
    default:
      return '검색에 사용할 사용자 문서를 수집하고 최신 상태로 유지합니다.';
  }
});
const pipelineActionHint = computed(() => {
  if (isStartingIngest.value) return '데이터 수집을 시작하고 있습니다.';
  return adminActionHint.value;
});
const pipelineCharacterImageUrl = computed(() => {
  if (status.value === 'COMPLETED') return linaFlagImageUrl;
  return status.value ? linaRunningImageUrl : linaWaitingImageUrl;
});
const pipelineCharacterAlt = computed(() => {
  if (status.value === 'COMPLETED') return '수집 완료';
  return status.value ? '수집 진행 중' : '수집 대기 중';
});
const pipelineCharacterStyle = computed(() => {
  // 완료 시에는 캐릭터를 키우고 중심이 진행바 끝을 넘도록 둬 결승점에 선 느낌을 준다.
  if (status.value === 'COMPLETED') {
    return { left: `calc(${progressPercent.value}% - 50px)`, top: '0rem' };
  }
  // IDLE에서는 출발선(좌측 끝)에 캐릭터 몸이 걸치도록 세워 둔다.
  if (!status.value) {
    return { left: '-1.75rem', top: '-0.15rem' };
  }
  return { left: `calc(${progressPercent.value}% - 36px)`, top: '-0.15rem' };
});
// lina-flag.png는 캔버스 여백이 커서 박스를 진행 캐릭터보다 훨씬 키워야 비슷한 체감 크기가 된다.
const pipelineCharacterClasses = computed(() =>
  status.value === 'COMPLETED' ? 'h-[4rem] w-[4rem]' : 'h-[4.75rem] w-[4.75rem]',
);
// 진행 중에만 좌표 이동을 애니메이션한다. 완료 시점에는 크기·위치가 함께 바뀌므로
// 전환 효과를 끄고 즉시 결승점에 세워 크기가 변하는 듯한 잔상을 막는다.
const pipelineCharacterMotionClasses = computed(() =>
  status.value === 'STARTED' || status.value === 'IN_PROGRESS'
    ? 'transition-[left] duration-500 ease-out'
    : '',
);
const processedMetricText = computed(() =>
  status.value ? `${formatNumber(processedPages.value)} / ${formatNumber(totalPages.value)}` : '-',
);
const ingestElapsedText = computed(() => (status.value ? formattedElapsed.value : '-'));
const ingestEtaText = computed(() =>
  status.value && formattedEta.value !== '계산 중' ? formattedEta.value : '-',
);
const ingestSpeedText = computed(() =>
  status.value && averagePagesPerSecond.value > 0
    ? `${averagePagesPerSecond.value.toFixed(1)} page/s`
    : '-',
);

watch(status, (nextStatus, previousStatus) => {
  if (!nextStatus || nextStatus === previousStatus) return;

  if (nextStatus === 'COMPLETED') {
    adminActionHint.value = '데이터 수집이 완료되었습니다.';
    showToast('데이터 불러오기가 완료되었습니다.', { variant: 'success' });
    emit('refresh-requested');
    return;
  }

  if (nextStatus === 'FAILED') {
    adminActionHint.value = '데이터 수집이 실패했습니다. 다시 시도해 주세요.';
    showToast('데이터 불러오기가 실패했습니다. 다시 시도해 주세요.', { variant: 'error' });
    emit('refresh-requested');
  }
});

watch(lastError, (nextError) => {
  if (!nextError) return;
  adminActionHint.value = nextError;
});

async function handleStartIngest() {
  try {
    await adminIngestStore.startIngest('full');
    adminActionHint.value = '데이터 불러오기를 시작했습니다.';
    showToast('데이터 불러오기를 시작했습니다.', { variant: 'success' });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : '데이터 불러오기 작업을 시작하는 중 오류가 발생했습니다.';
    adminActionHint.value = message;
    showToast(message, { variant: 'error' });
  }
}

// ── 포맷 유틸 ────────────────────────────────────────────────────────
function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));
}

function formatChartDate(value: string): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}.${day}`;
}

function formatRelativeTime(value: string): string {
  const elapsedMinutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (elapsedMinutes < 1) return '방금 전';
  if (elapsedMinutes < 60) return `${elapsedMinutes}분 전`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}시간 전`;
  return `${Math.floor(elapsedHours / 24)}일 전`;
}

function formatChartHour(value: string): string {
  return `${String(new Date(value).getHours()).padStart(2, '0')}시`;
}

// 저장 enum(UPPER_SNAKE_CASE)은 그대로 두고 화면 표기만 한글로 매핑한다.
const STATUS_DISPLAY_LABELS: Record<AdminDisplayStatus, string> = {
  STARTED: '수집 준비',
  IN_PROGRESS: '수집 중',
  COMPLETED: '완료',
  FAILED: '실패',
};

function getStatusLabel(s: AdminDisplayStatus): string {
  return STATUS_DISPLAY_LABELS[s] ?? s;
}

function getStatusClasses(s: AdminDisplayStatus): string {
  if (s === 'FAILED') return 'bg-status-error/10 text-status-error';
  if (s === 'COMPLETED') return 'bg-[#F0FDF4] text-[#22C55E]';
  if (s === 'IN_PROGRESS') return 'bg-primary/8 text-primary';
  if (s === 'STARTED') return 'bg-[#EFF6FF] text-[#3B82F6]';
  return 'bg-bg-300 text-overlay-dark-60';
}
</script>

<template>
  <section class="px-8 py-8">
    <header class="mb-7">
      <h2
        data-testid="admin-operations-heading"
        class="text-[1.25rem] font-semibold text-overlay-dark-80"
      >
        문서 데이터 관리
      </h2>
    </header>

    <!-- 데이터 파이프라인 -->
    <div
      data-testid="admin-ingest-pipeline-card"
      class="mb-6 rounded-[1.75rem] border border-bg-300/70 bg-primary-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
    >
      <div class="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
        <div class="lg:pr-4">
          <h3 class="text-[1.08rem] font-semibold tracking-[-0.03em] text-overlay-dark-80">
            문서 수집 현황
          </h3>
          <p class="mt-2 line-clamp-2 min-h-[3rem] text-[0.8rem] leading-6 text-overlay-dark-40">
            {{ pipelineDescription }}
          </p>
          <div class="mt-5 flex flex-wrap gap-2">
            <BaseButton
              variant="primary"
              data-testid="admin-start-ingest-button"
              :disabled="shouldDisablePipelineActions"
              @click="handleStartIngest"
            >
              <HardDriveDownload aria-hidden="true" class="size-4 shrink-0" />
              {{ ingestPrimaryButtonLabel }}
            </BaseButton>
          </div>
          <div class="mt-3 flex items-center gap-1.5 text-[0.72rem] text-overlay-dark-40">
            <Info aria-hidden="true" class="size-3.5 shrink-0" />
            <p>새로고침하면 진행 상태가 초기화될 수 있습니다.</p>
          </div>
        </div>

        <div class="min-w-0 border-t border-bg-200 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <div class="relative px-1">
            <div class="relative h-20">
              <div
                class="absolute left-0 right-0 top-1/2 h-[10px] -translate-y-1/2 overflow-hidden rounded-full bg-bg-200"
              >
                <div
                  class="relative h-full rounded-full transition-[width] duration-500 ease-out"
                  :class="
                    status === 'FAILED'
                      ? 'bg-status-error'
                      : 'bg-gradient-to-r from-primary via-[#FFAA63] to-[#FFC48E]'
                  "
                  :style="{ width: `${progressPercent}%` }"
                >
                  <!-- 완료 시 초록을 opacity로 페이드해 채움(width)과 색 전환이 자연스럽게 겹치게 한다. -->
                  <div
                    class="absolute inset-0 rounded-full bg-[#2EB97F] transition-opacity duration-700 ease-out"
                    :class="status === 'COMPLETED' ? 'opacity-100' : 'opacity-0'"
                  />
                </div>
              </div>
              <div
                class="absolute top-0 z-10"
                :class="pipelineCharacterMotionClasses"
                :style="pipelineCharacterStyle"
              >
                <img
                  :src="pipelineCharacterImageUrl"
                  :alt="pipelineCharacterAlt"
                  class="max-w-none object-contain drop-shadow-[0_10px_16px_rgba(15,23,42,0.12)]"
                  :class="pipelineCharacterClasses"
                />
              </div>
            </div>

            <div class="mt-1 flex items-center justify-between gap-3">
              <span
                data-testid="admin-ingest-status-pill"
                class="inline-flex items-center rounded-full px-3 py-1 text-[0.72rem] font-semibold"
                :class="pipelineStatusClasses"
              >
                {{ pipelineStatusLabel }}
              </span>
              <span
                data-testid="admin-ingest-progress-percent"
                class="text-[0.92rem] font-bold tracking-[-0.03em] text-overlay-dark-80"
              >
                {{ progressPercent }}%
              </span>
            </div>

            <div class="mt-4 grid gap-3 sm:grid-cols-4">
              <div class="rounded-2xl bg-bg-100 px-4 py-3">
                <p class="text-[0.66rem] text-overlay-dark-40">수집 / 전체</p>
                <p
                  data-testid="admin-ingest-metric-processed"
                  class="mt-1 text-[1rem] font-bold tracking-[-0.03em] text-overlay-dark-80"
                >
                  {{ processedMetricText }}
                </p>
              </div>
              <div class="rounded-2xl bg-bg-100 px-4 py-3">
                <p class="text-[0.66rem] text-overlay-dark-40">경과</p>
                <p
                  data-testid="admin-ingest-metric-elapsed"
                  class="mt-1 text-[1rem] font-bold tracking-[-0.03em] text-overlay-dark-80"
                >
                  {{ ingestElapsedText }}
                </p>
              </div>
              <div class="rounded-2xl bg-bg-100 px-4 py-3">
                <p class="text-[0.66rem] text-overlay-dark-40">ETA</p>
                <p
                  data-testid="admin-ingest-metric-eta"
                  class="mt-1 text-[1rem] font-bold tracking-[-0.03em] text-overlay-dark-80"
                >
                  {{ ingestEtaText }}
                </p>
              </div>
              <div class="rounded-2xl bg-bg-100 px-4 py-3">
                <p class="text-[0.66rem] text-overlay-dark-40">속도</p>
                <p class="mt-1 text-[0.92rem] font-bold tracking-[-0.03em] text-overlay-dark-80">
                  {{ ingestSpeedText }}
                </p>
              </div>
            </div>

            <div
              data-testid="admin-ingest-action-hint"
              class="mt-4 rounded-2xl bg-primary/[0.06] px-4 py-3 text-[0.76rem] leading-6 text-overlay-dark-60"
            >
              {{ pipelineActionHint }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 데이터 현황 -->
    <section v-if="adminDataOverview" class="mb-6">
      <h3 class="mb-3 text-[0.95rem] font-semibold text-overlay-dark-80">데이터 현황</h3>

      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <!-- 마지막 동기화 -->
        <article
          class="col-span-2 flex items-center justify-between gap-2.5 rounded-2xl border border-bg-300/60 bg-primary-white py-4 pl-5 pr-2 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
        >
          <div class="min-w-0">
            <p class="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-overlay-dark-40">
              마지막 동기화
            </p>
            <p
              data-testid="admin-last-sync-at"
              class="mt-1.5 text-[1.35rem] font-extrabold tracking-[-0.04em] text-overlay-dark-80"
            >
              {{ formatDateTime(adminDataOverview.lastSyncAt) }}
            </p>
            <p class="mt-1.5 flex items-center gap-1.5 text-[0.7rem] text-overlay-dark-40">
              <span
                aria-hidden="true"
                class="size-1.5 rounded-full"
                :class="isLastSyncStale ? 'bg-status-warning' : 'bg-status-success'"
              />
              {{ lastSyncRelativeText }}
            </p>
          </div>
          <img
            :src="linaDeskImageUrl"
            alt=""
            class="h-[84px] w-auto shrink-0 object-contain drop-shadow-[0_8px_10px_rgba(15,23,42,0.08)]"
          />
        </article>

        <!-- 최근 동기화 · 업데이트 페이지 바차트 -->
        <article
          data-testid="admin-sync-bar-chart"
          class="col-span-2 row-span-2 flex min-h-[150px] flex-col rounded-2xl border border-bg-300/60 bg-primary-white px-[18px] py-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
        >
          <div class="flex items-baseline justify-between gap-2">
            <p class="text-[0.7rem] text-overlay-dark-40">최근 동기화 · 업데이트 페이지</p>
            <p class="text-[0.6rem] text-overlay-dark-20">{{ syncChartMaxLabel }}</p>
          </div>
          <div v-if="syncChartBars.length > 0" class="mt-3.5 flex flex-1 items-stretch gap-1.5">
            <div
              v-for="bar in syncChartBars"
              :key="bar.syncId"
              class="relative flex flex-1 flex-col items-center gap-1.5"
              @mouseenter="hoveredBarId = bar.syncId"
              @mouseleave="hoveredBarId = null"
            >
              <div class="flex w-full flex-1 items-end justify-center">
                <!-- 바 element에 relative 적용 → 툴팁이 바 상단 바로 위에 밀착 -->
                <div
                  class="relative w-full max-w-7 rounded-t transition-opacity duration-150"
                  :class="
                    bar.isFailed
                      ? 'bg-bg-300'
                      : bar.isLatest || hoveredBarId === bar.syncId
                        ? 'bg-gradient-to-b from-primary-light to-primary'
                        : 'bg-gradient-to-b from-primary-light to-primary opacity-50'
                  "
                  :style="{ height: `${bar.heightPercent}%` }"
                >
                  <!-- 툴팁: bottom-full 로 바 상단 바로 위 -->
                  <div
                    v-if="hoveredBarId === bar.syncId"
                    class="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg border border-bg-300/60 bg-primary-white px-2.5 py-1.5 text-[0.66rem] shadow-[0_6px_16px_-8px_rgba(15,23,42,0.25)]"
                  >
                    <p
                      class="font-semibold"
                      :class="bar.isFailed ? 'text-status-error' : 'text-overlay-dark-80'"
                    >
                      {{ bar.label }}{{ bar.timeLabel ? ` ${bar.timeLabel}` : '' }}
                      <b v-if="!bar.isFailed" class="text-primary"
                        >{{ formatNumber(bar.updatedPages) }}p</b
                      >
                      <span v-else>수집 실패</span>
                    </p>
                  </div>
                </div>
              </div>
              <span
                class="text-center text-[0.58rem] leading-tight"
                :class="bar.isLatest ? 'font-bold text-primary' : 'text-overlay-dark-40'"
              >
                {{ bar.label }}
                <span
                  v-if="bar.timeLabel"
                  class="block text-[0.54rem] font-normal"
                  :class="bar.isLatest ? 'text-primary/70' : 'text-overlay-dark-20'"
                >
                  {{ bar.timeLabel }}
                </span>
              </span>
            </div>
          </div>
          <p
            v-else
            class="flex flex-1 items-center justify-center text-[0.74rem] text-overlay-dark-40"
          >
            아직 동기화 이력이 없습니다
          </p>
        </article>

        <!-- VectorDB 스토리지 -->
        <article
          data-testid="admin-data-card-vectorDbSize"
          class="col-span-2 rounded-2xl border bg-primary-white px-[18px] py-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
          :class="isVectorDbLow ? 'border-status-error/40' : 'border-bg-300/60'"
        >
          <div class="mb-3 flex items-baseline justify-between gap-2">
            <p class="text-[0.7rem] text-overlay-dark-40">VectorDB 스토리지</p>
            <p
              data-testid="admin-data-card-totalChunks"
              class="text-[0.66rem] text-overlay-dark-30"
            >
              청크 {{ formatNumber(adminDataOverview.totalChunks) }}개
            </p>
          </div>

          <div class="flex items-center gap-5">
            <div class="shrink-0">
              <svg viewBox="0 0 36 52" width="36" height="52" aria-hidden="true">
                <defs>
                  <clipPath id="vdb-body-clip">
                    <rect x="0" y="8" width="36" height="36" />
                  </clipPath>
                </defs>
                <rect x="0" y="8" width="36" height="36" fill="#e4e6e8" />
                <rect
                  x="0"
                  :y="8 + 36 * (1 - vectorDbUsagePercent / 100)"
                  width="36"
                  :height="36 * (vectorDbUsagePercent / 100)"
                  :fill="vectorDbFillColor"
                  clip-path="url(#vdb-body-clip)"
                />
                <ellipse
                  cx="18"
                  cy="44"
                  rx="18"
                  ry="7"
                  :fill="vectorDbUsagePercent > 3 ? vectorDbFillColor : '#d6d8da'"
                />
                <ellipse
                  v-if="vectorDbUsagePercent > 3 && vectorDbUsagePercent < 90"
                  cx="18"
                  :cy="8 + 36 * (1 - vectorDbUsagePercent / 100)"
                  rx="18"
                  ry="7"
                  :fill="vectorDbFillColor"
                />
                <ellipse
                  cx="18"
                  cy="20"
                  rx="18"
                  ry="7"
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  stroke-width="1.5"
                />
                <ellipse
                  cx="18"
                  cy="32"
                  rx="18"
                  ry="7"
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  stroke-width="1.5"
                />
                <ellipse
                  cx="18"
                  cy="8"
                  rx="18"
                  ry="7"
                  :fill="vectorDbUsagePercent >= 90 ? vectorDbFillColor : '#f2f3f5'"
                />
                <ellipse
                  cx="18"
                  cy="8"
                  rx="18"
                  ry="7"
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  stroke-width="1.5"
                />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-[1.3rem] font-bold tracking-[-0.05em] text-overlay-dark-80">
                {{ adminDataOverview.vectorDbSize }}
                <span class="text-[0.78rem] font-normal text-overlay-dark-30">
                  / {{ VECTOR_DB_CAPACITY_GB }} GB
                </span>
              </p>
              <div class="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-bg-200">
                <div
                  class="h-full rounded-full transition-[width] duration-700 ease-out"
                  :style="{
                    width: `${vectorDbUsagePercent}%`,
                    background: vectorDbFillColor,
                  }"
                />
              </div>
              <p class="mt-1 text-[0.62rem] text-overlay-dark-30">
                {{ vectorDbUsagePercent }}% 사용 중
              </p>
              <div
                v-if="isVectorDbLow"
                class="mt-2 flex items-start gap-1.5 text-[0.7rem] text-status-error"
              >
                <AlertTriangle aria-hidden="true" class="mt-px size-3 shrink-0" />
                <p>저장공간이 부족합니다. 프로그램 책임자에게 문의하세요.</p>
              </div>
            </div>
          </div>
        </article>

        <!-- 스페이스 / 페이지 / 첨부파일 -->
        <article
          class="col-span-2 rounded-2xl border border-bg-300/60 bg-primary-white px-[18px] py-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
        >
          <div class="flex h-full items-stretch">
            <div
              v-for="(card, index) in contentVolumeCards"
              :key="card.testId"
              :data-testid="`admin-data-card-${card.testId}`"
              class="flex flex-1 flex-col justify-center"
              :class="index > 0 ? 'ml-4 border-l border-bg-200 pl-4' : ''"
            >
              <p class="text-[0.7rem] text-overlay-dark-40">{{ card.label }}</p>
              <p class="mt-1.5 text-[1.4rem] font-bold tracking-[-0.05em] text-overlay-dark-80">
                {{ card.value }}
              </p>
            </div>
          </div>
        </article>

        <!-- 동기화 소요시간 추이 -->
        <article
          data-testid="admin-sync-duration-chart"
          class="group relative col-span-2 rounded-2xl border border-bg-300/60 bg-primary-white px-[18px] py-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
        >
          <div class="flex items-baseline justify-between gap-2">
            <p class="text-[0.7rem] text-overlay-dark-40">동기화 소요시간 추이 (초)</p>
          </div>

          <template v-if="durationChart">
            <div class="relative mt-2.5 h-14 w-full">
              <div
                class="pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-bg-300/60 bg-primary-white px-2.5 py-1.5 text-[0.66rem] shadow-[0_6px_16px_-8px_rgba(15,23,42,0.25)] transition-[left,top,opacity] duration-150"
                :class="hoveredDurationPoint ? 'opacity-100' : 'opacity-0'"
                :style="
                  displayedDurationPoint
                    ? {
                        left: `clamp(42px, ${displayedDurationPoint.xPercent}%, calc(100% - 42px))`,
                        top: `calc(${displayedDurationPoint.yPercent}% - 38px)`,
                      }
                    : { left: '50%', top: '0' }
                "
              >
                <p
                  class="font-semibold"
                  :class="
                    displayedDurationPoint?.isFailed ? 'text-status-error' : 'text-overlay-dark-80'
                  "
                >
                  {{ displayedDurationPoint?.dateLabel }}
                  <b class="text-primary">{{ displayedDurationPoint?.durationSeconds }}초</b>
                </p>
                <p class="mt-0.5 text-overlay-dark-40">
                  평균 <b class="text-primary">{{ durationChart.averageDuration }}초</b>
                </p>
              </div>
              <svg
                viewBox="0 0 300 56"
                preserveAspectRatio="none"
                class="absolute inset-0 h-full w-full"
              >
                <defs>
                  <linearGradient id="adminSyncDurationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stop-color="var(--color-primary)" stop-opacity="0.14" />
                    <stop offset="1" stop-color="var(--color-primary)" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="durationChart.areaPath" fill="url(#adminSyncDurationGradient)" />
                <path
                  :d="durationChart.linePath"
                  fill="none"
                  stroke="var(--color-primary)"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  vector-effect="non-scaling-stroke"
                />
              </svg>
              <span
                v-for="point in durationChart.points"
                :key="point.syncId"
                class="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer p-[8px]"
                :style="{ left: `${point.xPercent}%`, top: `${point.yPercent}%` }"
                @mouseenter="hoveredDurationPoint = point"
                @mouseleave="hoveredDurationPoint = null"
              >
                <span
                  class="block rounded-full border-[1.5px] bg-primary-white transition-transform duration-150"
                  :class="[
                    point.isFailed ? 'border-status-error' : 'border-primary',
                    point.isLatest ? 'size-[9px]' : 'size-[7px]',
                    hoveredDurationPoint?.syncId === point.syncId ? 'scale-150' : '',
                  ]"
                />
              </span>
            </div>
          </template>
          <p
            v-else
            class="flex h-14 items-center justify-center text-[0.74rem] text-overlay-dark-40"
          >
            아직 동기화 이력이 없습니다
          </p>
        </article>
      </div>
    </section>

    <!-- 최근 동기화 이력 -->
    <section>
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-[0.95rem] font-semibold text-overlay-dark-80">최근 동기화 이력</h3>
        <button
          type="button"
          data-testid="admin-sync-view-all-button"
          class="text-[0.8rem] font-medium text-primary transition-colors hover:text-primary/70"
          @click="emit('view-all-sync')"
        >
          전체 보기
        </button>
      </div>

      <EmptyState
        v-if="adminSyncHistory.length === 0"
        data-testid="admin-sync-empty"
        class="rounded-2xl border border-bg-300/60 bg-primary-white py-10"
        title="최근 동기화 이력이 없습니다"
        description="관리자 수집 작업이 시작되면 최근 이력이 여기에 표시됩니다."
      />

      <div
        v-else
        class="overflow-hidden rounded-2xl border border-bg-300/60 bg-primary-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
      >
        <div
          class="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1.3fr] border-b border-bg-200 bg-bg-100 px-6 py-3 text-[0.7rem] font-semibold uppercase tracking-wider text-overlay-dark-40"
        >
          <span>상태</span>
          <span>업데이트</span>
          <span>삭제</span>
          <span>소요시간</span>
          <span>완료시각</span>
        </div>

        <div
          v-for="syncItem in adminSyncHistory"
          :key="syncItem.syncId"
          :data-testid="`admin-sync-row-${syncItem.syncId}`"
          class="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr_1.3fr] border-t border-bg-200/60 px-6 py-3.5 text-[0.85rem] transition-colors first:border-t-0 hover:bg-bg-200/40"
        >
          <span>
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold"
              :class="getStatusClasses(syncItem.status)"
            >
              {{ getStatusLabel(syncItem.status) }}
            </span>
          </span>
          <span class="text-overlay-dark-80">{{ formatNumber(syncItem.updatedPages) }}개</span>
          <span class="text-overlay-dark-80">{{ formatNumber(syncItem.deletedPages) }}개</span>
          <span class="text-overlay-dark-80">{{ formatNumber(syncItem.duration) }}초</span>
          <span class="text-overlay-dark-60">{{ formatDateTime(syncItem.completedAt) }}</span>
        </div>
      </div>
    </section>
  </section>
</template>
