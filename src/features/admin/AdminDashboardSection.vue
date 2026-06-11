<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin SCR-810 사용자 현황 탭 컨텐츠.
          사용자별 활동 테이블을 메인으로, 우측 레일에 활성률 도넛·접속 추이 스파크라인·
          핵심 지표를 배치하는 테이블 퍼스트 레이아웃을 렌더링한다.
작성일 : 2026-06-10
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-10, feature15 구현, Admin 대시보드 화면 신규 구현
  - 2026-06-10, feature15 보강, 차트 Y축 눈금·그리드 추가, KPI 카드 아이콘 추가, 디자인 토큰 정합성 수정
  - 2026-06-11, feature15 보강, 사용자별 활동 테이블 컬럼 정렬(오름차순/내림차순) 추가
  - 2026-06-11, feature15 보강, 기간 탭을 segmented control 스타일로 변경
  - 2026-06-11, feature15 리디자인, 테이블 퍼스트 레이아웃(시안 B) 적용 — KPI 카드를 우측 레일로
    이동, 접속 추이는 스파크라인 + 확대 모달(0~24시 축), 대화 수 인라인 바, 최근성 dot 추가
  - 2026-06-11, feature15 보정, 최근성 기준 7일/30일로 변경·연도 표시, 바 만점을 평균 2배로 변경,
    BaseTooltip 적용, 모달 카드 위치 기점 pop-in 애니메이션, 피크 dot pulse 강조, 레일 지표 순서 조정
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref, watch } from 'vue';
import { ArrowDown, ArrowUp, ChevronsUpDown, Maximize2, X } from '@lucide/vue';

import { getAdminStats, getAdminUsers } from '@/api';
import { BaseSpinner, BaseTooltip, EmptyState, ErrorRetryState } from '@/shared';
import type { AdminStats, AdminUserItem, AdminUsersResponse } from '@/types/api';
import type { Ref } from 'vue';

interface TabPaginationState {
  currentPage: Ref<number>;
  pageSize: Ref<number>;
}

type TabPaginationMap = Record<string, TabPaginationState>;

type PeriodTab = 'today' | '7d' | '30d';

const PERIOD_TABS: { key: PeriodTab; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: '7d', label: '7일' },
  { key: '30d', label: '30일' },
];

const tabPagination = inject<TabPaginationMap>('adminTabPagination');
const currentPage = tabPagination?.dashboard?.currentPage ?? ref(1);
const DASHBOARD_USERS_PAGE_SIZE = 12;
const pageSize = tabPagination?.dashboard?.pageSize ?? ref(DASHBOARD_USERS_PAGE_SIZE);
pageSize.value = DASHBOARD_USERS_PAGE_SIZE;

const isLoading = ref(false);
const error = ref('');
const stats = ref<AdminStats | null>(null);
const usersData = ref<AdminUsersResponse | null>(null);
const activePeriod = ref<PeriodTab>('today');

// ── 접속 추이 확대 모달 ─────────────────────────────────────────────
const isTrendModalOpen = ref(false);
const trendModalCloseButton = ref<HTMLButtonElement | null>(null);
const trendExpandButton = ref<HTMLButtonElement | null>(null);
// 스파크라인 카드 중심에서 화면 중앙으로 확대되는 pop-in 시작 좌표 (CSS 변수)
const trendModalOriginStyle = ref<Record<string, string>>({});

function openTrendModal() {
  const cardRect = trendExpandButton.value?.getBoundingClientRect();
  if (cardRect) {
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    trendModalOriginStyle.value = {
      '--trend-modal-from-x': `${Math.round(cardCenterX - window.innerWidth / 2)}px`,
      '--trend-modal-from-y': `${Math.round(cardCenterY - window.innerHeight / 2)}px`,
    };
  }
  isTrendModalOpen.value = true;
  void nextTick(() => {
    trendModalCloseButton.value?.focus();
  });
}

function closeTrendModal() {
  isTrendModalOpen.value = false;
}

// ── 접속 추이 차트 (모달, 0~24시 고정 축) ───────────────────────────
const CHART_W = 1100;
const CHART_H = 300;
const CHART_PAD_TOP = 16;
const CHART_PAD_BOTTOM = 36;
const CHART_PAD_LEFT = 44;
const CHART_PAD_RIGHT = 20;
const CHART_Y_TICK_COUNT = 4;
const CHART_HOUR_DOMAIN_MAX = 24;
const CHART_HOUR_TICK_STEP = 3;

