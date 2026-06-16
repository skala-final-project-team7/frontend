<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin route shell.
          데이터 로딩, 전역 상태 관리, AdminShellLayout + 탭 컨텐츠 조립만 담당한다.
작성일 : 2026-06-09
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-05, feature12 구현, /admin placeholder route 추가
  - 2026-06-09, feature14 구현, Admin shell 및 데이터 수집 메인 보드 추가
  - 2026-06-10, feature14-refactor.2, AdminShellLayout·AdminOperationsSection으로 분리
  - 2026-06-10, feature15 구현, 대시보드(SCR-810) 탭을 AdminDashboardSection으로 교체
  - 2026-06-11, feature16 구현, 피드백(SCR-820) 탭을 AdminFeedbackSection으로 교체
  - 2026-06-12, feature17 구현, 동기화 이력(SCR-830) 섹션 추가 및 하위 탭 연결
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, ShieldAlert } from '@lucide/vue';

import { getAdminDataOverview, getAdminSyncHistory, getCurrentUser } from '@/api';
import { useTabPagination } from '@/composables/useTabPagination';
import type { AdminDataOverview, AdminSyncHistoryResponse, CurrentUser } from '@/types/api';
import { BaseButton, BaseSpinner, ErrorRetryState, mascotWrongImageUrl } from '@/shared';
import AdminShellLayout from '@/features/admin/AdminShellLayout.vue';
import AdminDashboardSection from '@/features/admin/AdminDashboardSection.vue';
import AdminFeedbackSection from '@/features/admin/AdminFeedbackSection.vue';
import AdminOperationsSection from '@/features/admin/AdminOperationsSection.vue';
import AdminSyncHistorySection from '@/features/admin/AdminSyncHistorySection.vue';

const route = useRoute();
const router = useRouter();
const isLoading = ref(true);
const errorMessage = ref('');
const currentUser = ref<CurrentUser | null>(null);
const adminDataOverview = ref<AdminDataOverview | null>(null);
const adminSyncHistory = ref<AdminSyncHistoryResponse['syncHistory']>([]);

type SectionKey = 'operations' | 'dashboard' | 'feedback' | 'sync';
const activeSection = ref<SectionKey>('operations');

const SECTION_KEYS = ['operations', 'dashboard', 'feedback', 'sync'] as const;
const { pagination: tabPagination } = useTabPagination<SectionKey>(SECTION_KEYS);
// feature15-17 탭 서브컴포넌트에서 inject('adminTabPagination')으로 탭별 독립 페이지네이션 상태에 접근한다.
provide('adminTabPagination', tabPagination);

const isAccessDenied = computed(() => currentUser.value?.role !== 'ADMIN');

onMounted(() => {
  void loadAdminBoard();
});

watch(
  () => route.path,
  (path) => {
    activeSection.value = getSectionFromPath(path);
  },
  { immediate: true },
);

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

function goToLogin() {
  void router.push('/login');
}

function goToHome() {
  void router.push('/');
}

function handleSectionChange(section: SectionKey) {
  activeSection.value = section;
  const targetPath = getPathFromSection(section);
  if (route.path !== targetPath) {
    void router.push(targetPath);
  }
}

function getSectionFromPath(path: string): SectionKey {
  if (path === '/admin/dashboard') return 'dashboard';
  if (path === '/admin/feedback') return 'feedback';
  if (path === '/admin/sync') return 'sync';
  return 'operations';
}

function getPathFromSection(section: SectionKey): string {
  if (section === 'dashboard') return '/admin/dashboard';
  if (section === 'feedback') return '/admin/feedback';
  if (section === 'sync') return '/admin/sync';
  return '/admin/operations';
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
        <button
          data-testid="admin-board-error-home-button"
          type="button"
          class="mt-4 text-[0.84rem] text-overlay-dark-40 underline underline-offset-4 transition-colors hover:text-overlay-dark-80"
          @click="goToHome"
        >
          홈으로 돌아가기
        </button>
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
    <AdminShellLayout
      v-else
      :active-section="activeSection"
      :current-user="currentUser"
      @section-change="handleSectionChange"
    >
      <!-- 운영 (SCR-800) -->
      <AdminOperationsSection
        v-if="activeSection === 'operations'"
        :admin-data-overview="adminDataOverview"
        :admin-sync-history="adminSyncHistory"
        @view-all-sync="handleSectionChange('sync')"
        @refresh-requested="refreshAdminBoardData"
      />

      <!-- 대시보드 (SCR-810) -->
      <AdminDashboardSection v-else-if="activeSection === 'dashboard'" />

      <!-- 피드백 (SCR-820) -->
      <AdminFeedbackSection v-else-if="activeSection === 'feedback'" />

      <!-- 동기화 이력 (SCR-830) -->
      <AdminSyncHistorySection v-else :initial-sync-history="adminSyncHistory" />
    </AdminShellLayout>
  </main>
</template>
