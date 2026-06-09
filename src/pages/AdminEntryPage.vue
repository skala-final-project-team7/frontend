<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin 운영 메인 보드(SCR-800) 화면 구현.
          관리자 전용 데이터 수집 현황 및 최근 동기화 이력을 표시한다.
작성일 : 2026-06-09
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-05, feature12 구현, /admin placeholder route 추가
  - 2026-06-09, feature14 구현, Admin shell 및 데이터 수집 메인 보드 추가
  - 2026-06-09, 디자인 개선, 섹션 전환 nav, 운영 레이아웃 전면 개선
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import {
  ArrowLeft,
  Database,
  Info,
  LayoutDashboard,
  MessageSquareQuote,
  RefreshCw,
  ShieldAlert,
} from '@lucide/vue';

import { getAdminDataOverview, getAdminSyncHistory, getCurrentUser } from '@/api';
import { useToast } from '@/composables/useToast';
import { useAdminIngestStore } from '@/stores';
import type {
  AdminDataOverview,
  AdminIngestJobStatus,
  AdminSyncHistoryResponse,
  AdminSyncStatus,
  CurrentUser,
} from '@/types/api';
import {
  BaseButton,
  BaseSpinner,
  EmptyState,
  ErrorRetryState,
  linaAdminImageUrl,
  linaFlagImageUrl,
  linaRunningImageUrl,
  mascotWrongImageUrl,
} from '@/shared';

const router = useRouter();
const isLoading = ref(true);
const errorMessage = ref('');
const currentUser = ref<CurrentUser | null>(null);
const adminDataOverview = ref<AdminDataOverview | null>(null);
const adminSyncHistory = ref<AdminSyncHistoryResponse['syncHistory']>([]);
const adminActionHint = ref(
  '데이터 불러오기 버튼을 누르면 Admin Key 활성화 후 전체 수집을 시작합니다.',
);
const { showToast } = useToast();
const adminIngestStore = useAdminIngestStore();
const {
  averagePagesPerSecond,
  failedPages,
  formattedElapsed,
  formattedEta,
  isActivatingKey,
  isPolling,
  isStartingIngest,
  lastError,
  processedPages,
  progressPercent,
  status,
  totalPages,
} = storeToRefs(adminIngestStore);

const isAccessDenied = computed(() => currentUser.value?.role !== 'ADMIN');
const shouldShowRetryIngest = computed(() => status.value === 'FAILED');
const shouldDisablePipelineActions = computed(
  () =>
    isActivatingKey.value ||
    isStartingIngest.value ||
    (isPolling.value && status.value !== 'FAILED' && status.value !== 'COMPLETED'),
);

type SectionKey = 'operations' | 'dashboard' | 'feedback' | 'sync';
const activeSection = ref<SectionKey>('operations');

const navigationItems: { key: SectionKey; label: string; icon: unknown }[] = [
  { key: 'operations', label: '운영', icon: Database },
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'feedback', label: '피드백', icon: MessageSquareQuote },
  { key: 'sync', label: '동기화 이력', icon: RefreshCw },
];

type AdminDisplayStatus = AdminSyncStatus | AdminIngestJobStatus;

// ── feature14 운영 보드 ──────────────────────────────────────────────
const dataOverviewCards = computed(() => {
  if (!adminDataOverview.value) return [];
  return [
    {
      testId: 'totalSpaces',
      label: '스페이스',
      value: formatNumber(adminDataOverview.value.totalSpaces),
    },
    {
      testId: 'totalPages',
      label: '페이지',
      value: formatNumber(adminDataOverview.value.totalPages),
    },
    {
      testId: 'totalAttachments',
      label: '첨부파일',
      value: formatNumber(adminDataOverview.value.totalAttachments),
    },
    { testId: 'vectorDbSize', label: 'VectorDB', value: adminDataOverview.value.vectorDbSize },
    {
      testId: 'totalChunks',
      label: '청크',
      value: formatNumber(adminDataOverview.value.totalChunks),
    },
  ];
});

