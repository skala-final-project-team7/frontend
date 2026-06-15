<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin SCR-820 피드백 탭 컨텐츠.
          긍정/부정 비율 반원 게이지, 일자별 피드백 추이 그룹 바 차트, 부정 피드백 원문 목록을 렌더링한다.
작성일 : 2026-06-11
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-11, feature16 구현, Admin 피드백 확인 화면 신규 구현
  - 2026-06-12, 피드백 추이 디자인 수정, 차트 축 라벨 글자 크기 축소 및 그리드 점선 간격·두께 축소
  - 2026-06-12, 상단 블럭 리디자인, 비율 도넛→반원 게이지 + 추이 스택 바→긍정/부정 라운드 그룹 바(오렌지/슬레이트) 전환
  - 2026-06-12, 비율 칩 개선, 텍스트 라벨 대신 엄지 아이콘 크게 표시
  - 2026-06-12, 비율 칩 줄바꿈 수정, 건수·퍼센트 글자 크기 축소 및 한 줄 고정
  - 2026-06-12, 비율 카드 공간 배분 개선, 게이지 확대·칩 퍼센트 중복 제거·추이 바 폭 상향
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import { Calendar, RefreshCw, ThumbsDown, ThumbsUp } from '@lucide/vue';

import { getAdminFeedback } from '@/api';
import { BaseIconButton, BaseSpinner, BaseTooltip, EmptyState, ErrorRetryState } from '@/shared';
import { mascotFaceImageUrl } from '@/shared/assets';
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

// ── 긍정/부정 비율 반원 게이지 ──────────────────────────────────────
// viewBox(0 0 100 58) 기준 반지름 42 반원 arc의 전체 길이
const GAUGE_ARC_LENGTH = Math.PI * 42;

// 긍정/부정 비율 카드는 선택한 기간 탭(7/14/30일)의 추이 합계로 함께 재계산한다.
// (부정 피드백 원문 목록·총 건수는 서버 페이지네이션 기준이라 전체 dislikeCount를 그대로 사용한다.)
const periodFeedbackSummary = computed(() => {
  const trend = filteredFeedbackTrend.value;
  const likeCount = trend.reduce((sum, item) => sum + item.likeCount, 0);
  const dislikeCount = trend.reduce((sum, item) => sum + item.dislikeCount, 0);
  const total = likeCount + dislikeCount;
  return {
    likeCount,
    dislikeCount,
    positiveRatio: total === 0 ? 0 : likeCount / total,
  };
});

const positivePercent = computed(() => Math.round(periodFeedbackSummary.value.positiveRatio * 100));

const gaugeDashArray = computed(() => {
  const filled = (positivePercent.value / 100) * GAUGE_ARC_LENGTH;
  return `${filled.toFixed(1)} ${GAUGE_ARC_LENGTH.toFixed(1)}`;
});

// ── 피드백 추이 바 차트 ─────────────────────────────────────────────
const CHART_W = 560;
const CHART_H = 126;
const CHART_PAD_TOP = 8;
const CHART_PAD_BOTTOM = 18;
const CHART_PAD_LEFT = 28;
const CHART_PAD_RIGHT = 6;
const CHART_Y_TICK_COUNT = 3;

const hoveredTrendBarDate = ref<string | null>(null);

function dateKey(value: string): string {
  return value.slice(0, 10);
}

function periodDays(period: PeriodTab): number {
  if (period === '7d') return 7;
  if (period === '14d') return 14;
  return 30;
}

function startDateKey(anchorDateKey: string, days: number): string {
  const [year, month, day] = anchorDateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - (days - 1));
  return date.toISOString().slice(0, 10);
}

// 받은 trend(현재 30일치)의 최소/최대 일자 — 커스텀 범위 입력의 min/max 경계로 사용한다.
const trendDateBounds = computed(() => {
  const trend = feedback.value?.trend ?? [];
  if (trend.length === 0) return null;
  const keys = trend.map((item) => dateKey(item.date)).sort((a, b) => a.localeCompare(b));
  return { min: keys[0], max: keys[keys.length - 1] };
});

