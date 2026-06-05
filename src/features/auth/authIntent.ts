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

// feature12 경계: 실제 /api/auth/login 호출과 토큰 저장은 feature13에서 연결한다.
// 현재 값은 역할 버튼에 예정 OAuth URL을 노출하고 mock 라우팅 의도를 검증하기 위한 계약이다.
export const AUTH_LOGIN_URL_BY_ROLE: Record<AuthRoleIntent, string> = {
  user: '/api/auth/login?returnTo=/chat',
  admin: '/api/auth/login?mode=admin&returnTo=/admin',
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
