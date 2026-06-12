<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin SCR-830 동기화 이력 탭 컨텐츠.
          GET /api/admin/sync 응답의 전체 동기화 이력을 테이블과 pagination으로 렌더링한다.
작성일 : 2026-06-12
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-12, feature17 구현, Admin 동기화 이력 화면 신규 구현
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue';

import { getAdminSyncHistory } from '@/api';
import { BaseButton, BaseSpinner, EmptyState, ErrorRetryState } from '@/shared';
import type { AdminSyncHistoryItem, AdminSyncHistoryResponse, AdminSyncStatus } from '@/types/api';
import type { Ref } from 'vue';

interface TabPaginationState {
  currentPage: Ref<number>;
  pageSize: Ref<number>;
}

type TabPaginationMap = Record<string, TabPaginationState>;

const props = defineProps<{
  initialSyncHistory: AdminSyncHistoryResponse['syncHistory'];
}>();

const tabPagination = inject<TabPaginationMap>('adminTabPagination');
const currentPage = tabPagination?.sync?.currentPage ?? ref(1);
const SYNC_PAGE_SIZE = 5;
const pageSize = tabPagination?.sync?.pageSize ?? ref(SYNC_PAGE_SIZE);
pageSize.value = SYNC_PAGE_SIZE;

const isLoading = ref(false);
const error = ref('');
const syncHistory = ref<AdminSyncHistoryItem[]>(props.initialSyncHistory);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(syncHistory.value.length / pageSize.value)),
);
const paginatedSyncHistory = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return syncHistory.value.slice(start, start + pageSize.value);
});
const isPrevDisabled = computed(() => currentPage.value <= 1);
const isNextDisabled = computed(() => currentPage.value >= totalPages.value);

onMounted(() => {
  void loadSyncHistory();
});

async function loadSyncHistory() {
  isLoading.value = true;
  error.value = '';
  try {
    const response = await getAdminSyncHistory();
    syncHistory.value = response.syncHistory;
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value;
    }
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : '동기화 이력을 불러오는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
}

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

const STATUS_DISPLAY_LABELS: Record<AdminSyncStatus, string> = {
  STARTED: '수집 준비',
  IN_PROGRESS: '수집 중',
  COMPLETED: '완료',
  FAILED: '실패',
};

function getStatusLabel(status: AdminSyncStatus): string {
  return STATUS_DISPLAY_LABELS[status];
}

function getStatusClasses(status: AdminSyncStatus): string {
  if (status === 'FAILED') return 'bg-status-error/10 text-status-error';
  if (status === 'COMPLETED') return 'bg-[#F0FDF4] text-[#22C55E]';
  if (status === 'IN_PROGRESS') return 'bg-primary/8 text-primary';
  return 'bg-[#EFF6FF] text-[#3B82F6]';
}
</script>

<template>
  <section v-if="isLoading" class="flex min-h-[60vh] items-center justify-center">
    <BaseSpinner label="동기화 이력을 불러오고 있습니다" />
  </section>

  <section
    v-else-if="error"
    data-testid="admin-sync-history-error"
    class="flex min-h-[60vh] items-center justify-center"
  >
    <ErrorRetryState
      title="동기화 이력을 불러오지 못했습니다"
      :message="error"
      retry-label="다시 불러오기"
      data-testid="admin-sync-history-retry"
      @retry="loadSyncHistory"
    />
  </section>

  <section v-else data-testid="admin-sync-history-section" class="px-8 pb-4 pt-7">
    <header class="flex items-start justify-between gap-4">
      <div>
        <h2 class="flex items-center gap-2 text-[1.25rem] font-semibold text-overlay-dark-80">
          <span>문서 데이터 관리</span>
          <span aria-hidden="true" class="text-[1rem] font-medium text-overlay-dark-30">&gt;</span>
          <span class="text-primary">동기화 이력</span>
        </h2>
      </div>
      <BaseButton variant="secondary" class="font-normal" @click="loadSyncHistory">
        새로고침
      </BaseButton>
    </header>

    <EmptyState
      v-if="syncHistory.length === 0"
      data-testid="admin-sync-history-empty"
      class="mt-6 rounded-2xl border border-bg-300/60 bg-primary-white py-14"
      title="동기화 이력이 없습니다"
      description="관리자 수집 작업이 시작되면 전체 동기화 이력이 여기에 표시됩니다."
    />

    <template v-else>
      <div
        class="mt-6 overflow-hidden rounded-2xl border border-bg-300/60 bg-primary-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
      >
        <div
          class="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_1.4fr] border-b border-bg-200 bg-bg-100 px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-wider text-overlay-dark-40"
        >
          <span>상태</span>
          <span>업데이트</span>
          <span>삭제</span>
          <span>소요시간</span>
          <span>완료시각</span>
        </div>

        <div
          v-for="syncItem in paginatedSyncHistory"
          :key="syncItem.syncId"
          :data-testid="`admin-sync-history-row-${syncItem.syncId}`"
          class="grid grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_1.4fr] border-t border-bg-300/60 px-6 py-4 text-[0.85rem] transition-colors first:border-t-0 hover:bg-bg-200/40"
        >
          <span>
            <span
              :data-testid="`admin-sync-status-${syncItem.syncId}`"
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

        <div
          data-testid="admin-sync-history-pagination"
          class="flex items-center justify-end border-t border-bg-300/60 px-6 py-3 text-[0.78rem]"
        >
          <div class="flex items-center gap-3 text-overlay-dark-40">
            <span>{{ currentPage }} / {{ totalPages }} 페이지</span>
            <button
              type="button"
              data-testid="admin-sync-history-pagination-prev"
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
              type="button"
              data-testid="admin-sync-history-pagination-next"
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
    </template>
  </section>
</template>
