/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend 인증 상태 Pinia store.
 *           accessToken은 localStorage 단일 소스, currentUser·isAuthenticated·isRestoringSession만 Pinia에 관리한다.
 *           (auth-session-storage-plan.md 기준)
 * 작성일 : 2026-06-15
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-06-15, feature13 구현, Auth Pinia store 초기 작성
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Pinia 2.3.x 기준
 * --------------------------------------------------
 */
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { getCurrentUser, logout as apiLogout } from '@/api';
import type { CurrentUser } from '@/types/api';

const ACCESS_TOKEN_KEY = 'accessToken';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<CurrentUser | null>(null);
  const isRestoringSession = ref(false);
  // 라우터 가드가 세션 복원 시도 전에 실행되지 않도록 추적하는 플래그
  const sessionRestoreAttempted = ref(false);

  const isAuthenticated = computed(() => currentUser.value !== null);

  /**
   * 앱 부팅 시 localStorage accessToken을 검증해 사용자 상태를 복원한다.
   * 토큰이 없거나 /api/users/me가 실패하면 인증 상태를 해제한다.
   */
  async function restoreSession(): Promise<void> {
    sessionRestoreAttempted.value = true;

    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;

    if (!token) {
      return;
    }

    isRestoringSession.value = true;
    try {
      currentUser.value = await getCurrentUser();
    } catch {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      currentUser.value = null;
    } finally {
      isRestoringSession.value = false;
    }
  }

  /**
   * localStorage accessToken을 제거하고 Pinia 인증 상태를 초기화한다.
   */
  function clearAuth(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    currentUser.value = null;
  }

  /**
   * POST /api/auth/logout을 호출한 뒤 clearAuth를 실행한다.
   * logout API가 실패해도 로컬 인증 상태는 반드시 해제한다.
   */
  async function logout(): Promise<void> {
    try {
      await apiLogout();
    } catch {
      // Best-effort: 서버 로그아웃 실패해도 로컬 상태는 정리한다
    } finally {
      clearAuth();
    }
  }

  return { currentUser, isAuthenticated, isRestoringSession, sessionRestoreAttempted, restoreSession, clearAuth, logout };
});