// ── 기간 직접 선택(커스텀 범위) ─────────────────────────────────────
// 받은 trend 범위 안에서 시작/종료일을 직접 골라 차트·비율 카드에 반영한다.
// from/to 를 API로 보내지 않고 FE에서 in-memory trend 를 자르므로, 선택 가능 범위는 받은 데이터로 제한된다.
// (부정 피드백 원문 목록은 서버 페이지네이션 기준이라 기간 필터 대상이 아니다.)
const customRange = ref<{ from: string; to: string } | null>(null);
const isCustomActive = computed(() => customRange.value !== null);
const isCustomRangeOpen = ref(false);
const draftFrom = ref('');
const draftTo = ref('');

const customRangeLabel = computed(() => {
  if (!customRange.value) return '기간 선택';
  return `${customRange.value.from.slice(5)} ~ ${customRange.value.to.slice(5)}`;
});

function selectPreset(tab: PeriodTab) {
  activePeriod.value = tab;
  customRange.value = null;
}

function openCustomRange() {
  const bounds = trendDateBounds.value;
  if (bounds) {
    draftFrom.value = customRange.value?.from ?? bounds.min;
    draftTo.value = customRange.value?.to ?? bounds.max;
  }
  isCustomRangeOpen.value = true;
}

function closeCustomRange() {
  isCustomRangeOpen.value = false;
}

function applyCustomRange() {
  if (!draftFrom.value || !draftTo.value) return;
  // 시작일이 종료일보다 뒤면 자동으로 뒤바꿔 항상 from ≤ to 를 보장한다.
  const [from, to] =
    draftFrom.value <= draftTo.value
      ? [draftFrom.value, draftTo.value]
      : [draftTo.value, draftFrom.value];
  customRange.value = { from, to };
  isCustomRangeOpen.value = false;
}

const filteredFeedbackTrend = computed(() => {
  const trend = feedback.value?.trend ?? [];
  if (trend.length === 0) return [];

  const bounds = trendDateBounds.value!;
  let fromDateKey: string;
  let toDateKey: string;
  if (customRange.value) {
    fromDateKey = customRange.value.from;
    toDateKey = customRange.value.to;
  } else {
    toDateKey = bounds.max;
    fromDateKey = startDateKey(bounds.max, periodDays(activePeriod.value));
  }

  return trend.filter((item) => {
    const itemDateKey = dateKey(item.date);
    return itemDateKey >= fromDateKey && itemDateKey <= toDateKey;
  });
});

// 상단만 둥근 세로 바 path를 만든다. 값이 0이면 빈 path를 반환해 바를 그리지 않는다.
function roundedBarPath(x: number, width: number, height: number, bottomY: number): string {
  if (height <= 0) return `M ${x} ${bottomY} Z`;
  const radius = width / 2;
  const topY = bottomY - Math.max(height, radius + 0.5);
  return `M ${x} ${bottomY} V ${topY + radius} A ${radius} ${radius} 0 0 1 ${x + width} ${
    topY + radius
  } V ${bottomY} Z`;
}

