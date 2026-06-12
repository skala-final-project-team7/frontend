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
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vue Router 4.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import { createRouter, createWebHistory } from 'vue-router';

import AdminEntryPage from '@/pages/AdminEntryPage.vue';
import ChatPage from '@/pages/ChatPage.vue';
import LandingPage from '@/pages/LandingPage.vue';
import LoginPage from '@/pages/LoginPage.vue';

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
      path: '/chat',
      name: 'chat',
      component: ChatPage,
    },
    {
      path: '/chat/:conversationId',
      name: 'chat-conversation',
      component: ChatPage,
    },
    {
      path: '/admin',
      name: 'admin-entry',
      component: AdminEntryPage,
    },
    {
      path: '/admin/operations',
      name: 'admin-operations',
      component: AdminEntryPage,
    },
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminEntryPage,
    },
    {
      path: '/admin/feedback',
      name: 'admin-feedback',
      component: AdminEntryPage,
    },
    {
      path: '/admin/sync',
      name: 'admin-sync',
      component: AdminEntryPage,
    },
  ],
});

export default router;
