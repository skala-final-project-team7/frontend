/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend Vite 개발/빌드/테스트 설정.
 *           Vue 플러그인, @ alias, Vitest jsdom 환경을 구성한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, 최초 작성, Vue/Vitest/Vite 기본 설정 추가
 *   - 2026-06-15, feature13 검증, /api proxy → mock-backend(:8090) 추가 (VITE_USE_MOCK=false 시 사용)
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x, Vitest 2.1.x 기준
 * --------------------------------------------------
 */
import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  server: {
    allowedHosts: ['host.docker.internal'],
    // VITE_USE_MOCK=false 시 /api/* 요청을 mock-backend proxy 서버(:8090)로 전달한다.
    // VITE_USE_MOCK=true(기본값)일 때는 MSW가 브라우저 서비스 워커에서 먼저 가로채므로 이 설정은 무시된다.
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
