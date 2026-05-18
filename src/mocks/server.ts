/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend 테스트 환경용 MSW server 구성.
 *           Vitest에서 Chat mock API handler 동작을 검증한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature6 구현, Node test server 구성 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x, MSW 2.7.x 기준
 * --------------------------------------------------
 */
import { setupServer } from 'msw/node';

import { mockHandlers } from './handlers';

export const mockServer = setupServer(...mockHandlers);
