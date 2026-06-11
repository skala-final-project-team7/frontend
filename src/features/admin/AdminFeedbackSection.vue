<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin SCR-820 피드백 탭 컨텐츠.
          긍정/부정 비율 도넛, 일자별 피드백 추이 바 차트, 부정 피드백 원문 목록을 렌더링한다.
작성일 : 2026-06-11
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-11, feature16 구현, Admin 피드백 확인 화면 신규 구현
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { MessageSquare, ThumbsDown, ThumbsUp } from '@lucide/vue';

import { getAdminFeedback } from '@/api';
import { BaseSpinner, EmptyState, ErrorRetryState } from '@/shared';
import type { AdminFeedbackResponse } from '@/types/api';
import type { Ref } from 'vue';

interface TabPaginationState {
  currentPage: Ref<number>;
  pageSize: Ref<number>;
}

type TabPaginationMap = Record<string, TabPaginationState>;

type PeriodTab = '7d' | '14d' | '30d';

// 기간 탭은 API 기본값(최근 7일)에 맞춰 7일을 기본 선택으로 둔다.
const PERIOD_TABS: { key: PeriodTab; label: string }[] = [
  { key: '7d', label: '7일' },
  { key: '14d', label: '14일' },
  { key: '30d', label: '30일' },
];

const tabPagination = inject<TabPaginationMap>('adminTabPagination');
const currentPage = tabPagination?.feedback?.currentPage ?? ref(1);
const FEEDBACK_PAGE_SIZE = 5;
const pageSize = tabPagination?.feedback?.pageSize ?? ref(FEEDBACK_PAGE_SIZE);
pageSize.value = FEEDBACK_PAGE_SIZE;

const isLoading = ref(false);
const error = ref('');
const feedback = ref<AdminFeedbackResponse | null>(null);
const activePeriod = ref<PeriodTab>('7d');

// ── 긍정/부정 비율 도넛 ─────────────────────────────────────────────
const DONUT_RADIUS = 30;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const positivePercent = computed(() => Math.round((feedback.value?.positiveRatio ?? 0) * 100));
const negativePercent = computed(() => 100 - positivePercent.value);

const donutDashArray = computed(() => {
  const filled = (positivePercent.value / 100) * DONUT_CIRCUMFERENCE;
  return `${filled.toFixed(1)} ${(DONUT_CIRCUMFERENCE - filled).toFixed(1)}`;
});

// ── 피드백 추이 바 차트 ─────────────────────────────────────────────
const CHART_W = 560;
const CHART_H = 190;
const CHART_PAD_TOP = 10;
const CHART_PAD_BOTTOM = 26;
const CHART_PAD_LEFT = 34;
const CHART_PAD_RIGHT = 8;
const CHART_Y_TICK_COUNT = 4;

const trendChart = computed(() => {
  const trend = feedback.value?.trend;
  if (!trend || trend.length === 0) return null;

  const innerW = CHART_W - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const innerH = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;

  // Y축 최대값을 눈금 간격이 깔끔한 수(자릿수 올림)로 보정한다.
  const rawMax = Math.max(...trend.map((d) => d.likeCount + d.dislikeCount), 1);
  const rawStep = Math.ceil(rawMax / CHART_Y_TICK_COUNT);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const tickStep = Math.ceil(rawStep / magnitude) * magnitude;
  const yMax = tickStep * CHART_Y_TICK_COUNT;

  const slotW = innerW / trend.length;
  const barW = Math.min(28, slotW * 0.45);

  const bars = trend.map((d, index) => {
    const total = d.likeCount + d.dislikeCount;
    const barH = (total / yMax) * innerH;
    return {
      date: d.date,
      // '2026-06-03' → '06-03' 라벨
      label: d.date.slice(5),
      x: CHART_PAD_LEFT + slotW * index + (slotW - barW) / 2,
      y: CHART_PAD_TOP + innerH - barH,
      width: barW,
      height: barH,
      centerX: CHART_PAD_LEFT + slotW * index + slotW / 2,
      tooltip: `${d.date} 긍정 ${d.likeCount}건 · 부정 ${d.dislikeCount}건`,
    };
  });

  const yTicks = Array.from({ length: CHART_Y_TICK_COUNT + 1 }, (_, i) => ({
    value: tickStep * i,
    y: CHART_PAD_TOP + innerH - (tickStep * i * innerH) / yMax,
  }));

  return { bars, yTicks };
});

