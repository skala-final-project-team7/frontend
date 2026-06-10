<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin SCR-810 대시보드 탭 컨텐츠.
          서비스 운영 지표(KPI 카드, 시간대별 접속 추이 차트, 사용자 현황 테이블)를 렌더링한다.
작성일 : 2026-06-10
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-10, feature15 구현, Admin 대시보드 화면 신규 구현
  - 2026-06-10, feature15 보강, 차트 Y축 눈금·그리드 추가, KPI 카드 아이콘 추가, 디자인 토큰 정합성 수정
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { BarChart3, Clock, MessageSquare, Users } from '@lucide/vue';

import { getAdminStats, getAdminUsers } from '@/api';
import { BaseSpinner, EmptyState, ErrorRetryState } from '@/shared';
import type { AdminStats, AdminUsersResponse } from '@/types/api';
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
const pageSize = tabPagination?.dashboard?.pageSize ?? ref(20);

const isLoading = ref(false);
const error = ref('');
const stats = ref<AdminStats | null>(null);
const usersData = ref<AdminUsersResponse | null>(null);
const activePeriod = ref<PeriodTab>('today');

// 차트 viewBox를 실제 렌더 폭(~1100px)에 맞춰 1:1 스케일에 가깝게 잡아
// 라벨·점이 컨테이너 확대 시 과도하게 커지지 않도록 한다.
const CHART_W = 1100;
const CHART_H = 280;
const CHART_PAD_TOP = 16;
const CHART_PAD_BOTTOM = 36;
const CHART_PAD_LEFT = 44;
const CHART_PAD_RIGHT = 20;
const CHART_Y_TICK_COUNT = 4;

const trendChart = computed(() => {
  const trend = stats.value?.hourlyAccessTrend;
  if (!trend || trend.length < 2) return null;

  const innerW = CHART_W - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const innerH = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const minHour = trend[0].hour;
  const maxHour = trend[trend.length - 1].hour;
  const hourRange = maxHour - minHour || 1;

  // Y축 최대값을 눈금 간격이 깔끔한 수(5단위 올림)로 보정한다.
  const rawMax = Math.max(...trend.map((d) => d.count), 1);
  const rawStep = Math.ceil(rawMax / CHART_Y_TICK_COUNT);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const tickStep = Math.ceil(rawStep / magnitude) * magnitude;
  const yMax = tickStep * CHART_Y_TICK_COUNT;

  const toX = (hour: number) => CHART_PAD_LEFT + ((hour - minHour) / hourRange) * innerW;
  const toY = (count: number) => CHART_PAD_TOP + innerH - (count / yMax) * innerH;

  const points = trend.map((d) => `${Math.round(toX(d.hour))},${Math.round(toY(d.count))}`);
  const dots = trend.map((d) => ({
    cx: toX(d.hour),
    cy: toY(d.count),
    label: `${d.hour}시 ${d.count}건`,
  }));

  const yTicks = Array.from({ length: CHART_Y_TICK_COUNT + 1 }, (_, i) => ({
    value: tickStep * i,
    y: toY(tickStep * i),
  }));

  // X축 라벨은 너무 많으면 일부만 노출 (최대 8개)
  const xStep = Math.ceil(trend.length / 8);
  const xLabels = trend
    .filter((_, i) => i % xStep === 0 || i === trend.length - 1)
    .map((d) => ({
      x: toX(d.hour),
      label: `${d.hour}시`,
    }));

  return { polyline: points.join(' '), dots, yTicks, xLabels };
});

const totalPages = computed(() => {
  if (!usersData.value) return 0;
  return Math.ceil(usersData.value.totalUsers / pageSize.value);
});

const isPrevDisabled = computed(() => currentPage.value <= 1);
const isNextDisabled = computed(() => currentPage.value >= totalPages.value);

