# Auth Token Storage Plan

## 목적

- Frontend 인증 구현 시 사용할 토큰 저장 전략을 확정한다.
- `docs/api-spec.md` §4 인증 계약과 정합한 FE 저장소 구조를 정리한다.
- `HttpOnly cookie`를 사용하지 않는 전제를 기준으로 `Pinia + storage` 혼합 방식을 문서화한다.

## 전제

- 이 프로젝트는 `HttpOnly cookie` 기반 세션을 사용하지 않는다.
- 인증 성공 후 서버는 FE에 아래 값을 응답 body로 전달한다.
  - `accessToken`
  - `refreshToken`
  - `expiresAt`
- 이후 FE는 API 요청마다 `Authorization: Bearer {accessToken}` 헤더를 직접 붙여야 한다.
- 따라서 토큰을 FE가 보관하는 것은 선택이 아니라 필수다.

## 로그인 흐름 요약

### 1. `GET /api/auth/login`

- 로그인 시작 엔드포인트
- FE가 이 URL로 이동하면 BFF가 Confluence OAuth 페이지로 `302 Redirect`
- 관리자 로그인 의도는 `mode=admin`으로 전달

### 2. `GET /api/auth/callback`

- 로그인 완료 처리 엔드포인트
- 서버가 `code`, `state`를 검증하고 세션 토큰을 발급
- `mode=admin`이면 실제 사용자 권한이 `ADMIN`인지 확인

### 3. 로그인 성공 후 FE 책임

- 토큰 저장
- `/api/users/me` 호출로 사용자 상태 복원
- `role` 기준 라우팅
  - `USER` -> `/chat`
  - `ADMIN` -> `/admin`

## 저장 전략 결정

### 저장 위치

- `accessToken` -> `Pinia` 메모리 상태
- `refreshToken` -> 브라우저 `storage`
- `expiresAt` -> 브라우저 `storage`

### storage 종류

- 기본안: `localStorage`

이유:

- 새로고침 후에도 세션을 복원해야 한다.
- 탭 종료 후 다시 브라우저를 열어도 로그인 유지가 가능해야 한다.
- `refreshToken`의 역할이 세션 복원 기준점이기 때문이다.
- `api-spec`상 refresh token은 rotating 방식이므로, 새 토큰을 받을 때마다 storage 값을 교체하면 된다.

## 왜 이렇게 나누는가

### `accessToken`을 Pinia에 두는 이유

- access token은 수명이 짧다.
- access token을 영속 저장하지 않으면 노출 시간이 줄어든다.
- 페이지 새로고침 시에는 storage에 있는 refresh token으로 새 access token을 재발급받아 메모리에 다시 채우면 된다.

### `refreshToken`을 storage에 두는 이유

- access token만 메모리에 두면 새로고침 후 로그인이 끊긴다.
- 세션 복원을 위해서는 영속 저장소가 필요하다.
- refresh token이 그 역할을 맡는다.

## 앱 부팅 플로우

```text
앱 시작
  -> localStorage에서 refreshToken / expiresAt 확인
  -> refreshToken이 있으면 POST /api/auth/refresh 호출
      -> 성공:
         - 새 accessToken을 Pinia에 저장
         - 새 refreshToken, expiresAt을 localStorage에 덮어쓰기
         - /api/users/me 호출
      -> 실패(401 등):
         - localStorage 정리
         - /login 이동
  -> refreshToken이 없으면
      - /login 이동
```

## Pinia에 둘 값

- `accessToken`
- `isAuthenticated`
- `currentUser`
- `isRestoringSession`
- 필요 시 `loginIntent` 또는 `lastAuthError`

주의:

- `refreshToken` 원본은 Pinia의 주 저장 위치로 두지 않는다.
- Pinia는 앱 반응형 상태와 현재 메모리 세션 관리에 집중한다.

## storage에 둘 값

- `refreshToken`
- `expiresAt`

선택:

- 필요 시 `lastLoginAt` 또는 세션 버전 필드 추가 가능
- `accessToken`은 storage에 넣지 않는 것을 기본 원칙으로 한다

## rotating refresh 반영 방식

`/api/auth/refresh` 성공 시:

- 응답의 새 `accessToken` -> Pinia 갱신
- 응답의 새 `refreshToken` -> `localStorage` 덮어쓰기
- 응답의 새 `expiresAt` -> `localStorage` 덮어쓰기

이전 refresh token은 더 이상 신뢰하지 않는다.

## 보안 메모

- `localStorage`에 `refreshToken`을 두면 XSS 발생 시 탈취될 수 있다.
- 이 구조를 선택하는 대신 XSS 방어를 강하게 가져가야 한다.

필수 대응:

- 사용자 입력을 HTML로 직접 렌더링하지 않기
- `v-html` / `innerHTML` 사용 시 sanitize 적용
- Confluence preview 같은 외부 HTML 렌더링 경로 점검
- CSP 적용 검토
- access token TTL을 짧게 유지

## 구현 원칙

- FE는 access token을 직접 Bearer 헤더에 붙인다.
- refresh token은 세션 복원용으로만 사용한다.
- 앱 부팅 시 refresh 기반 세션 복원을 먼저 시도한다.
- 복원 실패 시 즉시 storage를 비우고 로그인 화면으로 보낸다.
- 관리자 권한은 최종적으로 `/api/users/me`의 `role` 값으로 판단한다.

## feature13 구현 체크리스트

- auth Pinia store 추가
- callback 성공 응답 저장 로직 구현
- 앱 시작 시 refresh 기반 세션 복원 구현
- `apiRequest` Authorization 헤더 주입 구현
- `401` 발생 시 refresh -> 재요청 또는 로그아웃 처리
- logout 시 Pinia + storage 동시 정리
- `/api/users/me` 결과 기준 `USER` / `ADMIN` 라우팅 구현

## 결론

- `HttpOnly cookie`는 이번 범위에서 사용하지 않는다.
- 저장 전략은 `Pinia + localStorage` 혼합 방식으로 정리한다.
- `accessToken`은 Pinia 메모리 상태에 둔다.
- `refreshToken`과 `expiresAt`은 `localStorage`에 둔다.
- 새로고침 시에는 refresh token으로 access token을 재발급받아 세션을 복원한다.
