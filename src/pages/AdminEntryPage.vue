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

import {
  activateAdminKey,
  getAdminDataOverview,
  getAdminSyncHistory,
  getCurrentUser,
  startAdminIngestJob,
} from '@/api';
import { useToast } from '@/composables/useToast';
import type {
  AdminDataOverview,
  AdminKeyActivationResponse,
  AdminIngestMode,
  StartAdminIngestResponse,
  AdminSyncHistoryItem,
  AdminSyncHistoryResponse,
  AdminSyncStatus,
  CurrentUser,
} from '@/types/api';
import { BaseButton, BaseSpinner, EmptyState, ErrorRetryState, linaAdminImageUrl } from '@/shared';

const router = useRouter();
const isLoading = ref(true);
const errorMessage = ref('');
const currentUser = ref<CurrentUser | null>(null);
const adminDataOverview = ref<AdminDataOverview | null>(null);
const adminSyncHistory = ref<AdminSyncHistoryResponse['syncHistory']>([]);
const isActivatingAdminKey = ref(false);
const isStartingIngest = ref(false);
const adminActionHint = ref('`POST /api/admin/ingest` API 연결 전 placeholder 상태입니다.');
const adminKeyActivatedUntil = ref<string | null>(null);
const latestIngestJob = ref<StartAdminIngestResponse | null>(null);
const { showToast } = useToast();

const isAccessDenied = computed(() => currentUser.value?.role !== 'ADMIN');

type SectionKey = 'operations' | 'dashboard' | 'feedback' | 'sync';
const activeSection = ref<SectionKey>('operations');

