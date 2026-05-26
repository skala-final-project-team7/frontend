/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend의 Vue Router 기본 라우팅 구성.
 *           루트 진입 경로를 Chat 페이지 shell로 연결한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature3 구현, 루트 Chat 라우트 추가
 *   - 2026-05-21, feature9 보강, 대화 상세 route /chat/:conversationId 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vue Router 4.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import { createRouter, createWebHistory } from 'vue-router';

import ChatPage from '@/pages/ChatPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
  ],
});

export default router;
