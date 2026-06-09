<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin 운영 메인 보드(SCR-800) 화면 구현.
          관리자 전용 데이터 수집 현황, 최근 동기화 이력, 수집 버튼 placeholder 상태를 표시한다.
작성일 : 2026-06-09
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-05, feature12 구현, /admin placeholder route 추가
  - 2026-06-09, feature14 구현, Admin shell 및 데이터 수집 메인 보드 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeft,
  Database,
  LayoutDashboard,
  MessageSquareQuote,
  RefreshCw,
  ShieldAlert,
} from '@lucide/vue';

import { getAdminDataOverview, getAdminSyncHistory, getCurrentUser } from '@/api';
import type {
  AdminDataOverview,
  AdminSyncHistoryItem,
  AdminSyncStatus,
  AdminSyncHistoryResponse,
  CurrentUser,
} from '@/types/api';
import { BaseButton, BaseSpinner, EmptyState, ErrorRetryState, linaAdminImageUrl } from '@/shared';

const isLoading = ref(true);
const errorMessage = ref('');
const currentUser = ref<CurrentUser | null>(null);
const adminDataOverview = ref<AdminDataOverview | null>(null);
const adminSyncHistory = ref<AdminSyncHistoryResponse['syncHistory']>([]);
const router = useRouter();

const isAccessDenied = computed(() => currentUser.value?.role !== 'ADMIN');

const navigationItems = [
  { key: 'operations', label: '운영', icon: Database, isActive: true },
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard, isActive: false },
  { key: 'feedback', label: '피드백', icon: MessageSquareQuote, isActive: false },
  { key: 'sync', label: '동기화 이력', icon: RefreshCw, isActive: false },
] as const;

const dataOverviewCards = computed(() => {
  if (!adminDataOverview.value) {
    return [];
  }

  return [
    {
      testId: 'totalSpaces',
      label: '스페이스 수',
      value: formatNumber(adminDataOverview.value.totalSpaces),
    },
    {
      testId: 'totalPages',
      label: '페이지 수',
      value: formatNumber(adminDataOverview.value.totalPages),
    },
    {
      testId: 'totalAttachments',
      label: '첨부 수',
      value: formatNumber(adminDataOverview.value.totalAttachments),
    },
    {
      testId: 'vectorDbSize',
      label: 'VectorDB',
      value: adminDataOverview.value.vectorDbSize,
    },
    {
      testId: 'totalChunks',
      label: '청크 수',
      value: formatNumber(adminDataOverview.value.totalChunks),
    },
  ];
});

