/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend mock API 환경 토글과 MSW handler 진입점 정의.
 *           VITE_USE_MOCK 값에 따라 개발 환경 mock API 사용 여부를 결정한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature6 구현, mock API 환경 토글과 handler export 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x, MSW 2.7.x 기준
 * --------------------------------------------------
 */
type MockEnvironment = {
  VITE_USE_MOCK?: string;
};

/**
 * VITE_USE_MOCK 환경 토글이 명시적으로 true일 때만 mock API를 활성화한다.
 *
 * @param environment Vite import.meta.env 호환 객체
 * @returns mock API 활성화 여부
 */
export function isMockApiEnabled(environment: MockEnvironment = import.meta.env): boolean {
  return environment.VITE_USE_MOCK === 'true';
}

export { mockHandlers } from './handlers';
