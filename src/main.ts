/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend Vue 애플리케이션의 진입점 구성.
 *           기본 App 컴포넌트와 전역 스타일을 연결하고 앱을 마운트한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, 최초 작성, Vue 앱 기본 부팅 처리 추가
 *   - 2026-05-21, feature9 보강, Pinia plugin 등록
 *   - 2026-06-15, feature13 구현, 앱 부팅 시 localStorage 기반 세션 복원 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import { isMockApiEnabled } from './mocks';
import router from './router';
import { useAuthStore } from './stores/auth';
import './styles/main.css';

async function enableMockApi(): Promise<void> {
  if (!isMockApiEnabled()) {
    return;
  }

  const { mockWorker } = await import('./mocks/browser');

  await mockWorker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMockApi().then(async () => {
  const pinia = createPinia();

  // 라우터 가드가 올바른 인증 상태를 참조하도록 마운트 전에 세션을 복원한다
  const authStore = useAuthStore(pinia);
  await authStore.restoreSession();

  createApp(App).use(pinia).use(router).mount('#app');
});