const pipelineStatusLabel = computed(() => status.value || 'IDLE');
const pipelineStatusClasses = computed(() =>
  status.value ? getStatusClasses(status.value) : 'bg-bg-200 text-overlay-dark-80',
);
const ingestPrimaryButtonLabel = computed(() => {
  if (isStartingIngest.value) {
    return '데이터 불러오는 중';
  }

  if (shouldShowRetryIngest.value) {
    return '다시 시도';
  }

  return '데이터 불러오기';
});
const pipelineDescription = computed(() => {
  if (lastError.value) {
    return lastError.value;
  }

  switch (status.value) {
    case 'STARTED':
      return 'Confluence 제한 문서를 확인하고 수집 작업을 준비하고 있습니다.';
    case 'IN_PROGRESS':
      return failedPages.value > 0
        ? '허용 사용자 기준 문서를 수집 중이며 재시도 대상 문서를 함께 정리하고 있습니다.'
        : '허용 사용자 기준 Confluence 제한 문서를 순차적으로 수집하고 있습니다.';
    case 'COMPLETED':
      return '전체 수집이 완료되었습니다. 최신 동기화 현황이 아래 카드에 반영됩니다.';
    case 'FAILED':
      return '수집 작업이 완료되지 않았습니다. 다시 시도해주세요.';
    default:
      return '사용자별 문서를 최신 상태로 유지합니다.';
  }
});
const pipelineActionHint = computed(() => {
  if (isActivatingKey.value) {
    return 'API Key를 발급하고 있습니다.';
  }

  if (isStartingIngest.value) {
    return '데이터 수집을 시작하고 있습니다.';
  }

  return adminActionHint.value;
});
const pipelineCharacterImageUrl = computed(() =>
  status.value === 'COMPLETED' ? linaFlagImageUrl : linaRunningImageUrl,
);
const pipelineCharacterAlt = computed(() =>
  status.value === 'COMPLETED' ? '수집 완료' : '수집 진행 중',
);
const pipelineCharacterStyle = computed(() =>
  status.value === 'COMPLETED'
    ? {
        left: `calc(${progressPercent.value}% - 44px)`,
        top: '-1.6rem',
      }
    : {
        left: `calc(${progressPercent.value}% - 36px)`,
        top: '-0.15rem',
      },
);
const pipelineCharacterClasses = computed(() =>
  status.value === 'COMPLETED' ? 'h-[8rem] w-[8rem] scale-[1.18]' : 'h-[4.75rem] w-[4.75rem]',
);
const processedMetricText = computed(
  () => `${formatNumber(processedPages.value)} / ${formatNumber(totalPages.value)}`,
);
const ingestEtaText = computed(() =>
  status.value && formattedEta.value !== '계산 중' ? formattedEta.value : '-',
);
const ingestSpeedText = computed(() =>
  status.value && averagePagesPerSecond.value > 0
    ? `${averagePagesPerSecond.value.toFixed(1)} page/s`
    : '-',
);

onMounted(() => {
  void loadAdminBoard();
});

watch(status, (nextStatus, previousStatus) => {
  if (!nextStatus || nextStatus === previousStatus) {
    return;
  }

  if (nextStatus === 'COMPLETED') {
    adminActionHint.value = '데이터 수집이 완료되었습니다.';
    showToast('데이터 불러오기가 완료되었습니다.', { variant: 'success' });
    void refreshAdminBoardData();
    return;
  }

  if (nextStatus === 'FAILED') {
    adminActionHint.value = '데이터 수집이 실패했습니다. 다시 시도해 주세요.';
    showToast('데이터 불러오기가 실패했습니다. 다시 시도해 주세요.', { variant: 'error' });
    void refreshAdminBoardData();
  }
});

watch(lastError, (nextError) => {
  if (!nextError) {
    return;
  }

  adminActionHint.value = nextError;
});

