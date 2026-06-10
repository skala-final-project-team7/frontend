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
  - 2026-06-10, 디자인 개선, 데이터 현황 섹션을 벤토 레이아웃(동기화 바차트·소요시간 추이 포함)으로 교체
  - 2026-06-10, UI/UX 개선, IDLE 파이프라인 정리(메트릭/캐릭터/힌트), 상태 한글 라벨, 차트 라벨·점 보정, stale LED, 전체 보기 연결
  - 2026-06-10, 캐릭터 연출 보강, IDLE 대기 캐릭터(lina-waiting) 추가·완료 캐릭터 확대 및 위치 조정·카드 높이 고정
  - 2026-06-10, 카피·연출 정리, 진행 문구 자연스럽게 수정(Confluence 표현 제거), 완료 캐릭터 우측 이동·전환 잔상 제거, multiply 블렌드 제거
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
  AlertTriangle,
  ArrowLeft,
  Database,
  HardDriveDownload,
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
  linaDeskImageUrl,
  linaFlagImageUrl,
  linaRunningImageUrl,
  linaWaitingImageUrl,
  mascotWrongImageUrl,
} from '@/shared';

const router = useRouter();
const isLoading = ref(true);
const errorMessage = ref('');
const currentUser = ref<CurrentUser | null>(null);
const adminDataOverview = ref<AdminDataOverview | null>(null);
const adminSyncHistory = ref<AdminSyncHistoryResponse['syncHistory']>([]);
const DEFAULT_ADMIN_ACTION_HINT =
  '데이터 불러오기 버튼을 누르면 Admin Key 활성화 후 전체 수집을 시작합니다.';
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

const isAccessDenied = computed(() => currentUser.value?.role !== 'ADMIN');
const shouldShowRetryIngest = computed(() => status.value === 'FAILED');
const shouldDisablePipelineActions = computed(
  () =>
    isStartingIngest.value ||
    (isPolling.value && status.value !== 'FAILED' && status.value !== 'COMPLETED'),
);

type SectionKey = 'operations' | 'dashboard' | 'feedback' | 'sync';
const activeSection = ref<SectionKey>('operations');

const navigationItems: { key: SectionKey; label: string; icon: unknown }[] = [
  { key: 'operations', label: '문서 데이터 관리', icon: Database },
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'feedback', label: '피드백', icon: MessageSquareQuote },
  { key: 'sync', label: '동기화 이력', icon: RefreshCw },
];

type AdminDisplayStatus = AdminSyncStatus | AdminIngestJobStatus;

// ── feature14 운영 보드 ──────────────────────────────────────────────
const contentVolumeCards = computed(() => {
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
  ];
});

const lastSyncRelativeText = computed(() =>
  adminDataOverview.value ? formatRelativeTime(adminDataOverview.value.lastSyncAt) : '',
);

// 마지막 동기화가 24시간을 넘기면 LED를 경고색으로 바꿔 지연을 드러낸다.
const isLastSyncStale = computed(() => {
  if (!adminDataOverview.value) {
    return false;
  }
  return Date.now() - new Date(adminDataOverview.value.lastSyncAt).getTime() > 24 * 60 * 60_000;
});

// 데이터 현황 차트는 GET /api/admin/sync 의 syncHistory(최신순)를 최근 7건만
// 시간순(과거→최신)으로 뒤집어 그린다.
const MAX_SYNC_CHART_ITEMS = 7;

const recentSyncItemsChronological = computed(() =>
  [...adminSyncHistory.value.slice(0, MAX_SYNC_CHART_ITEMS)].reverse(),
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
  if (syncItems.length === 0) {
    return null;
  }

  // viewBox(300x56) 가장자리에서 점·선이 잘리지 않도록 양끝에 여백을 두고 좌표를 잡는다.
  // 점은 SVG 대신 % 좌표 HTML 요소로 그려 가로 스트레치 시에도 정원을 유지한다.
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

  return {
    points,
    linePath,
    areaPath,
    averageDuration,
    completedCount: completedItems.length,
    totalCount: syncItems.length,
  };
});