const trendChart = computed(() => {
  const trend = filteredFeedbackTrend.value;
  if (!trend || trend.length === 0) return null;

  const innerW = CHART_W - CHART_PAD_LEFT - CHART_PAD_RIGHT;
  const innerH = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;

  // Y축 최대값을 눈금 간격이 깔끔한 수(자릿수 올림)로 보정한다.
  const rawMax = Math.max(...trend.map((d) => Math.max(d.likeCount, d.dislikeCount)), 1);
  const rawStep = Math.ceil(rawMax / CHART_Y_TICK_COUNT);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const tickStep = Math.ceil(rawStep / magnitude) * magnitude;
  const yMax = tickStep * CHART_Y_TICK_COUNT;

  const slotW = innerW / trend.length;
  // 긍정/부정 바 그룹이 슬롯 안에 들어가도록 슬롯 너비 기준으로 바 폭과 간격을 보정한다.
  const barW = Math.min(13, slotW * 0.26);
  const barGap = Math.min(5, slotW * 0.12);

  // 30일 등 긴 구간에서 일자 라벨이 겹치지 않도록 일정 간격으로만 라벨을 노출한다.
  // 가장 최근 일자(맨 오른쪽)는 항상 라벨을 표시한다.
  const labelStep = Math.max(1, Math.ceil(trend.length / 12));

  const bars = trend.map((d, index) => {
    const likeH = (d.likeCount / yMax) * innerH;
    const dislikeH = (d.dislikeCount / yMax) * innerH;
    const bottomY = CHART_PAD_TOP + innerH;
    const centerX = CHART_PAD_LEFT + slotW * index + slotW / 2;
    const groupTopY = bottomY - Math.max(likeH, dislikeH);

    return {
      date: d.date,
      // '2026-06-03' → '06-03' 라벨
      label: dateKey(d.date).slice(5),
      showLabel: (trend.length - 1 - index) % labelStep === 0,
      likePath: roundedBarPath(centerX - barW - barGap / 2, barW, likeH, bottomY),
      dislikePath: roundedBarPath(centerX + barGap / 2, barW, dislikeH, bottomY),
      centerX,
      hitWidth: barW * 2 + barGap + 8,
      tooltipLeftPercent: (centerX / CHART_W) * 100,
      tooltipTopPercent: (Math.max(CHART_PAD_TOP, groupTopY) / CHART_H) * 100,
      likeCount: d.likeCount,
      dislikeCount: d.dislikeCount,
    };
  });

  const yTicks = Array.from({ length: CHART_Y_TICK_COUNT + 1 }, (_, i) => ({
    value: tickStep * i,
    y: CHART_PAD_TOP + innerH - (tickStep * i * innerH) / yMax,
  }));

  return { bars, yTicks };
});

// ── 부정 피드백 원문 pagination ─────────────────────────────────────
// api-spec 기준 원문 목록은 negativeFeedbacks만 제공되므로 총 페이지 기준은 dislikeCount다.
const totalPages = computed(() => {
  if (!feedback.value) return 0;

  return Math.ceil(feedback.value.dislikeCount / pageSize.value);
});

const isPrevDisabled = computed(() => currentPage.value <= 1);
const isNextDisabled = computed(() => currentPage.value >= totalPages.value);