const trendChart = computed(() => {
  const trend = stats.value?.hourlyAccessTrend;
  if (!trend || trend.length < 2) return null;

  const innerW = CHART_W - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const innerH = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;

  // Y축 최대값을 눈금 간격이 깔끔한 수(자릿수 올림)로 보정한다.
  const rawMax = Math.max(...trend.map((d) => d.count), 1);
  const rawStep = Math.ceil(rawMax / CHART_Y_TICK_COUNT);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const tickStep = Math.ceil(rawStep / magnitude) * magnitude;
  const yMax = tickStep * CHART_Y_TICK_COUNT;

  // X축은 시각 데이터 범위와 무관하게 0~24시 고정 도메인을 사용한다.
  const toX = (hour: number) => CHART_PAD_LEFT + (hour / CHART_HOUR_DOMAIN_MAX) * innerW;
  const toY = (count: number) => CHART_PAD_TOP + innerH - (count / yMax) * innerH;

  const chartPoints = trend.map((d) => ({
    x: Math.round(toX(d.hour)),
    y: Math.round(toY(d.count)),
  }));
  const points = chartPoints.map((point) => `${point.x},${point.y}`);
  const areaPath = [
    `M${points[0]}`,
    ...points.slice(1).map((point) => `L${point}`),
    `L${chartPoints[chartPoints.length - 1].x},${CHART_H - CHART_PAD_BOTTOM}`,
    `L${chartPoints[0].x},${CHART_H - CHART_PAD_BOTTOM}`,
    'Z',
  ].join(' ');
  const dots = trend.map((d) => ({
    cx: toX(d.hour),
    cy: toY(d.count),
    label: `${d.hour}시 ${d.count}건`,
  }));

  const yTicks = Array.from({ length: CHART_Y_TICK_COUNT + 1 }, (_, i) => ({
    value: tickStep * i,
    y: toY(tickStep * i),
  }));

  const xLabels = Array.from(
    { length: CHART_HOUR_DOMAIN_MAX / CHART_HOUR_TICK_STEP + 1 },
    (_, i) => {
      const hour = i * CHART_HOUR_TICK_STEP;
      return { x: toX(hour), label: `${hour}시` };
    },
  );

  return { areaPath, polyline: points.join(' '), dots, yTicks, xLabels };
});

// ── 접속 추이 스파크라인 (우측 레일) ────────────────────────────────
const SPARK_W = 220;
const SPARK_H = 56;

