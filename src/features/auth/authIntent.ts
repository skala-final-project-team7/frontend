/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Auth 화면의 역할 선택별 로그인 의도와 향후 OAuth 진입 URL을 정의한다.
 *           feature12에서는 실제 인증 호출 없이 mock 라우팅 경계만 제공한다.
 * 작성일 : 2026-06-05
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-06-05, feature12 구현, 사용자/관리자 로그인 의도 URL 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vue Router 4.5.x 기준
 * --------------------------------------------------
 */
export type AuthRoleIntent = 'user' | 'admin';

export interface AuthIntentOption {
  role: AuthRoleIntent;
  label: string;
  description: string;
  authUrl: string;
  returnTo: '/chat' | '/admin';
}

// feature12 경계: 역할 선택 후 브라우저를 BFF OAuth 시작 엔드포인트로 이동시키는 것까지만 구현한다.
// 미구현: Confluence callback 처리, LINA JWT 저장, 서버가 확인한 최종 USER/ADMIN 권한 반영은 feature13 이후에 연결한다.
export const AUTH_LOGIN_URL_BY_ROLE: Record<AuthRoleIntent, string> = {
  user: '/api/auth/login',
  admin: '/api/auth/login?mode=admin',
};

export const AUTH_INTENT_OPTIONS: AuthIntentOption[] = [
  {
    role: 'user',
    label: '일반 사용자',
    description: 'Confluence 지식 검색과 답변 확인을 위해 Chat 화면으로 이동합니다.',
    authUrl: AUTH_LOGIN_URL_BY_ROLE.user,
    returnTo: '/chat',
  },
  {
    role: 'admin',
    label: '관리자',
    description: '조직 데이터 수집과 동기화 관리를 위해 Admin 화면으로 이동합니다.',
    authUrl: AUTH_LOGIN_URL_BY_ROLE.admin,
    returnTo: '/admin',
  },
];