// Qdrant 기본 플랜 상한: 4 GB — 플랜 변경 시 이 값을 수정한다.
const VECTOR_DB_CAPACITY_GB = 4;
const vectorDbUsedGb = computed(() => {
  if (!adminDataOverview.value) return 0;
  const m = adminDataOverview.value.vectorDbSize.match(/^([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
});
const vectorDbUsagePercent = computed(() =>
  Math.min(100, Math.round((vectorDbUsedGb.value / VECTOR_DB_CAPACITY_GB) * 100)),
);
const isVectorDbLow = computed(() => vectorDbUsagePercent.value >= 80);
const vectorDbFillColor = computed(() => {
  if (vectorDbUsagePercent.value >= 80) return 'var(--color-error)'; // 위험 — 빨강
  if (vectorDbUsagePercent.value >= 60) return 'var(--color-warning)'; // 주의 — 노랑
  return 'var(--color-success)'; // 여유 — 초록
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

const pipelineStatusLabel = computed(() =>
  status.value ? getStatusLabel(status.value) : '대기 중',
);
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
      return '문서를 최신 상태로 유지합니다.';
  }
});
const pipelineActionHint = computed(() => {
  if (isStartingIngest.value) {
    return '데이터 수집을 시작하고 있습니다.';
  }

  return adminActionHint.value;
});
const pipelineCharacterImageUrl = computed(() => {
  if (status.value === 'COMPLETED') {
    return linaFlagImageUrl;
  }
  return status.value ? linaRunningImageUrl : linaWaitingImageUrl;
});
const pipelineCharacterAlt = computed(() => {
  if (status.value === 'COMPLETED') {
    return '수집 완료';
  }
  return status.value ? '수집 진행 중' : '수집 대기 중';
});
const pipelineCharacterStyle = computed(() => {
  // 완료 시에는 캐릭터를 키우고 중심이 진행바 끝을 넘도록 둬 결승점에 선 느낌을 준다.
  if (status.value === 'COMPLETED') {
    return {
      left: `calc(${progressPercent.value}% - 50px)`,
      top: '0rem',
    };
  }
  // IDLE에서는 출발선(좌측 끝)에 캐릭터 몸이 걸치도록 세워 둔다.
  if (!status.value) {
    return {
      left: '-1.75rem',
      top: '-0.15rem',
    };
  }
  return {
    left: `calc(${progressPercent.value}% - 36px)`,
    top: '-0.15rem',
  };
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

function formatChartDate(value: string): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}.${day}`;
}

function formatRelativeTime(value: string): string {
  const elapsedMinutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  if (elapsedMinutes < 1) {
    return '방금 전';
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}분 전`;
  }
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}시간 전`;
  }
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

function getStatusLabel(status: AdminDisplayStatus): string {
  return STATUS_DISPLAY_LABELS[status] ?? status;
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
          <p class="mt-0.5 text-[0.74rem] text-overlay-dark-40">Admin Dashboard</p>
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
            <h2 class="text-[1.55rem] font-bold tracking-[-0.04em] text-overlay-dark-80">
              문서 데이터 관리
            </h2>
            <p class="mt-1 text-[0.88rem] text-overlay-dark-40">
              검색에 사용할 사용자 문서를 수집하고 최신 상태로 유지합니다.
            </p>
          </header>

          <!-- 데이터 파이프라인 -->
          <div
            data-testid="admin-ingest-pipeline-card"
            class="mb-6 rounded-[1.75rem] border border-bg-300/70 bg-primary-white p-6 shadow-[0_8px_28px_rgba(15,23,42,0.05)]"
          >
            <div class="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
              <div class="lg:pr-4">
                <h3 class="text-[1.08rem] font-semibold tracking-[-0.03em] text-overlay-dark-80">
                  문서 수집 현황
                </h3>
                <p
                  class="mt-2 line-clamp-2 min-h-[3rem] text-[0.8rem] leading-6 text-overlay-dark-40"
                >
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

              <div
                class="min-w-0 border-t border-bg-200 pt-5 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0"
              >
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
          <section v-if="adminDataOverview" class="mb-6">
            <h3 class="mb-3 text-[0.95rem] font-semibold text-overlay-dark-80">데이터 현황</h3>

            <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <!-- 마지막 동기화 -->
              <article
                class="col-span-2 flex items-center justify-between gap-2.5 rounded-2xl border border-bg-300/60 bg-primary-white py-4 pl-5 pr-2 shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
              >
                <div class="min-w-0">
                  <p
                    class="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-overlay-dark-40"
                  >
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
                <div
                  v-if="syncChartBars.length > 0"
                  class="mt-3.5 flex flex-1 items-stretch gap-1.5"
                >
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
                <!-- 타이틀 행: 카드 좌측 상단 정렬 -->
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
                  <!-- 원통 SVG: 링 없는 클린 디자인, 가득 찼을 때 뚜껑 없는 자연스러운 모양 -->
                  <div class="shrink-0">
                    <svg viewBox="0 0 36 52" width="36" height="52" aria-hidden="true">
                      <defs>
                        <clipPath id="vdb-body-clip">
                          <rect x="0" y="8" width="36" height="36" />
                        </clipPath>
                      </defs>
                      <!-- 빈 바디 -->
                      <rect x="0" y="8" width="36" height="36" fill="#e4e6e8" />
                      <!-- 채움 레벨 (아래부터) -->
                      <rect
                        x="0"
                        :y="8 + 36 * (1 - vectorDbUsagePercent / 100)"
                        width="36"
                        :height="36 * (vectorDbUsagePercent / 100)"
                        :fill="vectorDbFillColor"
                        clip-path="url(#vdb-body-clip)"
                      />
                      <!-- 바닥 캡 -->
                      <ellipse
                        cx="18"
                        cy="44"
                        rx="18"
                        ry="7"
                        :fill="vectorDbUsagePercent > 3 ? vectorDbFillColor : '#d6d8da'"
                      />
                      <!-- 채움면 상단 타원 (가득 찰 때는 숨겨 뚜껑처럼 안 보이게) -->
                      <ellipse
                        v-if="vectorDbUsagePercent > 3 && vectorDbUsagePercent < 90"
                        cx="18"
                        :cy="8 + 36 * (1 - vectorDbUsagePercent / 100)"
                        rx="18"
                        ry="7"
                        :fill="vectorDbFillColor"
                      />
                      <!-- 중간 수평 링 선 (구조감) -->
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
                      <!-- 상단 캡: ≥90%일 때 채움 색으로 자연스럽게 연결 -->
                      <ellipse
                        cx="18"
                        cy="8"
                        rx="18"
                        ry="7"
                        :fill="vectorDbUsagePercent >= 90 ? vectorDbFillColor : '#f2f3f5'"
                      />
                      <!-- 상단 링 (캡 위에 그려야 보임) -->
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

                  <!-- 데이터 영역 -->
                  <div class="min-w-0 flex-1">
                    <p class="text-[1.3rem] font-bold tracking-[-0.05em] text-overlay-dark-80">
                      {{ adminDataOverview.vectorDbSize }}
                      <span class="text-[0.78rem] font-normal text-overlay-dark-30">
                        / {{ VECTOR_DB_CAPACITY_GB }} GB
                      </span>
                    </p>
                    <!-- 프로그레스바 -->
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
                    <!-- 경고 문구 -->
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
                    <p
                      class="mt-1.5 text-[1.4rem] font-bold tracking-[-0.05em] text-overlay-dark-80"
                    >
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
                    <!-- dot 위에 표시되는 툴팁: 위치는 dot xPercent/yPercent 기준, 부드럽게 이동 -->
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
                          displayedDurationPoint?.isFailed
                            ? 'text-status-error'
                            : 'text-overlay-dark-80'
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
                    <!-- 투명 hit-area로 hover 범위를 넓히고, 안쪽 dot만 시각 표시한다. -->
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
                @click="activeSection = 'sync'"
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