const sparkline = computed(() => {
  const trend = stats.value?.hourlyAccessTrend;
  if (!trend || trend.length < 2) return null;

  const max = Math.max(...trend.map((d) => d.count), 1);
  const toX = (hour: number) => 2 + (hour / CHART_HOUR_DOMAIN_MAX) * (SPARK_W - 4);
  const toY = (count: number) => 4 + (SPARK_H - 10) - (count / max) * (SPARK_H - 10);
  const sparkPoints = trend.map((d) => ({
    x: toX(d.hour),
    y: toY(d.count),
  }));
  const points = sparkPoints.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`);
  const areaPath = [
    `M${points[0]}`,
    ...points.slice(1).map((point) => `L${point}`),
    `L${sparkPoints[sparkPoints.length - 1].x.toFixed(1)},${SPARK_H - 2}`,
    `L${sparkPoints[0].x.toFixed(1)},${SPARK_H - 2}`,
    'Z',
  ].join(' ');
  const peak = trend.reduce((acc, item) => (item.count > acc.count ? item : acc));

  return {
    areaPath,
    points: points.join(' '),
    peak: { cx: toX(peak.hour), cy: toY(peak.count), hour: peak.hour, count: peak.count },
  };
});

// ── 활성률 도넛 (파생값: dailyActiveUsers ÷ totalUsers) ─────────────
const DONUT_RADIUS = 30;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const activeRatio = computed(() => {
  if (!usersData.value || usersData.value.totalUsers === 0) return 0;
  return usersData.value.dailyActiveUsers / usersData.value.totalUsers;
});

const activeRatioPercentLabel = computed(() => `${(activeRatio.value * 100).toFixed(1)}%`);

const donutDashArray = computed(() => {
  const filled = activeRatio.value * DONUT_CIRCUMFERENCE;
  return `${filled.toFixed(1)} ${(DONUT_CIRCUMFERENCE - filled).toFixed(1)}`;
});

// ── 사용자 테이블 정렬 ──────────────────────────────────────────────
// API 스펙에 sort query parameter가 없어 현재 페이지 데이터를 클라이언트에서 정렬한다.
type UserSortKey = 'name' | 'access' | 'conversationCount' | 'lastAccessAt';
type SortDirection = 'asc' | 'desc';

const USER_TABLE_COLUMNS: { key: UserSortKey; label: string }[] = [
  { key: 'name', label: '이름' },
  { key: 'access', label: '스페이스 / 페이지 / 첨부' },
  { key: 'conversationCount', label: '대화 수' },
  { key: 'lastAccessAt', label: '마지막 접속' },
];

const sortKey = ref<UserSortKey | null>(null);
const sortDirection = ref<SortDirection>('asc');

function toggleSort(key: UserSortKey) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
    return;
  }
  sortKey.value = key;
  sortDirection.value = 'asc';
}

function compareUsers(a: AdminUserItem, b: AdminUserItem, key: UserSortKey): number {
  switch (key) {
    case 'name':
      return a.name.localeCompare(b.name, 'ko');
    case 'access':
      return (
        a.accessibleSpaceCount - b.accessibleSpaceCount ||
        a.accessiblePageCount - b.accessiblePageCount ||
        a.accessibleAttachmentCount - b.accessibleAttachmentCount
      );
    case 'conversationCount':
      return a.conversationCount - b.conversationCount;
    case 'lastAccessAt':
      return new Date(a.lastAccessAt).getTime() - new Date(b.lastAccessAt).getTime();
  }
}

const sortedUsers = computed(() => {
  const users = usersData.value?.users ?? [];
  if (!sortKey.value) return users;
  const direction = sortDirection.value === 'asc' ? 1 : -1;
  return [...users].sort((a, b) => compareUsers(a, b, sortKey.value!) * direction);
});

// ── 대화 수 인라인 바 ───────────────────────────────────────────────
// 기준: 막대 만점(100%) = 현재 페이지 평균 대화 수의 2배(outlier 임계값).
// 바가 꽉 차는 지점과 튀는 값 강조(진한 주황)가 일치하도록 시각·의미를 맞춘다.
// 평균 위치는 4칸 세그먼트의 2칸 경계로 읽힌다.
const CONV_OUTLIER_MULTIPLIER = 2;

const pageAvgConversations = computed(() => {
  const users = usersData.value?.users ?? [];
  if (users.length === 0) return 0;
  return users.reduce((sum, u) => sum + u.conversationCount, 0) / users.length;
});

function convBarWidthPercent(count: number): number {
  const fullScale = pageAvgConversations.value * CONV_OUTLIER_MULTIPLIER;
  if (fullScale <= 0) return 0;
  return Math.max(2, Math.min(100, Math.round((count / fullScale) * 100)));
}

function isConvOutlier(count: number): boolean {
  return (
    pageAvgConversations.value > 0 && count >= pageAvgConversations.value * CONV_OUTLIER_MULTIPLIER
  );
}

// 비교 툴팁은 기준 초과(outlier) 행에만 노출한다 — 모든 행에 같은 설명을 반복하지 않는다.
function convOutlierTooltip(count: number): string {
  const average = pageAvgConversations.value;
  const multiple = (count / average).toFixed(1);
  return `페이지 평균 ${formatNumber(Math.round(average))}건의 ${multiple}배 — 다른 사용자보다 대화가 많습니다`;
}

// outlier 행은 인라인 바뿐 아니라 행 전체 hover로 툴팁이 뜨도록 행 단위 mouseenter로 처리한다.
const hoveredOutlierTooltip = ref<{ label: string; x: number; y: number } | null>(null);

function onUserRowMouseEnter(user: AdminUserItem, event: MouseEvent) {
  if (!isConvOutlier(user.conversationCount)) return;
  const row = event.currentTarget as HTMLElement;
  const anchor = row.querySelector('[data-conv-anchor]') ?? row;
  const rect = anchor.getBoundingClientRect();
  hoveredOutlierTooltip.value = {
    label: convOutlierTooltip(user.conversationCount),
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
  };
}

function onUserRowMouseLeave() {
  hoveredOutlierTooltip.value = null;
}

// ── 마지막 접속 최근성 dot (파생값: lastAccessAt 경과시간) ───────────
// 이름 옆이 아닌 마지막 접속 시각 앞에 표시해 "접속 중" presence로 오독되지 않게 한다.
const RECENCY_FRESH_HOURS = 24 * 7;
const RECENCY_WARM_HOURS = 24 * 30;

function recencyDotClass(lastAccessAt: string): string {
  const elapsedHours = (Date.now() - new Date(lastAccessAt).getTime()) / 3_600_000;
  if (elapsedHours < RECENCY_FRESH_HOURS) return 'bg-status-success';
  if (elapsedHours < RECENCY_WARM_HOURS) return 'bg-status-warning';
  return 'bg-bg-400';
}

const totalPages = computed(() => {
  if (!usersData.value) return 0;
  return Math.ceil(usersData.value.totalUsers / pageSize.value);
});

const isPrevDisabled = computed(() => currentPage.value <= 1);
const isNextDisabled = computed(() => currentPage.value >= totalPages.value);

// 일간 질의 수·전체 대화 수는 같은 사용량 지표라 인접 배치하고, 성격이 다른 응답시간은 마지막에 둔다.
const railMetrics = computed(() => [
  {
    testId: 'admin-stats-card-dailyQueryCount',
    label: '일간 질의 수',
    value: stats.value ? formatNumber(stats.value.dailyQueryCount) : '—',
  },
  {
    testId: 'admin-stats-card-totalConversations',
    label: '전체 대화 수',
    value: stats.value ? formatNumber(stats.value.totalConversations) : '—',
  },
  {
    testId: 'admin-stats-card-avgResponseTime',
    label: '평균 응답시간',
    value: stats.value ? `${stats.value.avgResponseTime}초` : '—',
  },
]);

onMounted(() => {
  void loadAll();
});

async function loadAll() {
  isLoading.value = true;
  error.value = '';
  try {
    const [statsResult, usersResult] = await Promise.all([
      getAdminStats(),
      getAdminUsers({ page: currentPage.value - 1, size: pageSize.value }),
    ]);
    stats.value = statsResult;
    usersData.value = usersResult;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : '사용자 현황을 불러오는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
}

async function loadUsers() {
  try {
    usersData.value = await getAdminUsers({ page: currentPage.value - 1, size: pageSize.value });
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : '사용자 현황을 불러오는 중 오류가 발생했습니다.';
  }
}

watch(currentPage, () => {
  void loadUsers();
});

function goToPrevPage() {
  if (!isPrevDisabled.value) {
    currentPage.value -= 1;
  }
}

function goToNextPage() {
  if (!isNextDisabled.value) {
    currentPage.value += 1;
  }
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));
}
</script>

<template>
  <!-- 로딩 -->
  <section v-if="isLoading" class="flex min-h-[60vh] items-center justify-center">
    <BaseSpinner label="사용자 현황을 불러오고 있습니다" />
  </section>

  <!-- 에러 -->
  <section
    v-else-if="error"
    data-testid="admin-dashboard-error"
    class="flex min-h-[60vh] items-center justify-center"
  >
    <ErrorRetryState
      title="사용자 현황을 불러오지 못했습니다"
      :message="error"
      retry-label="다시 불러오기"
      data-testid="admin-dashboard-retry"
      @retry="loadAll"
    />
  </section>

  <!-- 사용자 현황 컨텐츠 -->
  <section v-else data-testid="admin-dashboard-section" class="px-8 pb-4 pt-7">
    <!-- 헤더 -->
    <div>
      <h2 class="text-[1.25rem] font-semibold text-overlay-dark-80">사용자 현황</h2>
    </div>

    <div
      data-testid="admin-dashboard-layout"
      class="mt-5 grid grid-cols-[1fr_264px] items-start gap-5"
    >
      <!-- ── 메인: 사용자별 활동 테이블 ── -->
      <div class="rounded-xl border border-bg-300/60 bg-primary-white">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-4">
          <h3 class="text-[0.95rem] font-bold text-overlay-dark-80">사용자별 활동</h3>
          <span class="ml-auto flex items-center gap-3 text-[0.68rem] text-overlay-dark-40">
            <span class="flex items-center gap-1">
              <i class="size-1.5 rounded-full bg-status-success" />7일 이내
            </span>
            <span class="flex items-center gap-1">
              <i class="size-1.5 rounded-full bg-status-warning" />30일 이내
            </span>
            <span class="flex items-center gap-1">
              <i class="size-1.5 rounded-full bg-bg-400" />그 이상
            </span>
          </span>
        </div>

        <!-- 빈 상태 — 등록된 사용자가 아예 없는 경우 -->
        <div
          v-if="usersData && usersData.totalUsers === 0"
          data-testid="admin-users-empty"
          class="flex min-h-[180px] items-center justify-center pb-6"
        >
          <EmptyState title="사용자 현황이 없습니다" description="등록된 사용자가 없습니다." />
        </div>

        <!-- 테이블 -->
        <table
          v-else-if="usersData && usersData.users.length > 0"
          data-testid="admin-users-table"
          class="w-full text-[0.82rem]"
        >
          <thead>
            <tr class="border-y border-bg-300/60 bg-bg-100 text-left">
              <th
                v-for="column in USER_TABLE_COLUMNS"
                :key="column.key"
                class="px-5 py-3 font-medium text-overlay-dark-40"
                :aria-sort="
                  sortKey === column.key
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                "
              >
                <button
                  :data-testid="`admin-users-sort-${column.key}`"
                  type="button"
                  class="flex items-center gap-1 transition-colors hover:text-overlay-dark-80"
                  @click="toggleSort(column.key)"
                >
                  {{ column.label }}
                  <component
                    :is="
                      sortKey === column.key
                        ? sortDirection === 'asc'
                          ? ArrowUp
                          : ArrowDown
                        : ChevronsUpDown
                    "
                    class="size-3.5 shrink-0"
                    :class="sortKey === column.key ? 'text-primary' : 'text-overlay-dark-20'"
                    aria-hidden="true"
                  />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in sortedUsers"
              :key="user.userId"
              :data-testid="`admin-user-row-${user.userId}`"
              class="border-b border-bg-300/30 hover:bg-bg-100"
              @mouseenter="onUserRowMouseEnter(user, $event)"
              @mouseleave="onUserRowMouseLeave"
            >
              <td class="px-5 py-3 font-medium text-overlay-dark-80">{{ user.name }}</td>
              <td class="px-5 py-3 text-overlay-dark-80">
                {{ user.accessibleSpaceCount }} / {{ user.accessiblePageCount }} /
                {{ user.accessibleAttachmentCount }}
              </td>
              <td class="px-5 py-3">
                <span data-conv-anchor class="inline-flex w-full max-w-[150px]">
                  <span class="inline-flex w-full items-center gap-2">
                    <span class="relative h-1.5 flex-1 overflow-hidden rounded-full bg-bg-200">
                      <span
                        :data-testid="`admin-user-conv-bar-${user.userId}`"
                        class="block h-full rounded-full"
                        :class="
                          isConvOutlier(user.conversationCount) ? 'bg-primary' : 'bg-primary-light'
                        "
                        :style="{ width: `${convBarWidthPercent(user.conversationCount)}%` }"
                      />
                      <!-- 4칸 세그먼트 흰 구분선 (1칸 = 만점의 25%, 2칸 = 페이지 평균) -->
                      <span
                        class="conv-bar-segments pointer-events-none absolute inset-0"
                        aria-hidden="true"
                      />
                    </span>
                    <span class="min-w-[30px] text-right text-overlay-dark-80">
                      {{ formatNumber(user.conversationCount) }}
                    </span>
                  </span>
                </span>
              </td>
              <td class="px-5 py-3 text-overlay-dark-40">
                <span class="inline-flex items-center gap-2">
                  <i
                    :data-testid="`admin-user-recency-${user.userId}`"
                    class="size-1.5 shrink-0 rounded-full"
                    :class="recencyDotClass(user.lastAccessAt)"
                  />
                  {{ formatDateTime(user.lastAccessAt) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- 현재 페이지에 표시할 행이 없는 경우 -->
        <div v-else-if="usersData" class="flex min-h-[120px] items-center justify-center">
          <p class="text-[0.82rem] text-overlay-dark-40">이 페이지에 표시할 사용자가 없습니다.</p>
        </div>

        <!-- 페이지네이션 -->
        <div
          v-if="usersData && usersData.totalUsers > 0"
          data-testid="admin-users-pagination"
          class="flex items-center justify-end border-t border-bg-300/30 px-5 py-3 text-[0.78rem]"
        >
          <div
            data-testid="admin-users-pagination-controls"
            class="flex items-center gap-3 text-overlay-dark-40"
          >
            <span>{{ currentPage }} / {{ totalPages }} 페이지</span>
            <button
              data-testid="admin-users-pagination-prev"
              type="button"
              :disabled="isPrevDisabled"
              class="rounded px-2 py-1 transition-colors"
              :class="
                isPrevDisabled
                  ? 'cursor-not-allowed text-overlay-dark-20'
                  : 'text-overlay-dark-80 hover:bg-bg-200'
              "
              aria-label="이전 페이지"
              @click="goToPrevPage"
            >
              &lt;
            </button>
            <button
              data-testid="admin-users-pagination-next"
              type="button"
              :disabled="isNextDisabled"
              class="rounded px-2 py-1 transition-colors"
              :class="
                isNextDisabled
                  ? 'cursor-not-allowed text-overlay-dark-20'
                  : 'text-overlay-dark-80 hover:bg-bg-200'
              "
              aria-label="다음 페이지"
              @click="goToNextPage"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <!-- ── 우측 레일 ── -->
      <aside class="flex flex-col gap-4">
        <!-- 일일 활성률 도넛 -->
        <div
          data-testid="admin-stats-card-users"
          class="rounded-xl border border-bg-300/60 bg-primary-white p-5"
        >
          <p class="text-[0.74rem] font-semibold text-overlay-dark-40">일일 활성률</p>
          <div class="mt-3 flex items-center gap-4">
            <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
              <defs>
                <!-- Calm Apricot: 밝은 살구색에서 시작해 브랜드 primary로 자연스럽게 진해진다. -->
                <linearGradient id="admin-donut-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    data-testid="admin-donut-gradient-stop-0"
                    offset="0%"
                    stop-color="#ffe4c2"
                  />
                  <stop
                    data-testid="admin-donut-gradient-stop-1"
                    offset="55%"
                    stop-color="#ffb55b"
                  />
                  <stop
                    data-testid="admin-donut-gradient-stop-2"
                    offset="100%"
                    stop-color="#f48122"
                  />
                </linearGradient>
              </defs>
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="var(--color-bg-200)"
                stroke-width="9"
              />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="url(#admin-donut-gradient)"
                stroke-width="9"
                stroke-linecap="round"
                :stroke-dasharray="donutDashArray"
                transform="rotate(-90 36 36)"
              />
            </svg>
            <div>
              <p class="text-[1.5rem] font-bold tracking-tight text-overlay-dark-80">
                {{ activeRatioPercentLabel }}
              </p>
              <p class="mt-0.5 text-[0.72rem] text-overlay-dark-40">
                {{ usersData ? formatNumber(usersData.dailyActiveUsers) : 0 }} /
                {{ usersData ? formatNumber(usersData.totalUsers) : 0 }}명
              </p>
            </div>
          </div>
        </div>

        <!-- 시간대별 접속 추이 스파크라인 (클릭 시 확대 모달) -->
        <button
          ref="trendExpandButton"
          data-testid="admin-trend-expand"
          type="button"
          class="rounded-xl border border-bg-300/60 bg-primary-white p-5 text-left transition-colors hover:border-primary/40"
          aria-label="시간대별 접속 추이 크게 보기"
          @click="openTrendModal"
        >
          <span class="flex items-center justify-between">
            <span class="text-[0.74rem] font-semibold text-overlay-dark-40"
              >시간대별 접속 추이</span
            >
            <BaseTooltip label="크게 보기" placement="top">
              <Maximize2 aria-hidden="true" class="size-3.5 text-overlay-dark-20" />
            </BaseTooltip>
          </span>
          <span data-testid="admin-access-trend-chart" class="mt-3 block">
            <svg
              v-if="sparkline"
              :viewBox="`0 0 ${SPARK_W} ${SPARK_H}`"
              class="w-full overflow-visible"
              aria-hidden="true"
            >
              <defs>
                <linearGradient
                  id="admin-access-trend-sparkline-gradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.22" />
                  <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path
                data-testid="admin-access-trend-sparkline-area"
                :d="sparkline.areaPath"
                fill="url(#admin-access-trend-sparkline-gradient)"
              />
              <polyline
                :points="sparkline.points"
                fill="none"
                stroke="var(--color-primary)"
                stroke-width="1.5"
                stroke-linejoin="round"
              />
              <circle
                class="spark-peak-halo"
                :cx="sparkline.peak.cx"
                :cy="sparkline.peak.cy"
                r="3.5"
                fill="var(--color-primary)"
              />
              <circle
                :cx="sparkline.peak.cx"
                :cy="sparkline.peak.cy"
                r="3"
                fill="var(--color-primary)"
                stroke="var(--color-primary-white)"
                stroke-width="1"
              />
            </svg>
            <span v-else class="block py-3 text-[0.74rem] text-overlay-dark-40">
              표시할 추이 데이터가 없습니다.
            </span>
          </span>
          <span
            v-if="sparkline"
            class="mt-2 flex items-baseline justify-between text-[0.72rem] text-overlay-dark-40"
          >
            피크 시간대
            <b class="text-[0.85rem] font-bold text-overlay-dark-80">
              {{ sparkline.peak.hour }}시 · {{ formatNumber(sparkline.peak.count) }}건
            </b>
          </span>
        </button>

        <!-- 핵심 지표 -->
        <div class="rounded-xl border border-bg-300/60 bg-primary-white px-5 py-2">
          <div
            v-for="metric in railMetrics"
            :key="metric.testId"
            :data-testid="metric.testId"
            class="flex items-baseline justify-between border-b border-dashed border-bg-300 py-2.5 last:border-b-0"
          >
            <span class="text-[0.76rem] text-overlay-dark-40">{{ metric.label }}</span>
            <span class="text-[0.95rem] font-bold tracking-tight text-overlay-dark-80">
              {{ metric.value }}
            </span>
          </div>
        </div>
      </aside>
    </div>

    <!-- ── 접속 추이 확대 모달 ── -->
    <div
      v-if="isTrendModalOpen"
      data-testid="admin-trend-modal"
      class="trend-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-overlay-dark-80/30 px-6"
      role="presentation"
      @keydown.esc="closeTrendModal"
      @click.self="closeTrendModal"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-trend-modal-title"
        class="trend-modal-dialog w-full max-w-[880px] rounded-card border border-bg-300 bg-primary-white p-7 shadow-floating"
        :style="trendModalOriginStyle"
      >
        <div class="mb-5 flex items-center justify-between gap-4">
          <h2 id="admin-trend-modal-title" class="text-[1.05rem] font-bold text-overlay-dark-80">
            시간대별 접속 추이
          </h2>
          <div class="flex items-center gap-3">
            <!-- 기간 탭 — query parameter 미확정이므로 UI 상태만 관리 -->
            <div
              class="inline-flex items-center gap-0.5 rounded-lg border border-bg-300/60 bg-bg-100 p-0.5"
              role="tablist"
              aria-label="기간 선택"
            >
              <button
                v-for="tab in PERIOD_TABS"
                :key="tab.key"
                :data-testid="`admin-trend-period-tab-${tab.key}`"
                type="button"
                role="tab"
                :aria-selected="activePeriod === tab.key"
                class="rounded-md px-3 py-1 text-[0.78rem] transition-colors"
                :class="
                  activePeriod === tab.key
                    ? 'bg-primary-white font-semibold text-overlay-dark-80 shadow-sm'
                    : 'text-overlay-dark-40 hover:text-overlay-dark-80'
                "
                @click="activePeriod = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
            <button
              ref="trendModalCloseButton"
              data-testid="admin-trend-modal-close"
              type="button"
              aria-label="접속 추이 닫기"
              class="inline-flex size-9 shrink-0 items-center justify-center rounded-button border border-bg-300 text-overlay-dark-80 transition hover:border-primary hover:bg-bg-100 focus-visible:outline-none focus-visible:shadow-focus"
              @click="closeTrendModal"
            >
              <X aria-hidden="true" class="size-4" />
            </button>
          </div>
        </div>

        <svg
          v-if="trendChart"
          :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
          class="w-full"
          :aria-label="`시간대별 접속 추이 차트 (${activePeriod})`"
          role="img"
        >
          <defs>
            <linearGradient id="admin-access-trend-modal-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--color-primary)" stop-opacity="0.18" />
              <stop offset="100%" stop-color="var(--color-primary)" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- Y축 눈금·그리드라인 -->
          <g v-for="tick in trendChart.yTicks" :key="tick.value">
            <line
              :x1="CHART_PAD_LEFT"
              :y1="tick.y"
              :x2="CHART_W - CHART_PAD_RIGHT"
              :y2="tick.y"
              stroke="var(--color-bg-300)"
              :stroke-dasharray="tick.value === 0 ? 'none' : '3 4'"
              stroke-width="1"
            />
            <text
              :x="CHART_PAD_LEFT - 8"
              :y="tick.y + 4"
              text-anchor="end"
              font-size="11"
              fill="var(--color-dark-40)"
            >
              {{ formatNumber(tick.value) }}
            </text>
          </g>

          <!-- 접속 추이 그라데이션 영역 -->
          <path
            data-testid="admin-access-trend-modal-area"
            :d="trendChart.areaPath"
            fill="url(#admin-access-trend-modal-gradient)"
          />

          <!-- 접속 추이 라인 -->
          <polyline
            :points="trendChart.polyline"
            fill="none"
            stroke="var(--color-primary)"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />

          <!-- 데이터 포인트 -->
          <circle
            v-for="dot in trendChart.dots"
            :key="dot.label"
            :cx="dot.cx"
            :cy="dot.cy"
            r="3"
            fill="var(--color-primary)"
          >
            <title>{{ dot.label }}</title>
          </circle>

          <!-- X축 라벨 (0~24시 고정) -->
          <text
            v-for="label in trendChart.xLabels"
            :key="label.label"
            :x="label.x"
            :y="CHART_H - 8"
            text-anchor="middle"
            font-size="11"
            fill="var(--color-dark-40)"
          >
            {{ label.label }}
          </text>
        </svg>

        <div v-else class="flex min-h-[180px] items-center justify-center">
          <p class="text-[0.82rem] text-overlay-dark-40">표시할 접속 추이 데이터가 없습니다.</p>
        </div>
      </section>
    </div>

    <!-- outlier 행 hover 비교 툴팁 (BaseTooltip과 동일한 시각 스타일, 행 단위 트리거) -->
    <Teleport to="body">
      <span
        v-if="hoveredOutlierTooltip"
        data-testid="admin-outlier-row-tooltip"
        role="tooltip"
        class="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-button bg-overlay-dark-80 px-2.5 py-1.5 font-lina text-small text-primary-white shadow-floating"
        :style="{ left: `${hoveredOutlierTooltip.x}px`, top: `${hoveredOutlierTooltip.y}px` }"
      >
        {{ hoveredOutlierTooltip.label }}
      </span>
    </Teleport>
  </section>
</template>

<style scoped>
/* 확대 모달 — 스파크라인 카드 중심(--trend-modal-from-x/y)에서 화면 중앙으로 확대되는 pop-in */
.trend-modal-overlay {
  animation: trend-modal-backdrop-in 0.18s ease-out;
}

.trend-modal-dialog {
  animation: trend-modal-pop-in 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes trend-modal-backdrop-in {
  from {
    opacity: 0;
  }
}

@keyframes trend-modal-pop-in {
  from {
    transform: translate(var(--trend-modal-from-x, 0px), var(--trend-modal-from-y, 0px)) scale(0.3);
    opacity: 0;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

/* 대화 수 인라인 바 — 4칸 세그먼트 흰 구분선 오버레이 (2칸 = 페이지 평균) */
.conv-bar-segments {
  background: repeating-linear-gradient(
    to right,
    transparent,
    transparent calc(25% - 1.5px),
    var(--color-primary-white) calc(25% - 1.5px),
    var(--color-primary-white) 25%
  );
}

/* 스파크라인 피크 dot — 바깥으로 퍼지는 pulse로 강조 */
.spark-peak-halo {
  transform-box: fill-box;
  transform-origin: center;
  animation: spark-peak-pulse 1.8s ease-out infinite;
}

@keyframes spark-peak-pulse {
  0% {
    transform: scale(1);
    opacity: 0.45;
  }
  75% {
    transform: scale(2.8);
    opacity: 0;
  }
  100% {
    transform: scale(2.8);
    opacity: 0;
  }
}
</style>
