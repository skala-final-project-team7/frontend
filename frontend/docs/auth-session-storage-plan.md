# Auth Token Storage Plan

## 목적

- Frontend 인증 구현 시 사용할 토큰 저장 전략을 확정한다.
- `docs/api-spec.md` §4 인증 계약과 정합한 FE 저장소 구조를 정리한다.
- `HttpOnly cookie`를 사용하지 않는 전제를 기준으로 `localStorage(영속) + Pinia(앱 상태)` 역할 분리 방식을 문서화한다.

## POC 범위 (현재 구현 대상)

- 이번 POC에서는 **`accessToken`만 저장**한다.
- **`refreshToken`은 이번 범위에서 제외**한다 (재발급/rotating 흐름 미구현).
- 따라서 access token 만료 시 자동 갱신은 하지 않고, **재로그인**으로 처리한다.
- `expiresAt`도 이번 POC 저장 대상에서 제외한다 (만료는 서버 `401` 응답으로 감지).
- refresh 기반 세션 복원, rotating refresh 반영은 **후속 작업**으로 남긴다 (문서 하단 "후속 확장" 참조).

## 전제

- 이 프로젝트는 `HttpOnly cookie` 기반 세션을 사용하지 않는다.
- 인증 성공 후 서버는 FE에 세션 토큰을 응답 body로 전달한다.
  - POC: `accessToken`
  - (후속) `refreshToken`, `expiresAt`
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

- `accessToken` 을 `localStorage` 에 저장
- `/api/users/me` 호출로 사용자 상태(Pinia) 복원
- `role` 기준 라우팅
  - `USER` -> `/chat`
  - `ADMIN` -> `/admin`

## 저장 전략 결정

### 핵심 원칙: 토큰은 localStorage 단일 소스, Pinia 는 앱 상태만 — 토큰을 Pinia 에 미러링하지 않는다

- **`accessToken` 은 `localStorage` 에만 저장한다 (단일 진실 소스).**
- **`apiRequest` 는 매 요청 시 `localStorage` 에서 토큰을 직접 읽어** `Authorization: Bearer` 헤더에 붙인다.
- **Pinia 는 토큰을 보관하지 않는다.** 대신 `currentUser`, `isAuthenticated` 같은 **앱 인증 상태**만 반응형으로 관리한다.
- 토큰을 Pinia 에 복제(hydrate)하지 않으므로, **두 저장소를 동기화할 필요가 없다**(드리프트 버그 원천 차단).

```text
[localStorage] accessToken ──(매 요청 시 직접 read)──▶ [apiRequest] Authorization 헤더

[Pinia store] currentUser / isAuthenticated  ◀──(부팅 시 /api/users/me 결과로 채움)
```

### 토큰을 Pinia 에 미러링하지 않는 이유

- 컴포넌트·라우터 가드가 반응형으로 구독하는 대상은 **토큰 문자열이 아니라** "로그인 여부(`isAuthenticated`)"·"사용자(`currentUser`)" 다.
- 토큰이 실제로 필요한 곳은 `apiRequest` 헤더뿐이고, 거기서 `localStorage.getItem` 으로 동기 read 하면 충분하다(성능 부담 없음).
- 토큰을 두 곳에 두면 로그인/로그아웃 시마다 동기화 코드가 늘고, 한쪽만 갱신되는 드리프트 위험이 생긴다.

### 저장 위치 정리 (POC)

| 값                   | localStorage | Pinia |
| -------------------- | :----------: | :---: |
| `accessToken`        | ✅ 단일 소스 | ❌    |
| `currentUser`        | ❌           | ✅ (`/api/users/me` 로 조회) |
| `isAuthenticated`    | ❌           | ✅ (`currentUser` 존재로 파생) |
| `isRestoringSession` | ❌           | ✅    |
| `refreshToken`       | ❌ (POC 제외) | ❌    |
| `expiresAt`          | ❌ (POC 제외) | ❌    |

### storage 종류

- `localStorage` 사용.

이유:

- 새로고침 후에도 세션을 복원해야 한다.
- 탭 종료 후 다시 브라우저를 열어도 로그인 유지가 가능해야 한다.
- POC에서는 refresh token이 없으므로, **`accessToken` 자체가 세션 복원의 기준점**이 된다.

### `currentUser` 를 영속하지 않는 이유

- 사용자 정보는 토큰만 유효하면 `/api/users/me` 로 언제든 다시 받아올 수 있다.
- 권한(`role`)은 항상 서버 응답을 신뢰해야 하므로, 클라이언트 영속본을 만들지 않는다.

## 앱 부팅 플로우 (POC)

```text
앱 시작
  -> localStorage 에서 accessToken 확인
  -> accessToken 이 있으면
      - GET /api/users/me 호출 (토큰은 apiRequest 가 localStorage 에서 직접 첨부)
          -> 성공:
             - Pinia 에 currentUser 세팅, isAuthenticated = true
             - role 기준 라우팅 (USER -> /chat, ADMIN -> /admin)
          -> 실패(401 등):
             - localStorage 의 accessToken 제거 + Pinia 정리
             - /login 이동
  -> accessToken 이 없으면
      - /login 이동
```