async function loadAdminBoard() {
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const user = await getCurrentUser();
    currentUser.value = user;
    if (user.role !== 'ADMIN') {
      adminDataOverview.value = null;
      adminSyncHistory.value = [];
      return;
    }
    await refreshAdminBoardData();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '관리자 데이터를 불러오는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
}

function reloadAdminBoard() {
  window.location.reload();
}

async function refreshAdminBoardData() {
  const [dataOverview, syncHistory] = await Promise.all([
    getAdminDataOverview(),
    getAdminSyncHistory(),
  ]);
  adminDataOverview.value = dataOverview;
  adminSyncHistory.value = syncHistory.syncHistory;
}

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

function getStatusLabel(status: AdminSyncStatus): string {
  return status;
}

function getStatusClasses(status: AdminDisplayStatus): string {
  if (status === 'FAILED') return 'bg-status-error/10 text-status-error';
  if (status === 'COMPLETED') return 'bg-[#F0FDF4] text-[#22C55E]';
  if (status === 'IN_PROGRESS') return 'bg-primary/8 text-primary';
  if (status === 'STARTED') return 'bg-[#EFF6FF] text-[#3B82F6]';
  return 'bg-bg-300 text-overlay-dark-60';
}

function goToLogin() {
  void router.push('/login');
}