onMounted(() => {
  void loadAdminBoard();
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

    const [dataOverview, syncHistory] = await Promise.all([
      getAdminDataOverview(),
      getAdminSyncHistory(),
    ]);

    adminDataOverview.value = dataOverview;
    adminSyncHistory.value = syncHistory.syncHistory;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : '관리자 데이터를 불러오는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
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

function getStatusLabel(status: AdminSyncStatus): string {
  return status;
}

function getStatusClasses(status: AdminSyncHistoryItem['status']): string {
  if (status === 'FAILED') {
    return 'bg-status-error/10 text-status-error';
  }

  if (status === 'COMPLETED') {
    return 'bg-primary/10 text-primary';
  }

  return 'bg-bg-300 text-overlay-dark-60';
}

function goToLogin() {
  void router.push('/login');
}
</script>

<template>
  <main
    data-testid="admin-entry-page"
    class="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(216,245,234,0.85),_rgba(248,250,252,1)_48%)] px-5 py-6 text-overlay-dark-80 sm:px-7 lg:px-8"
  >
    <section
      v-if="isLoading"
      class="flex min-h-[70vh] items-center justify-center rounded-[32px] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
    >
      <BaseSpinner label="관리자 보드를 불러오고 있습니다" />
    </section>

    <section
      v-else-if="errorMessage"
      data-testid="admin-board-error"
      class="flex min-h-[70vh] items-center justify-center rounded-[32px] border border-white/70 bg-white/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
    >
      <ErrorRetryState
        title="관리자 보드를 불러오지 못했습니다"
        :message="errorMessage"
        retry-label="보드 다시 불러오기"
        data-testid="admin-board-retry"
        @retry="loadAdminBoard"
      />
    </section>

    <section
      v-else-if="isAccessDenied"
      data-testid="admin-access-denied"
      class="flex min-h-[70vh] items-center justify-center rounded-[32px] border border-status-error/20 bg-white/80 px-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
    >
      <div class="max-w-md text-center">
        <div
          class="mx-auto flex size-16 items-center justify-center rounded-full bg-status-error/10 text-status-error"
        >
          <ShieldAlert aria-hidden="true" class="size-8" />
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

    <section
      v-else
      data-testid="admin-page"
      class="grid min-h-[70vh] gap-5 lg:grid-cols-[264px_minmax(0,1fr)]"
    >
      <aside
        class="overflow-hidden rounded-[32px] border border-white/70 bg-[#0f172a] text-white shadow-[0_28px_72px_rgba(15,23,42,0.24)]"
      >
        <div class="border-b border-white/10 px-6 pb-6 pt-7">
          <div class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-small">
            <span class="size-2 rounded-full bg-primary" />
            Admin
          </div>
          <h1 class="mt-5 text-[2rem] font-semibold tracking-[-0.04em]">LINA</h1>
          <p class="mt-2 text-small text-white/70">Confluence 데이터 수집 및 동기화를 관리하세요</p>
        </div>

        <nav data-testid="admin-nav" class="space-y-2 px-4 py-5">
          <button
            v-for="item in navigationItems"
            :key="item.key"
            type="button"
            class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition"
            :class="
              item.isActive
                ? 'bg-white text-overlay-dark-80 shadow-[0_10px_24px_rgba(255,255,255,0.16)]'
                : 'text-white/65 hover:bg-white/8 hover:text-white'
            "
            :aria-current="item.isActive ? 'page' : undefined"
            :disabled="!item.isActive"
          >
            <component :is="item.icon" aria-hidden="true" class="size-4" />
            <span class="text-body font-medium">{{ item.label }}</span>
          </button>
        </nav>

        <div class="mt-auto border-t border-white/10 px-5 py-5">
          <div class="flex items-center gap-3 rounded-3xl bg-white/8 p-4">
            <img
              :src="currentUser?.profileImageUrl || linaAdminImageUrl"
              alt=""
              class="size-14 rounded-2xl border border-white/10 object-cover"
            />
            <div class="min-w-0">
              <p
                data-testid="admin-profile-name"
                class="truncate text-body font-semibold text-white"
              >
                {{ currentUser?.name }}
              </p>
              <p data-testid="admin-profile-email" class="truncate text-small text-white/65">
                {{ currentUser?.email }}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <section class="space-y-5">
        <header
          class="rounded-[32px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div class="space-y-2">
              <p class="text-small font-semibold uppercase tracking-[0.24em] text-primary">운영</p>
              <h2 class="text-heading font-semibold text-overlay-dark-80">데이터 파이프라인</h2>
              <p class="text-body text-overlay-dark-40">
                Confluence 데이터 수집과 최근 동기화 상태를 한 화면에서 점검합니다.
              </p>
            </div>

            <div
              data-testid="admin-ingest-placeholder"
              class="min-w-full rounded-[28px] border border-dashed border-primary/30 bg-primary/5 p-5 xl:min-w-[320px]"
            >
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-small font-semibold text-primary">연결 대기 중</p>
                  <p class="mt-2 text-body text-overlay-dark-80">
                    `POST /api/admin/ingest` API 연결 전 placeholder 상태입니다.
                  </p>
                </div>
                <BaseButton variant="secondary" disabled>API 키 발급</BaseButton>
              </div>

              <div class="mt-4 flex flex-wrap gap-3">
                <BaseButton variant="primary" disabled>데이터 수집</BaseButton>
                <BaseButton variant="ghost" disabled>데이터 싱크</BaseButton>
              </div>
            </div>
          </div>
        </header>

        <section
          class="rounded-[32px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 class="text-heading font-semibold text-overlay-dark-80">데이터 현황</h3>
              <p class="text-body text-overlay-dark-40">
                현재 적재된 Confluence 데이터 기준입니다.
              </p>
            </div>
            <p data-testid="admin-last-sync-at" class="text-small text-overlay-dark-40">
              마지막 동기화
              {{ adminDataOverview ? formatDateTime(adminDataOverview.lastSyncAt) : '-' }}
            </p>
          </div>

          <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <article
              v-for="card in dataOverviewCards"
              :key="card.testId"
              :data-testid="`admin-data-card-${card.testId}`"
              class="rounded-[24px] border border-bg-200 bg-bg-100/80 px-5 py-4"
            >
              <p class="text-small text-overlay-dark-40">{{ card.label }}</p>
              <p class="mt-3 text-[1.75rem] font-semibold tracking-[-0.04em] text-overlay-dark-80">
                {{ card.value }}
              </p>
            </article>
          </div>
        </section>

        <section
          class="rounded-[32px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-heading font-semibold text-overlay-dark-80">최근 동기화 이력</h3>
              <p class="text-body text-overlay-dark-40">
                최근 작업 결과를 확인하고 이후 상세 화면으로 확장합니다.
              </p>
            </div>
            <BaseButton variant="ghost" disabled>전체 보기</BaseButton>
          </div>

          <EmptyState
            v-if="adminSyncHistory.length === 0"
            data-testid="admin-sync-empty"
            class="mt-6"
            title="최근 동기화 이력이 없습니다"
            description="관리자 수집 작업이 시작되면 최근 이력이 여기에 표시됩니다."
          />

          <div v-else class="mt-6 overflow-hidden rounded-[28px] border border-bg-200">
            <div
              class="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_1.2fr] gap-3 bg-bg-100 px-5 py-4 text-small font-semibold text-overlay-dark-40"
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
              class="grid grid-cols-[1.1fr_0.8fr_0.8fr_0.8fr_1.2fr] gap-3 border-t border-bg-200 px-5 py-4 text-body text-overlay-dark-80"
            >
              <span
                class="inline-flex w-fit items-center rounded-full px-3 py-1 text-small font-semibold"
                :class="getStatusClasses(syncItem.status)"
              >
                {{ getStatusLabel(syncItem.status) }}
              </span>
              <span>{{ formatNumber(syncItem.updatedPages) }}개</span>
              <span>{{ formatNumber(syncItem.deletedPages) }}개</span>
              <span>{{ formatNumber(syncItem.duration) }}초</span>
              <span>{{ formatDateTime(syncItem.completedAt) }}</span>
            </div>
          </div>
        </section>
      </section>
    </section>
  </main>
</template>
