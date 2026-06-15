/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend의 Vue Router 기본 라우팅 구성.
 *           서비스 기본 진입 경로를 Login 화면으로 연결한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature3 구현, 루트 Chat 라우트 추가
 *   - 2026-05-21, feature9 보강, 대화 상세 route /chat/:conversationId 추가
 *   - 2026-06-05, feature12 구현, Login/Auth mock 라우트 추가
 *   - 2026-06-05, feature12 보강, 루트 경로를 Login route로 redirect
 *   - 2026-06-10, feature15 구현, /admin/dashboard route 추가
 *   - 2026-06-11, feature16 구현, /admin/feedback route 추가
 *   - 2026-06-12, feature17 구현, /admin/sync route 추가
 *   - 2026-06-15, feature13 구현, /auth/callback route 추가, 인증 네비게이션 가드 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vue Router 4.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import { getActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';

import AdminEntryPage from '@/pages/AdminEntryPage.vue';
import AuthCallbackPage from '@/pages/AuthCallbackPage.vue';
import ChatPage from '@/pages/ChatPage.vue';
import LandingPage from '@/pages/LandingPage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingPage,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallbackPage,
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/chat/:conversationId',
      name: 'chat-conversation',
      component: ChatPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin-entry',
      component: AdminEntryPage,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/operations',
      name: 'admin-operations',
      component: AdminEntryPage,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminEntryPage,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/feedback',
      name: 'admin-feedback',
      component: AdminEntryPage,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/admin/sync',
      name: 'admin-sync',
      component: AdminEntryPage,
      meta: { requiresAuth: true, requiresAdmin: true },
    },
  ],
});

router.beforeEach((to) => {
  if (!getActivePinia()) return;

  const authStore = useAuthStore();

  // main.ts에서 restoreSession()이 호출된 이후에만 가드를 활성화한다
  if (!authStore.sessionRestoreAttempted) return;

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' };
  }

  if (to.meta.requiresAdmin && authStore.currentUser?.role !== 'ADMIN') {
    return { name: 'login' };
  }
});

export default router;