const navigationItems: { key: SectionKey; label: string; icon: unknown }[] = [
  { key: 'operations', label: '운영', icon: Database },
  { key: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { key: 'feedback', label: '피드백', icon: MessageSquareQuote },
  { key: 'sync', label: '동기화 이력', icon: RefreshCw },
];

type AdminDisplayStatus = AdminSyncStatus | StartAdminIngestResponse['status'];


// ── feature14 운영 보드 ──────────────────────────────────────────────
const dataOverviewCards = computed(() => {
  if (!adminDataOverview.value) return [];
  return [
    { testId: 'totalSpaces', label: '스페이스', value: formatNumber(adminDataOverview.value.totalSpaces) },
    { testId: 'totalPages', label: '페이지', value: formatNumber(adminDataOverview.value.totalPages) },
    { testId: 'totalAttachments', label: '첨부파일', value: formatNumber(adminDataOverview.value.totalAttachments) },
    { testId: 'vectorDbSize', label: 'VectorDB', value: adminDataOverview.value.vectorDbSize },
    { testId: 'totalChunks', label: '청크', value: formatNumber(adminDataOverview.value.totalChunks) },
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

function getStatusClasses(status: AdminDisplayStatus): string {
  if (status === 'FAILED') return 'bg-status-error/10 text-status-error';
  if (status === 'COMPLETED') return 'bg-[#F0FDF4] text-[#22C55E]';
  if (status === 'IN_PROGRESS') return 'bg-primary/8 text-primary';
  if (status === 'STARTED') return 'bg-[#EFF6FF] text-[#3B82F6]';
  return 'bg-bg-300 text-overlay-dark-60';
}

function getIngestStatusLabel(status: StartAdminIngestResponse['status'] | null | undefined): string {
  if (!status) return '대기 중';
  const map: Record<StartAdminIngestResponse['status'], string> = {
    STARTED: '작업 시작됨',
    IN_PROGRESS: '수집 중',
    COMPLETED: '완료',
    FAILED: '실패',
  };
  return map[status];
}

function getIngestStatusBadgeClasses(status: StartAdminIngestResponse['status'] | null | undefined): string {
  if (!status) return 'bg-bg-200 text-overlay-dark-40';
  return getStatusClasses(status);
}

function isAdminKeyStillActive(value: string | null): boolean {
  if (!value) {
    return false;
  }

  return new Date(value).getTime() > Date.now();
}

function applyAdminKeyActivation(response: AdminKeyActivationResponse) {
  adminKeyActivatedUntil.value = response.activatedUntil;
  adminActionHint.value = `Admin Key 활성 완료: ${formatDateTime(response.activatedUntil)}까지 사용 가능합니다.`;
}

function goToLogin() {
  void router.push('/login');
}

async function handleActivateAdminKey() {
  isActivatingAdminKey.value = true;

  try {
    const response = await activateAdminKey();
    applyAdminKeyActivation(response);
    showToast('Admin Key를 활성화했습니다.', { variant: 'success' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Admin Key를 활성화하는 중 오류가 발생했습니다.';
    adminActionHint.value = message;
    showToast(message, { variant: 'error' });
  } finally {
    isActivatingAdminKey.value = false;
  }
}

async function handleStartIngest(mode: AdminIngestMode = 'full') {
  isStartingIngest.value = true;

  try {
    if (!isAdminKeyStillActive(adminKeyActivatedUntil.value)) {
      const activation = await activateAdminKey();
      applyAdminKeyActivation(activation);
      showToast('Admin Key를 활성화한 뒤 데이터 불러오기를 시작합니다.', { variant: 'info' });
    }

    const response = await startAdminIngestJob({ mode });
    latestIngestJob.value = response;
    adminActionHint.value = `데이터 수집 작업이 시작되었습니다. jobId: ${response.jobId}`;
    showToast('데이터 불러오기 작업을 시작했습니다.', { variant: 'success' });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '데이터 불러오기 작업을 시작하는 중 오류가 발생했습니다.';
    adminActionHint.value = message;
    showToast(message, { variant: 'error' });
  } finally {
    isStartingIngest.value = false;
  }
}
</script>

<template>
  <main
    data-testid="admin-entry-page"
    class="min-h-screen bg-bg-100 text-overlay-dark-80"
  >
    <!-- 로딩 -->
    <section
      v-if="isLoading"
      class="flex min-h-screen items-center justify-center"
    >
      <BaseSpinner label="관리자 보드를 불러오고 있습니다" />
    </section>

    <!-- 에러 -->
    <section
      v-else-if="errorMessage"
      data-testid="admin-board-error"
      class="flex min-h-screen items-center justify-center"
    >
      <ErrorRetryState
        title="관리자 보드를 불러오지 못했습니다"
        :message="errorMessage"
        retry-label="보드 다시 불러오기"
        data-testid="admin-board-retry"
        @retry="loadAdminBoard"
      />
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
          <ShieldAlert
            aria-hidden="true"
            class="size-7"
          />
        </div>
        <h1 class="mt-5 text-heading font-semibold text-overlay-dark-80">관리자 권한이 없는 계정입니다</h1>
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
            <ArrowLeft
              aria-hidden="true"
              class="size-4"
            />
            Login 화면으로 돌아가기
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- 메인 레이아웃 -->
    <div
      v-else
      data-testid="admin-page"
      class="flex min-h-screen"
    >
      <!-- ── 사이드바 ── -->
      <aside class="flex w-[220px] shrink-0 flex-col border-r border-bg-300/60 bg-primary-white">
        <!-- 로고 -->
        <div class="border-b border-bg-300/60 px-7 py-6">
          <h1 class="text-[1.35rem] font-bold tracking-[-0.06em] text-overlay-dark-80">LINA</h1>
          <p class="mt-0.5 text-[0.74rem] text-overlay-dark-40">Admin</p>
        </div>

        <!-- 내비게이션 -->
        <nav
          data-testid="admin-nav"
          class="flex-1 space-y-0.5 px-3 py-5"
        >
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
      <div class="flex-1 overflow-auto bg-bg-100">
        <!-- ── 운영 (SCR-800) ── -->
        <section
          v-if="activeSection === 'operations'"
          class="px-8 py-8"
        >
          <header class="mb-7">
            <h2 class="text-[1.55rem] font-bold tracking-[-0.04em] text-overlay-dark-80">운영</h2>
            <p class="mt-1 text-[0.88rem] text-overlay-dark-40">Confluence 데이터 수집 및 동기화를 관리하세요</p>
          </header>

          <!-- 데이터 파이프라인 -->
          <div
            data-testid="admin-ingest-placeholder"
            class="mb-6 rounded-2xl border border-bg-300/60 bg-primary-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2.5">
                  <h3 class="text-[1.05rem] font-semibold text-overlay-dark-80">데이터 파이프라인</h3>
                  <span
                    class="rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold transition-colors"
                    :class="getIngestStatusBadgeClasses(latestIngestJob?.status)"
                  >
                    {{ getIngestStatusLabel(latestIngestJob?.status) }}
                  </span>
                </div>
                <p class="mt-1 text-[0.8rem] text-overlay-dark-40">Confluence 스페이스: CPC</p>
              </div>
              <div class="flex gap-2">
                <BaseButton
                  variant="secondary"
                  data-testid="admin-activate-key-button"
                  :disabled="isActivatingAdminKey || isStartingIngest"
                  @click="handleActivateAdminKey"
                >
                  {{ isActivatingAdminKey ? 'API 키 발급 중' : 'API 키 발급' }}
                </BaseButton>
                <BaseButton
                  variant="primary"
                  data-testid="admin-start-ingest-button"
                  :disabled="isStartingIngest || isActivatingAdminKey"
                  @click="handleStartIngest('full')"
                >
                  {{ isStartingIngest ? '데이터 불러오는 중' : '데이터 불러오기' }}
                </BaseButton>
              </div>
            </div>
            <p class="mt-4 rounded-xl bg-bg-100 px-4 py-2.5 text-[0.78rem] text-overlay-dark-40">
              {{ adminActionHint }}
            </p>

            <div
              v-if="latestIngestJob"
              data-testid="admin-latest-ingest-status"
              class="mt-3 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3"
            >
              <div>
                <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-primary">최근 실행 작업</p>
                <p class="mt-1 text-[0.82rem] text-overlay-dark-80">
                  jobId: {{ latestIngestJob.jobId }}
                </p>
              </div>
              <span
                class="rounded-full px-3 py-1 text-[0.72rem] font-semibold"
                :class="getStatusClasses(latestIngestJob.status)"
              >
                {{ latestIngestJob.status }}
              </span>
            </div>
          </div>

          <!-- 데이터 현황 -->
          <section class="mb-6">
            <h3 class="mb-3 text-[0.95rem] font-semibold text-overlay-dark-80">데이터 현황</h3>

            <div
              class="mb-3 rounded-2xl border border-primary/25 bg-primary-white px-6 py-4 shadow-[0_2px_10px_rgba(244,129,34,0.08)]"
            >
              <p class="text-[0.7rem] font-semibold uppercase tracking-wider text-primary">마지막 동기화</p>
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
                <p class="mt-2 text-[1.4rem] font-bold tracking-[-0.05em] text-overlay-dark-80">{{ card.value }}</p>
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
                <span class="text-overlay-dark-80">{{ formatNumber(syncItem.updatedPages) }}개</span>
                <span class="text-overlay-dark-80">{{ formatNumber(syncItem.deletedPages) }}개</span>
                <span class="text-overlay-dark-80">{{ formatNumber(syncItem.duration) }}초</span>
                <span class="text-overlay-dark-60">{{ formatDateTime(syncItem.completedAt) }}</span>
              </div>
            </div>
          </section>
        </section>

        <!-- ── 준비 중 섹션 (대시보드 / 피드백 / 동기화 이력) ── -->
        <section
          v-else
          class="flex h-full min-h-[60vh] items-center justify-center"
        >
          <div class="text-center">
            <p class="text-[0.9rem] font-medium text-overlay-dark-80">
              {{ activeSection === 'dashboard' ? '대시보드' : activeSection === 'feedback' ? '피드백' : '동기화 이력' }}
            </p>
            <p class="mt-2 text-[0.82rem] text-overlay-dark-40">이 기능은 곧 제공될 예정입니다.</p>
          </div>
        </section>
      </div>
    </div>
  </main>
</template>