// ── 부정 피드백 원문 pagination ─────────────────────────────────────
// negativeFeedbacks는 DISLIKE 원문 목록이므로 총 페이지 기준은 dislikeCount다.
const totalPages = computed(() => {
  if (!feedback.value) return 0;
  return Math.ceil(feedback.value.dislikeCount / pageSize.value);
});

const isPrevDisabled = computed(() => currentPage.value <= 1);
const isNextDisabled = computed(() => currentPage.value >= totalPages.value);

onMounted(() => {
  void loadFeedback();
});

async function loadFeedback() {
  isLoading.value = true;
  error.value = '';
  try {
    feedback.value = await getAdminFeedback({ page: currentPage.value - 1, size: pageSize.value });
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : '피드백 현황을 불러오는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
}

// 페이지 전환 시에는 전체 로딩 상태를 띄우지 않고 목록 데이터만 교체한다.
async function loadFeedbackPage() {
  try {
    feedback.value = await getAdminFeedback({ page: currentPage.value - 1, size: pageSize.value });
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : '피드백 현황을 불러오는 중 오류가 발생했습니다.';
  }
}

watch(currentPage, () => {
  void loadFeedbackPage();
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
    <BaseSpinner label="피드백 현황을 불러오고 있습니다" />
  </section>

  <!-- 에러 -->
  <section
    v-else-if="error"
    data-testid="admin-feedback-error"
    class="flex min-h-[60vh] items-center justify-center"
  >
    <ErrorRetryState
      title="피드백 현황을 불러오지 못했습니다"
      :message="error"
      retry-label="다시 불러오기"
      data-testid="admin-feedback-retry"
      @retry="loadFeedback"
    />
  </section>

  <!-- 피드백 컨텐츠 -->
  <section v-else-if="feedback" data-testid="admin-feedback-section" class="px-8 pb-4 pt-7">
    <!-- 헤더 -->
    <div>
      <h2 class="text-[1.25rem] font-semibold text-overlay-dark-80">피드백</h2>
    </div>

    <div class="mt-5 grid grid-cols-[300px_1fr] items-stretch gap-5">
      <!-- ── 긍정/부정 비율 도넛 ── -->
      <div
        data-testid="admin-feedback-ratio-card"
        class="flex flex-col rounded-xl border border-bg-300/60 bg-primary-white p-5"
      >
        <h3 class="text-[0.95rem] font-bold text-overlay-dark-80">긍정 / 부정 비율</h3>
        <div class="flex flex-1 items-center justify-center py-4">
          <svg width="132" height="132" viewBox="0 0 72 72" aria-hidden="true">
            <!-- 부정(잔여 호) = primary 주황, 긍정 호 = success 초록 -->
            <circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke="var(--color-primary)"
              stroke-width="9"
            />
            <circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke="var(--color-success)"
              stroke-width="9"
              :stroke-dasharray="donutDashArray"
              transform="rotate(-90 36 36)"
            />
          </svg>
        </div>
        <div class="flex items-center justify-center gap-5 text-[0.82rem]">
          <span class="flex items-center gap-1.5 text-overlay-dark-80">
            <ThumbsUp aria-hidden="true" class="size-3.5 text-status-success" />
            <b>{{ formatNumber(feedback.likeCount) }}</b>
            <span class="text-overlay-dark-40">({{ positivePercent }}%)</span>
          </span>
          <span class="flex items-center gap-1.5 text-overlay-dark-80">
            <ThumbsDown aria-hidden="true" class="size-3.5 text-primary" />
            <b>{{ formatNumber(feedback.dislikeCount) }}</b>
            <span class="text-overlay-dark-40">({{ negativePercent }}%)</span>
          </span>
        </div>
      </div>

      <!-- ── 피드백 추이 바 차트 ── -->
      <div class="rounded-xl border border-bg-300/60 bg-primary-white p-5">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-[0.95rem] font-bold text-overlay-dark-80">피드백 추이</h3>
          <!-- 기간 탭 — query parameter(from/to) 미확정이므로 UI 상태만 관리 -->
          <div
            class="inline-flex items-center gap-0.5 rounded-lg border border-bg-300/60 bg-bg-100 p-0.5"
            role="tablist"
            aria-label="피드백 추이 기간 선택"
          >
            <button
              v-for="tab in PERIOD_TABS"
              :key="tab.key"
              :data-testid="`admin-feedback-period-tab-${tab.key}`"
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
        </div>

        <div data-testid="admin-feedback-trend-chart" class="mt-4">
          <svg
            v-if="trendChart"
            :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
            class="w-full"
            role="img"
            aria-label="일자별 피드백 추이 차트"
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

            <!-- 일자별 피드백 바 -->
            <g v-for="bar in trendChart.bars" :key="bar.date">
              <rect
                :data-testid="`admin-feedback-trend-bar-${bar.date}`"
                :x="bar.x"
                :y="bar.y"
                :width="bar.width"
                :height="bar.height"
                rx="3"
                fill="var(--color-primary)"
              >
                <title>{{ bar.tooltip }}</title>
              </rect>
              <text
                :x="bar.centerX"
                :y="CHART_H - 8"
                text-anchor="middle"
                font-size="11"
                fill="var(--color-dark-40)"
              >
                {{ bar.label }}
              </text>
            </g>
          </svg>
          <p v-else class="py-8 text-center text-[0.82rem] text-overlay-dark-40">
            표시할 추이 데이터가 없습니다.
          </p>
        </div>
      </div>
    </div>

    <!-- ── 부정 피드백 원문 ── -->
    <div class="mt-6">
      <div class="flex items-baseline justify-between">
        <h3 class="text-[0.95rem] font-bold text-overlay-dark-80">부정 피드백 원문</h3>
        <span
          data-testid="admin-feedback-negative-total"
          class="text-[0.78rem] text-overlay-dark-40"
        >
          총 {{ formatNumber(feedback.dislikeCount) }}건
        </span>
      </div>

      <!-- 빈 상태 — 부정 피드백이 아예 없는 경우 -->
      <div
        v-if="feedback.dislikeCount === 0"
        data-testid="admin-feedback-empty"
        class="mt-3 flex min-h-[180px] items-center justify-center rounded-xl border border-bg-300/60 bg-primary-white"
      >
        <EmptyState title="부정 피드백이 없습니다" description="접수된 부정 피드백이 없습니다." />
      </div>

      <!-- 부정 피드백 카드 목록 — API 응답 범위(질문/답변/comment/createdAt)만 렌더링한다 -->
      <ul v-else-if="feedback.negativeFeedbacks.length > 0" class="mt-3 space-y-3">
        <li
          v-for="item in feedback.negativeFeedbacks"
          :key="item.feedbackId"
          :data-testid="`admin-feedback-card-${item.feedbackId}`"
          class="rounded-xl border border-bg-300/60 bg-primary-white px-5 py-4"
        >
          <p class="text-[0.72rem] font-semibold text-graph-blue">질문</p>
          <p class="mt-1 text-[0.85rem] text-overlay-dark-80">{{ item.question }}</p>
          <p class="mt-3 text-[0.72rem] font-semibold text-overlay-dark-40">답변</p>
          <p class="mt-1 text-[0.85rem] text-overlay-dark-80">{{ item.answer }}</p>
          <div class="mt-3 flex items-center justify-between gap-4">
            <span class="flex items-center gap-1.5 text-[0.78rem] font-medium text-primary">
              <MessageSquare aria-hidden="true" class="size-3.5 shrink-0" />
              {{ item.comment }}
            </span>
            <span class="shrink-0 text-[0.74rem] text-overlay-dark-40">
              {{ formatDateTime(item.createdAt) }}
            </span>
          </div>
        </li>
      </ul>

      <!-- 현재 페이지에 표시할 원문이 없는 경우 -->
      <div
        v-else
        class="mt-3 flex min-h-[120px] items-center justify-center rounded-xl border border-bg-300/60 bg-primary-white"
      >
        <p class="text-[0.82rem] text-overlay-dark-40">이 페이지에 표시할 피드백이 없습니다.</p>
      </div>

      <!-- 페이지네이션 -->
      <div
        v-if="feedback.dislikeCount > 0"
        data-testid="admin-feedback-pagination"
        class="mt-3 flex items-center justify-end text-[0.78rem]"
      >
        <div class="flex items-center gap-3 text-overlay-dark-40">
          <span>{{ currentPage }} / {{ totalPages }} 페이지</span>
          <button
            data-testid="admin-feedback-pagination-prev"
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
            data-testid="admin-feedback-pagination-next"
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