const kpiCards = computed(() => [
  {
    testId: 'admin-stats-card-dailyQueryCount',
    icon: MessageSquare,
    label: '일간 질의 수',
    value: stats.value ? formatNumber(stats.value.dailyQueryCount) : '—',
    caption: '오늘 기준',
  },
  {
    testId: 'admin-stats-card-avgResponseTime',
    icon: Clock,
    label: '평균 응답시간',
    value: stats.value ? `${stats.value.avgResponseTime}초` : '—',
    caption: '최근 24시간',
  },
  {
    testId: 'admin-stats-card-users',
    icon: Users,
    label: '전체 / 일일 활성 사용자',
    value: usersData.value ? formatNumber(usersData.value.totalUsers) : '—',
    caption: usersData.value ? `일일 활성: ${usersData.value.dailyActiveUsers}명` : '일일 활성: —',
  },
  {
    testId: 'admin-stats-card-totalConversations',
    icon: BarChart3,
    label: '전체 대화 수',
    value: stats.value ? formatNumber(stats.value.totalConversations) : '—',
    caption: '누적',
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
      err instanceof Error ? err.message : '대시보드를 불러오는 중 오류가 발생했습니다.';
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
    <BaseSpinner label="대시보드를 불러오고 있습니다" />
  </section>

  <!-- 에러 -->
  <section
    v-else-if="error"
    data-testid="admin-dashboard-error"
    class="flex min-h-[60vh] items-center justify-center"
  >
    <ErrorRetryState
      title="대시보드를 불러오지 못했습니다"
      :message="error"
      retry-label="다시 불러오기"
      data-testid="admin-dashboard-retry"
      @retry="loadAll"
    />
  </section>

  <!-- 대시보드 컨텐츠 -->
  <section v-else data-testid="admin-dashboard-section" class="space-y-6 p-8">
    <!-- 헤더 -->
    <div>
      <h2 class="text-[1.25rem] font-semibold text-overlay-dark-80">사용자 현황</h2>
    </div>

    <!-- KPI 카드 4개 -->
    <div class="grid grid-cols-4 gap-4">
      <div
        v-for="card in kpiCards"
        :key="card.testId"
        :data-testid="card.testId"
        class="rounded-xl border border-bg-300/60 bg-primary-white p-5"
      >
        <div class="flex items-center gap-2 text-overlay-dark-40">
          <component :is="card.icon" class="size-4 shrink-0" aria-hidden="true" />
          <p class="text-[0.78rem]">{{ card.label }}</p>
        </div>
        <p class="mt-2 text-[1.75rem] font-bold text-overlay-dark-80">{{ card.value }}</p>
        <p class="mt-1 text-[0.74rem] text-overlay-dark-40">{{ card.caption }}</p>
      </div>
    </div>

    <!-- 시간대별 접속 추이 -->
    <div class="rounded-xl border border-bg-300/60 bg-primary-white p-5">
      <div class="flex items-center justify-between">
        <h3 class="text-[0.9rem] font-semibold text-overlay-dark-80">시간대별 접속 추이</h3>
        <!-- 기간 탭 — query parameter 미확정이므로 UI 상태만 관리 -->
        <div class="flex gap-1" role="tablist" aria-label="기간 선택">
          <button
            v-for="tab in PERIOD_TABS"
            :key="tab.key"
            :data-testid="`admin-trend-period-tab-${tab.key}`"
            type="button"
            role="tab"
            :aria-selected="activePeriod === tab.key"
            class="rounded-lg px-3 py-1 text-[0.78rem] transition-colors"
            :class="
              activePeriod === tab.key
                ? 'bg-primary/10 font-semibold text-primary'
                : 'text-overlay-dark-40 hover:bg-bg-200 hover:text-overlay-dark-80'
            "
            @click="activePeriod = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- SVG 라인 차트 -->
      <div data-testid="admin-access-trend-chart" class="mt-4 overflow-hidden">
        <svg
          v-if="trendChart"
          :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
          class="w-full"
          :aria-label="`시간대별 접속 추이 차트 (${activePeriod})`"
          role="img"
        >
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

          <!-- X축 라벨 -->
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

        <!-- 추이 데이터 없음 -->
        <div v-else class="flex min-h-[180px] items-center justify-center">
          <p class="text-[0.82rem] text-overlay-dark-40">표시할 접속 추이 데이터가 없습니다.</p>
        </div>
      </div>
    </div>

    <!-- 사용자 현황 테이블 -->
    <div class="rounded-xl border border-bg-300/60 bg-primary-white">
      <div class="flex items-center justify-between px-5 py-4">
        <h3 class="text-[0.9rem] font-semibold text-overlay-dark-80">사용자별 활동</h3>
        <span class="text-[0.78rem] text-overlay-dark-40">
          전체 {{ usersData ? formatNumber(usersData.totalUsers) : 0 }}명
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
          <tr class="border-b border-bg-300/60 bg-bg-100 text-left">
            <th class="px-5 py-3 font-medium text-overlay-dark-40">이름</th>
            <th class="px-5 py-3 font-medium text-overlay-dark-40">스페이스 / 페이지 / 첨부</th>
            <th class="px-5 py-3 font-medium text-overlay-dark-40">대화 수</th>
            <th class="px-5 py-3 font-medium text-overlay-dark-40">마지막 접속</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in usersData.users"
            :key="user.userId"
            :data-testid="`admin-user-row-${user.userId}`"
            class="border-b border-bg-300/30 hover:bg-bg-100"
          >
            <td class="px-5 py-3 font-medium text-overlay-dark-80">{{ user.name }}</td>
            <td class="px-5 py-3 text-overlay-dark-80">
              {{ user.accessibleSpaceCount }} / {{ user.accessiblePageCount }} /
              {{ user.accessibleAttachmentCount }}
            </td>
            <td class="px-5 py-3 text-overlay-dark-80">
              {{ formatNumber(user.conversationCount) }}
            </td>
            <td class="px-5 py-3 text-overlay-dark-40">{{ formatDateTime(user.lastAccessAt) }}</td>
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
        class="flex items-center justify-between border-t border-bg-300/30 px-5 py-3 text-[0.78rem]"
      >
        <span class="text-overlay-dark-40">{{ currentPage }} / {{ totalPages }} 페이지</span>
        <div class="flex gap-1">
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
  </section>
</template>