// REFACTOR(고려): 피드백 응답(trend 등 서버 상태)을 Pinia 스토어로 올리는 방안.
// 현재는 컴포넌트 로컬 ref라 (1) 탭을 v-if로 재방문할 때마다 재요청하고,
// (2) 페이지네이션 시에도 전체 응답을 다시 받아 trend가 매번 중복 수신된다.
// 스토어로 옮길 경우 fetch-once 가드 + 페이지 전환 시 negativeFeedbacks만 교체 + 새로고침 버튼 기반
// 캐시 무효화까지 함께 설계해야 실효가 있다(서버 상태=Pinia 컨벤션, chat store 선례 참고).
// 동작상 문제는 없어 지금은 보류.
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
    <div class="flex items-start justify-between gap-4">
      <h2 class="text-[1.25rem] font-semibold text-overlay-dark-80">피드백</h2>
      <BaseTooltip label="피드백 다시 불러오기" placement="left">
        <BaseIconButton
          v-bind="{ ariaLabel: '피드백 다시 불러오기' }"
          variant="secondary"
          class="size-8 rounded-lg"
          :disabled="isLoading"
          @click="loadFeedback"
        >
          <RefreshCw aria-hidden="true" class="size-3.5" />
        </BaseIconButton>
      </BaseTooltip>
    </div>

    <div class="mt-5 grid grid-cols-[300px_1fr] items-stretch gap-5">
      <!-- ── 긍정/부정 비율 반원 게이지 ── -->
      <div
        data-testid="admin-feedback-ratio-card"
        class="flex flex-col rounded-xl border border-bg-300/60 bg-primary-white p-5"
      >
        <h3 class="text-[0.95rem] font-bold text-overlay-dark-80">긍정 / 부정 비율</h3>
        <div class="flex flex-1 flex-col items-center justify-center gap-4 py-4">
          <div class="relative h-[133px] w-[230px]">
            <svg width="230" height="133" viewBox="0 0 100 58" aria-hidden="true">
              <defs>
                <linearGradient id="admin-feedback-gauge-gradient" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0" stop-color="var(--color-primary-light)" />
                  <stop offset="1" stop-color="var(--color-primary)" />
                </linearGradient>
              </defs>
              <path
                d="M 8 52 A 42 42 0 0 1 92 52"
                fill="none"
                stroke="var(--color-bg-200)"
                stroke-width="8"
                stroke-linecap="round"
              />
              <path
                d="M 8 52 A 42 42 0 0 1 92 52"
                fill="none"
                stroke="url(#admin-feedback-gauge-gradient)"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="gaugeDashArray"
              />
            </svg>
            <div class="absolute inset-x-0 bottom-0 text-center">
              <p
                class="text-[2rem] font-extrabold leading-none tracking-tight text-overlay-dark-80"
              >
                {{ positivePercent }}%
              </p>
              <p class="mt-1 text-[0.7rem] text-overlay-dark-40">긍정 비율</p>
            </div>
          </div>
          <div class="flex w-full gap-2">
            <div
              class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[rgba(244,129,34,0.3)] bg-[rgba(244,129,34,0.05)] px-3 py-2.5"
            >
              <ThumbsUp aria-hidden="true" class="size-5 shrink-0 text-primary" />
              <span class="sr-only">긍정</span>
              <b class="whitespace-nowrap text-[0.9rem] font-bold text-primary">
                {{ formatNumber(periodFeedbackSummary.likeCount) }}건
              </b>
            </div>
            <div
              class="flex flex-1 items-center justify-center gap-2 rounded-lg border border-bg-300/60 bg-bg-100 px-3 py-2.5"
            >
              <ThumbsDown aria-hidden="true" class="size-5 shrink-0 text-[#5b6678]" />
              <span class="sr-only">부정</span>
              <b class="whitespace-nowrap text-[0.9rem] font-bold text-overlay-dark-80">
                {{ formatNumber(periodFeedbackSummary.dislikeCount) }}건
              </b>
            </div>
          </div>
        </div>
      </div>

      <!-- ── 피드백 추이 바 차트 ── -->
      <div class="rounded-xl border border-bg-300/60 bg-primary-white p-5">
        <div class="flex items-center justify-between gap-4">
          <h3 class="text-[0.95rem] font-bold text-overlay-dark-80">피드백 추이</h3>
          <!-- 기간 선택 — from/to 를 API로 보내지 않고 FE에서 받은 trend 를 잘라 표시한다. -->
          <div class="flex items-center gap-2">
            <!-- 기간 프리셋 토글 -->
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
                :aria-selected="activePeriod === tab.key && !isCustomActive"
                class="rounded-md px-3 py-1 text-[0.78rem] transition-colors"
                :class="
                  activePeriod === tab.key && !isCustomActive
                    ? 'bg-primary-white font-semibold text-overlay-dark-80 shadow-sm'
                    : 'text-overlay-dark-40 hover:text-overlay-dark-80'
                "
                @click="selectPreset(tab.key)"
              >
                {{ tab.label }}
              </button>
            </div>

            <!-- 기간 직접 선택 드롭다운 -->
            <div class="relative">
              <button
                data-testid="admin-feedback-custom-range-toggle"
                type="button"
                class="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[0.78rem] transition-colors"
                :class="
                  isCustomActive
                    ? 'border-primary/50 bg-primary/5 font-semibold text-overlay-dark-80'
                    : 'border-bg-300/60 bg-bg-100 text-overlay-dark-40 hover:text-overlay-dark-80'
                "
                :aria-expanded="isCustomRangeOpen"
                @click="isCustomRangeOpen ? closeCustomRange() : openCustomRange()"
              >
                <Calendar aria-hidden="true" class="size-3.5" />
                {{ customRangeLabel }}
              </button>

              <div v-if="isCustomRangeOpen">
                <!-- 외부 클릭 시 닫기 -->
                <div class="fixed inset-0 z-30" @click="closeCustomRange" />
                <div
                  data-testid="admin-feedback-custom-range-panel"
                  class="absolute right-0 z-40 mt-2 w-[230px] rounded-xl border border-bg-300/60 bg-primary-white p-4 shadow-floating"
                >
                  <p class="text-[0.74rem] font-semibold text-overlay-dark-80">기간 선택</p>
                  <p v-if="trendDateBounds" class="mt-0.5 text-[0.66rem] text-overlay-dark-40">
                    {{ trendDateBounds.min }} ~ {{ trendDateBounds.max }} 사이에서 선택할 수
                    있습니다.
                  </p>
                  <label class="mt-3 block text-[0.68rem] text-overlay-dark-40">
                    시작일
                    <input
                      v-model="draftFrom"
                      data-testid="admin-feedback-custom-range-from"
                      type="date"
                      :min="trendDateBounds?.min"
                      :max="draftTo || trendDateBounds?.max"
                      class="mt-1 w-full rounded-md border border-bg-300/60 bg-bg-100 px-2 py-1 text-[0.74rem] text-overlay-dark-80"
                    />
                  </label>
                  <label class="mt-2 block text-[0.68rem] text-overlay-dark-40">
                    종료일
                    <input
                      v-model="draftTo"
                      data-testid="admin-feedback-custom-range-to"
                      type="date"
                      :min="draftFrom || trendDateBounds?.min"
                      :max="trendDateBounds?.max"
                      class="mt-1 w-full rounded-md border border-bg-300/60 bg-bg-100 px-2 py-1 text-[0.74rem] text-overlay-dark-80"
                    />
                  </label>
                  <div class="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      class="rounded-md px-2.5 py-1 text-[0.72rem] text-overlay-dark-40 transition-colors hover:text-overlay-dark-80"
                      @click="closeCustomRange"
                    >
                      취소
                    </button>
                    <button
                      data-testid="admin-feedback-custom-range-apply"
                      type="button"
                      class="rounded-md bg-primary px-2.5 py-1 text-[0.72rem] font-semibold text-primary-white transition-colors hover:bg-primary/90"
                      @click="applyCustomRange"
                    >
                      적용
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center gap-4 text-[0.7rem] text-overlay-dark-40">
          <span class="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              class="size-2 rounded-full"
              style="background: linear-gradient(180deg, #f7a254, var(--color-primary))"
            ></span>
            긍정
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span aria-hidden="true" class="size-2 rounded-full bg-[#8d99ae] opacity-[0.55]"></span>
            부정
          </span>
        </div>

        <div data-testid="admin-feedback-trend-chart" class="relative mt-2">
          <svg
            v-if="trendChart"
            :viewBox="`0 0 ${CHART_W} ${CHART_H}`"
            class="pointer-events-none w-full overflow-visible"
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
                :stroke-dasharray="tick.value === 0 ? 'none' : '1.5 5'"
                stroke-width="0.55"
              />
              <text
                :x="CHART_PAD_LEFT - 7"
                :y="tick.y + 2"
                text-anchor="end"
                font-size="6.5"
                fill="var(--color-dark-40)"
              >
                {{ formatNumber(tick.value) }}
              </text>
            </g>

            <!-- 일자별 긍정/부정 그룹 바 (상단 라운드) -->
            <defs>
              <linearGradient id="admin-feedback-trend-like-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#f7a254" />
                <stop offset="1" stop-color="var(--color-primary)" />
              </linearGradient>
            </defs>
            <g v-for="bar in trendChart.bars" :key="bar.date">
              <path
                :data-testid="`admin-feedback-trend-like-bar-${bar.date}`"
                :d="bar.likePath"
                fill="url(#admin-feedback-trend-like-gradient)"
              />
              <path
                :data-testid="`admin-feedback-trend-dislike-bar-${bar.date}`"
                :d="bar.dislikePath"
                fill="#8d99ae"
                fill-opacity="0.55"
              />
              <text
                v-if="bar.showLabel"
                :x="bar.centerX"
                :y="CHART_H - 5"
                text-anchor="middle"
                font-size="6.5"
                fill="var(--color-dark-40)"
              >
                {{ bar.label }}
              </text>
            </g>
          </svg>
          <template v-if="trendChart">
            <div
              v-for="bar in trendChart.bars"
              :key="`${bar.date}-hit-area`"
              class="absolute top-0 z-10 h-full -translate-x-1/2"
              :style="{
                left: `${bar.tooltipLeftPercent}%`,
                width: `${bar.hitWidth}px`,
              }"
              @mouseenter="hoveredTrendBarDate = bar.date"
              @mouseleave="hoveredTrendBarDate = null"
            >
              <div
                v-if="hoveredTrendBarDate === bar.date"
                data-testid="admin-feedback-trend-tooltip"
                class="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-bg-300/60 bg-primary-white px-2.5 py-1.5 text-[0.66rem] shadow-[0_6px_16px_-8px_rgba(15,23,42,0.25)]"
                :style="{
                  left: '50%',
                  top: `${Math.max(4, bar.tooltipTopPercent - 30)}%`,
                }"
              >
                <p class="font-semibold text-overlay-dark-80">{{ bar.label }}</p>
                <p class="mt-0.5 text-overlay-dark-40">
                  긍정
                  <b class="text-primary">{{ formatNumber(bar.likeCount) }}건</b>
                  · 부정
                  <b class="text-[#5b6678]">{{ formatNumber(bar.dislikeCount) }}건</b>
                </p>
              </div>
            </div>
          </template>
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
          <div class="flex items-start justify-between gap-3">
            <div
              :data-testid="`admin-feedback-comment-${item.feedbackId}`"
              class="relative min-h-[60px] w-full max-w-[min(100%,39rem)] pb-3 pl-12 pr-9 pt-5 text-[0.82rem] font-medium leading-relaxed text-overlay-dark-80"
            >
              <svg
                class="absolute inset-0 size-full"
                viewBox="0 0 341 60"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient
                    :id="`admin-feedback-comment-gradient-${item.feedbackId}`"
                    x1="20"
                    y1="0"
                    x2="300"
                    y2="60"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stop-color="#FFA636" stop-opacity="0.1" />
                    <stop offset="0.55" stop-color="#FFA636" stop-opacity="0.45" />
                    <stop offset="1" stop-color="#FFA636" stop-opacity="0.62" />
                  </linearGradient>
                  <filter
                    :id="`admin-feedback-comment-inner-${item.feedbackId}`"
                    x="-8"
                    y="-8"
                    width="357"
                    height="76"
                    filterUnits="userSpaceOnUse"
                    color-interpolation-filters="sRGB"
                  >
                    <feFlood flood-opacity="0" result="BackgroundImageFix" />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="BackgroundImageFix"
                      result="shape"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="20" />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.35 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="shape"
                      result="effect1_innerShadow_feedback_comment"
                    />
                  </filter>
                </defs>
                <path
                  d="M29.32 0.4H320.19C331.05 0.4 339.85 9.2 339.85 20.06V39.76C339.85 50.61 331.05 59.41 320.19 59.41H78C72.27 59.41 61.44 59.41 55.5 59.41C49.79 59.41 48.96 59.41 43 59.41H29.32C24.56 59.41 20.19 57.72 16.79 54.91C13.4 57.17 7.96 59.32 1.39 58.12C3.2 57.34 10.18 52.69 9.92 43.38C9.75 42.2 9.66 40.99 9.66 39.76V20.06C9.66 9.2 18.46 0.4 29.32 0.4Z"
                  :fill="`url(#admin-feedback-comment-gradient-${item.feedbackId})`"
                  fill-opacity="0.62"
                  :filter="`url(#admin-feedback-comment-inner-${item.feedbackId})`"
                />
              </svg>
              <p class="relative z-10 break-words pr-1">{{ item.comment }}</p>
            </div>
            <span class="mt-1 shrink-0 text-[0.74rem] text-overlay-dark-40">
              {{ formatDateTime(item.createdAt) }}
            </span>
          </div>
          <div class="mt-4 space-y-3 border-t border-bg-200 pt-4">
            <div class="flex justify-end">
              <p
                :data-testid="`admin-feedback-question-${item.feedbackId}`"
                class="max-w-[78%] rounded-2xl rounded-tr-md border border-bg-300/60 bg-bg-200 px-4 py-3 text-[0.85rem] leading-6 text-overlay-dark-80"
              >
                {{ item.question }}
              </p>
            </div>
            <div class="flex items-start gap-2.5">
              <img
                :src="mascotFaceImageUrl"
                alt=""
                aria-hidden="true"
                class="mt-0.5 size-8 shrink-0 rounded-full border border-bg-300/60 bg-primary-white object-cover"
              />
              <p
                :data-testid="`admin-feedback-answer-${item.feedbackId}`"
                class="max-w-[82%] rounded-2xl rounded-tl-md border border-bg-300/60 bg-bg-100 px-4 py-3 text-[0.85rem] leading-6 text-overlay-dark-80"
              >
                {{ item.answer }}
              </p>
            </div>
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