> 부팅 시 "토큰을 Pinia로 hydrate" 하는 단계는 없다. 그냥 **토큰 유무를 확인하고 `/api/users/me` 로 검증**하여 사용자 상태만 채운다.
> 후속(refresh 도입) 시에는 "401 -> refresh -> 재요청" 단계가 위 흐름에 추가된다. POC에서는 refresh 없이 곧바로 로그아웃 처리한다.

## Pinia 에 둘 값 (토큰 제외)

- `isAuthenticated` (`currentUser` 존재로 파생 가능)
- `currentUser`
- `isRestoringSession`
- 필요 시 `loginIntent` 또는 `lastAuthError`

원칙:

- Pinia는 앱 반응형 인증 상태에만 집중한다.
- 토큰의 저장·참조 책임은 localStorage(저장) + apiRequest(참조)가 가진다.

## localStorage 에 둘 값 (POC)

- `accessToken`

선택(후속):

- `refreshToken`, `expiresAt`
- 필요 시 `lastLoginAt` 또는 세션 버전 필드 추가 가능

## 상태 전이 방식

로그인 성공(`callback` 응답) 시:

- 응답의 `accessToken` -> `localStorage` 저장
- `/api/users/me` 호출 -> Pinia `currentUser`, `isAuthenticated` 갱신

로그아웃 시:

- `localStorage` 의 `accessToken` 제거
- Pinia 상태 초기화 (`currentUser`, `isAuthenticated`)

`401` 응답 시 (POC):

- refresh 흐름이 없으므로 `localStorage` 토큰 제거 + Pinia 정리 후 `/login` 이동

## 보안 메모

- `localStorage` 에 `accessToken` 을 두면 XSS 발생 시 탈취될 수 있다.
- 이 구조를 선택하는 대신 XSS 방어를 강하게 가져가야 한다.

필수 대응:

- 사용자 입력을 HTML로 직접 렌더링하지 않기
- `v-html` / `innerHTML` 사용 시 sanitize 적용
- Confluence preview 같은 외부 HTML 렌더링 경로 점검
- CSP 적용 검토
- access token TTL을 짧게 유지 (POC에서는 만료 시 재로그인)

## 구현 원칙

- FE는 access token을 직접 Bearer 헤더에 붙인다 — `apiRequest` 가 매 요청 시 localStorage에서 토큰을 읽어 첨부한다.
- access token의 저장 위치는 localStorage **한 곳**이며, Pinia에는 토큰을 두지 않는다.
- 앱 부팅 시 localStorage에 토큰이 있으면 `/api/users/me` 로 검증하여 사용자 상태를 복원한다.
- 복원/요청 실패(`401`) 시 즉시 localStorage 토큰을 제거하고 Pinia를 비운 뒤 로그인 화면으로 보낸다.
- 관리자 권한은 최종적으로 `/api/users/me` 의 `role` 값으로 판단한다.

## feature13 구현 체크리스트 (POC)

- auth Pinia store 추가 (`currentUser`, `isAuthenticated`, `isRestoringSession` — 토큰 제외)
- callback 성공 응답의 `accessToken` -> localStorage 저장
- 앱 시작 시 localStorage 토큰 확인 -> `/api/users/me` 로 세션 복원
- `apiRequest` 에서 localStorage 토큰을 직접 읽어 Authorization 헤더 주입
- `401` 발생 시 localStorage 토큰 제거 + Pinia 정리 + `/login` 이동 (refresh 미구현)
- logout 시 localStorage 토큰 제거 + Pinia 정리
- `/api/users/me` 결과 기준 `USER` / `ADMIN` 라우팅 구현

## 후속 확장 (POC 이후)

- `refreshToken` / `expiresAt` 도입
- 앱 부팅 및 `401` 시 `POST /api/auth/refresh` 기반 access token 재발급
- rotating refresh 반영: 새 `accessToken` / `refreshToken` / `expiresAt` 를 localStorage에 덮어쓰기
- access token 만료 사전 감지(`expiresAt`)로 선제적 갱신

## 결론

- `HttpOnly cookie`는 이번 범위에서 사용하지 않는다.
- 저장 전략은 `localStorage(토큰 단일 소스) + Pinia(앱 인증 상태)` 역할 분리로 정리한다.
- **POC에서는 `accessToken` 하나만** 다루며, **localStorage에만 저장**한다. **토큰을 Pinia에 미러링하지 않는다.**
- `apiRequest` 가 매 요청 시 localStorage 토큰을 직접 읽어 Bearer 헤더에 붙인다.
- `refreshToken` / `expiresAt` 및 refresh 기반 복원은 후속 작업으로 분리한다.
- 새로고침 시에는 localStorage의 access token을 `/api/users/me` 로 검증해 세션을 복원하고, 실패하면 재로그인한다.
