/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend 개발 브라우저 환경용 MSW worker 구성.
 *           VITE_USE_MOCK=true일 때 API 요청을 mock handler로 가로챈다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature6 구현, browser worker 구성 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x, MSW 2.7.x 기준
 * --------------------------------------------------
 */
import { mockHandlers } from './handlers';
import type { SetupWorker, StartOptions } from 'msw/browser';

let activeWorker: SetupWorker | undefined;

async function getWorker(): Promise<SetupWorker> {
  if (!activeWorker) {
    const { setupWorker } = await import('msw/browser');

    activeWorker = setupWorker(...mockHandlers);
  }

  return activeWorker;
}

export const mockWorker = {
  async start(options?: StartOptions): ReturnType<SetupWorker['start']> {
    const worker = await getWorker();

    return worker.start(options);
  },
  stop(): void {
    activeWorker?.stop();
  },
};
