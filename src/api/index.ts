/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend API 호출 레이어의 경계 규칙 정의.
 *           컴포넌트와 store가 네트워크 호출 세부 구현에 직접 의존하지 않도록 기준을 제공한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature2 구현, API 레이어 경계 상수 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
export const API_LAYER_BOUNDARY = {
  allowedNetworkLayer: 'src/api',
  directFetchAllowedOutsideApi: false,
} as const;