async function handleActivateAdminKey() {
  try {
    const activated = await adminIngestStore.ensureAdminKeyActive();
    adminActionHint.value = `Admin Key 활성 완료: ${formatDateTime(activated ?? '')}까지 사용 가능합니다.`;
    showToast('Admin Key를 활성화했습니다.', { variant: 'success' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Admin Key를 활성화하는 중 오류가 발생했습니다.';
    adminActionHint.value = message;
    showToast(message, { variant: 'error' });
  }
}

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
</script>

<template>
  <main data-testid="admin-entry-page" class="min-h-screen bg-bg-100 text-overlay-dark-80">
    <!-- 로딩 -->
    <section v-if="isLoading" class="flex min-h-screen items-center justify-center">
      <BaseSpinner label="관리자 보드를 불러오고 있습니다" />
    </section>

    <!-- 에러 -->
    <section
      v-else-if="errorMessage"
      data-testid="admin-board-error"
      class="flex min-h-screen items-center justify-center"
    >
      <div class="flex flex-col items-center">
        <img :src="mascotWrongImageUrl" alt="" class="mb-4 h-24 w-24 object-contain" />
        <ErrorRetryState
          title="관리자 보드를 불러오지 못했습니다"
          :message="errorMessage"
          retry-label="보드 다시 불러오기"
          data-testid="admin-board-retry"
          @retry="reloadAdminBoard"
        />
      </div>
    </section>

    <!-- 권한 없음 -->
    <section
      v-else-if="isAccessDenied"
      data-testid="admin-access-denied"
      class="flex min-h-screen items-center justify-center"
    >
      <div class="max-w-sm text-center">
        <div
          class="mx-auto flex size-14 items-center justify-center rounded-full bg-status-error/10 text-status-error"
        >
          <ShieldAlert aria-hidden="true" class="size-7" />
        </div>
        <h1 class="mt-5 text-heading font-semibold text-overlay-dark-80">
          관리자 권한이 없는 계정입니다
        </h1>
        <p class="mt-3 text-body text-overlay-dark-40">
          관리자 화면은 ADMIN 권한이 확인된 사용자만 접근할 수 있습니다.
        </p>
        <div class="mt-6">
          <BaseButton
            data-testid="admin-access-denied-login-button"
            variant="primary"
            class="font-normal"
            @click="goToLogin"
          >
            <ArrowLeft aria-hidden="true" class="size-4" />
            Login 화면으로 돌아가기
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- 메인 레이아웃 -->
    <div v-else data-testid="admin-page" class="flex h-screen overflow-hidden">
      <!-- ── 사이드바 ── -->
      <aside
        class="flex h-screen w-[220px] shrink-0 flex-col border-r border-bg-300/60 bg-primary-white"
      >
        <!-- 로고 -->
        <div class="border-b border-bg-300/60 px-7 py-6">
          <h1 class="text-[1.35rem] font-bold tracking-[-0.06em] text-overlay-dark-80">LINA</h1>
          <p class="mt-0.5 text-[0.74rem] text-overlay-dark-40">Admin</p>
        </div>

        <!-- 내비게이션 -->
        <nav data-testid="admin-nav" class="flex-1 space-y-0.5 px-3 py-5">
          <button
            v-for="item in navigationItems"
            :key="item.key"
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[0.875rem] transition-colors"
            :class="
              activeSection === item.key
                ? 'bg-primary/8 font-semibold text-primary'
                : 'font-normal text-overlay-dark-40 hover:bg-bg-200 hover:text-overlay-dark-80'
            "
            :aria-current="activeSection === item.key ? 'page' : undefined"
            @click="activeSection = item.key"
          >
            <component
              :is="item.icon"
              class="size-4 shrink-0"
              :class="activeSection === item.key ? 'text-primary' : 'text-overlay-dark-40'"
              aria-hidden="true"
            />
            {{ item.label }}
          </button>
        </nav>

        <!-- 프로필 -->
        <div class="border-t border-bg-300/60 px-4 py-4">
          <div class="flex items-center gap-3 rounded-xl bg-bg-100 px-3 py-2.5">
            <img
              :src="currentUser?.profileImageUrl || linaAdminImageUrl"
              alt=""
              class="size-8 rounded-lg border border-bg-300/60 object-cover"
            />
            <div class="min-w-0">
              <p
                data-testid="admin-profile-name"
                class="truncate text-[0.82rem] font-semibold text-overlay-dark-80"
              >
                {{ currentUser?.name }}
              </p>
              <p
                data-testid="admin-profile-email"
                class="truncate text-[0.7rem] text-overlay-dark-40"
              >
                {{ currentUser?.email }}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <!-- ── 메인 콘텐츠 ── -->
      <div class="h-screen flex-1 overflow-y-auto bg-bg-100">
        <!-- ── 운영 (SCR-800) ── -->
        <section v-if="activeSection === 'operations'" class="px-8 py-8">
          <header class="mb-7">
            <h2 class="text-[1.55rem] font-bold tracking-[-0.04em] text-overlay-dark-80">운영</h2>
            <p class="mt-1 text-[0.88rem] text-overlay-dark-40">데이터 수집 및 동기화 관리</p>
          </header>

          <!-- 데이터 파이프라인 -->
          <div
            data-testid="admin-ingest-pipeline-card"
            class="mb-6 rounded-[1.75rem] border border-bg-300/70 bg-primary-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
          >
            <div class="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
              <div class="lg:pr-4">
                <h3 class="text-[1.08rem] font-semibold tracking-[-0.03em] text-overlay-dark-80">
                  데이터 파이프라인
                </h3>
                <p class="mt-2 text-[0.8rem] leading-6 text-overlay-dark-40">
                  {{ pipelineDescription }}
                </p>
                <div class="mt-5 flex flex-wrap gap-2">
                  <BaseButton
                    variant="secondary"
                    data-testid="admin-activate-key-button"
                    :disabled="shouldDisablePipelineActions"
                    @click="handleActivateAdminKey"
                  >
                    {{ isActivatingKey ? 'API 키 발급 중' : 'API 키 발급' }}
                  </BaseButton>
                  <BaseButton
                    variant="primary"
                    data-testid="admin-start-ingest-button"
                    :disabled="shouldDisablePipelineActions"
                    @click="handleStartIngest"
                  >
                    {{ ingestPrimaryButtonLabel }}
                  </BaseButton>
                </div>
                <div class="mt-3 flex items-center gap-1.5 text-[0.72rem] text-overlay-dark-40">
                  <Info aria-hidden="true" class="size-3.5 shrink-0" />
                  <p>새로고침하면 진행 상태가 초기화될 수 있습니다.</p>
                </div>
              </div>

              <div
                class="min-w-0 border-t border-bg-200 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"
              >
                <div class="relative px-1">
                  <div class="relative h-20">
                    <div
                      class="absolute left-0 right-0 top-1/2 h-[10px] -translate-y-1/2 overflow-hidden rounded-full bg-bg-200"
                    >
                      <div
                        class="h-full rounded-full transition-[width] duration-500 ease-out"
                        :class="
                          status === 'COMPLETED'
                            ? 'bg-[#2EB97F]'
                            : status === 'FAILED'
                              ? 'bg-status-error'
                              : 'bg-gradient-to-r from-primary via-[#FFAA63] to-[#FFC48E]'
                        "
                        :style="{ width: `${progressPercent}%` }"
                      />
                    </div>
                    <div
                      class="absolute top-0 z-10 transition-[left] duration-500 ease-out"
                      :style="pipelineCharacterStyle"
                    >
                      <img
                        :src="pipelineCharacterImageUrl"
                        :alt="pipelineCharacterAlt"
                        class="object-contain drop-shadow-[0_10px_16px_rgba(15,23,42,0.12)]"
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
                        {{ formattedElapsed }}
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
                      <p
                        class="mt-1 text-[0.92rem] font-bold tracking-[-0.03em] text-overlay-dark-80"
                      >
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
          <section class="mb-6">
            <h3 class="mb-3 text-[0.95rem] font-semibold text-overlay-dark-80">데이터 현황</h3>

            <div
              class="mb-3 rounded-2xl border border-primary/25 bg-primary-white px-6 py-4 shadow-[0_2px_10px_rgba(244,129,34,0.08)]"
            >
              <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-primary">
                마지막 동기화
              </p>
              <p
                data-testid="admin-last-sync-at"
                class="mt-1.5 text-[1.3rem] font-bold tracking-[-0.04em] text-overlay-dark-80"
              >
                {{ adminDataOverview ? formatDateTime(adminDataOverview.lastSyncAt) : '—' }}
              </p>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <article
                v-for="card in dataOverviewCards"
                :key="card.testId"
                :data-testid="`admin-data-card-${card.testId}`"
                class="rounded-2xl border border-bg-300/60 bg-primary-white px-5 py-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
              >
                <p class="text-[0.7rem] text-overlay-dark-40">{{ card.label }}</p>
                <p class="mt-2 text-[1.4rem] font-bold tracking-[-0.05em] text-overlay-dark-80">
                  {{ card.value }}
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
                disabled
                class="text-[0.8rem] font-medium text-primary/70 disabled:cursor-default"
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
                <span class="text-overlay-dark-80"
                  >{{ formatNumber(syncItem.updatedPages) }}개</span
                >
                <span class="text-overlay-dark-80"
                  >{{ formatNumber(syncItem.deletedPages) }}개</span
                >
                <span class="text-overlay-dark-80">{{ formatNumber(syncItem.duration) }}초</span>
                <span class="text-overlay-dark-60">{{ formatDateTime(syncItem.completedAt) }}</span>
              </div>
            </div>
          </section>
        </section>

        <!-- ── 준비 중 섹션 (대시보드 / 피드백 / 동기화 이력) ── -->
        <section v-else class="flex h-full min-h-[60vh] items-center justify-center">
          <div class="text-center">
            <p class="text-[0.9rem] font-medium text-overlay-dark-80">
              {{
                activeSection === 'dashboard'
                  ? '대시보드'
                  : activeSection === 'feedback'
                    ? '피드백'
                    : '동기화 이력'
              }}
            </p>
            <p class="mt-2 text-[0.82rem] text-overlay-dark-40">이 기능은 곧 제공될 예정입니다.</p>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
