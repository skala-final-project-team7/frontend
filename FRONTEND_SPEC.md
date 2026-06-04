# Frontend Definition

이 문서는 LINA Frontend의 역할, 구조, 상태 관리, API 연동, 테스트 및 검증 기준을 정의한다.

기준 API 문서:

- `docs/api-spec.md` v2.3.0

## 1. 목적

LINA Frontend는 사용자가 사내 문서를 자연어로 질의하고, RAG 기반 답변과 출처를 확인할 수 있는 채팅 UI를 제공한다.

주요 목적은 다음과 같다.

- 채팅 기반 질의 입력과 답변 표시
- SSE 기반 실시간 답변 스트리밍 표시
- 답변 출처 목록 및 Confluence 페이지 미리보기 표시
- 대화 목록, 대화 선택, 고정, 이름 변경, 삭제 UI 제공
- 답변 피드백 제출 UI 제공
- 인증, 온보딩, 설정, 관리자 화면 확장을 위한 Vue 3 기반 구조 유지

## 2. 기술 스택

- Framework: Vue 3
- Build Tool: Vite
- Language: TypeScript
- Router: Vue Router
- State Management: Pinia
- Styling: Tailwind CSS + project design token
- Test: Vitest, Vue Test Utils
- Mock API: MSW

## 3. 화면 범위

현재 프론트엔드는 `docs/ai/current-plan.md`의 feature 계획에 따라 단계적으로 구현한다.

주요 화면은 다음과 같다.

- Chat
  - 빈 채팅 시작 화면
  - 대화 메시지 화면
  - 메시지 입력 영역
  - 최근 채팅 / 고정 채팅 사이드바
  - 출처 패널
- Auth / Onboarding
  - Landing
  - Login
  - OAuth callback
  - Onboarding
  - Onboarding Done
- Settings
  - 일반 설정
  - 계정 설정
  - 데이터 관리
- Admin Dashboard
  - 서비스 통계
  - 사용자 현황
  - 데이터 현황
  - 피드백 현황
  - 동기화 이력

## 4. 폴더 구조

프론트엔드는 `src` 아래에서 역할별로 분리한다.

```text
src/
  api/          API client와 endpoint 함수
  composables/  재사용 가능한 Vue composition 함수
  features/     도메인 기능 컴포넌트
  mocks/        MSW mock handler와 mock data
  pages/        route 단위 page shell
  router/       Vue Router 설정
  shared/       공통 UI와 shared export
  stores/       Pinia store
  styles/       전역 스타일
  types/        API와 도메인 타입
```

기본 원칙은 다음과 같다.

- `pages`는 route/page 조립 중심으로 둔다.
- 도메인 UI는 `features`에 둔다.
- 여러 기능에서 재사용하는 UI는 `shared`에 둔다.
- 네트워크 호출은 `api`에 둔다.
- 서버 상태와 공유 상태는 `stores`에 둔다.

## 5. API 연동 정의

### 5.1 공통 응답

일반 JSON API는 `docs/api-spec.md`의 Common Response wrapper를 따른다.

성공 응답:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "요청 성공",
  "data": {}
}
```

에러 응답:

```json
{
  "isSuccess": false,
  "code": 404,
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "해당 리소스를 찾을 수 없습니다"
}
```

프론트엔드는 일반 JSON API를 `src/api/client.ts`의 `apiRequest()`로 호출하고 wrapper 내부 `data`를 반환받는다. 컴포넌트에서 직접 `fetch`를 호출하지 않는다.

### 5.2 Enum과 timestamp

- 메시지 `role`: `user` / `assistant`
- 사용자 `role`: `USER` / `ADMIN`
- 피드백 `rating`: `LIKE` / `DISLIKE`
- 검증 결과 `verificationResult`: `SUPPORTED` / `PARTIALLY_SUPPORTED` / `NOT_SUPPORTED`
- SSE `status.phase`: `connecting`, `acl_filtering`, `searching`, `answering`, `streaming`, `verifying`, `formatting`
- 응답 timestamp는 KST ISO-8601 문자열을 사용한다. 예: `2026-05-06T19:00:00+09:00`

## 6. Chat API 정의

### 6.1 대화 관리

프론트엔드가 사용하는 대화 API는 다음과 같다.

- `POST /api/conversations`: 새 대화 생성
- `GET /api/conversations?page=&size=`: 대화 목록 조회
- `GET /api/conversations/{conversationId}/messages`: 대화 메시지 이력 조회
- `PATCH /api/conversations/{conversationId}`: 제목 변경 또는 고정 토글
- `DELETE /api/conversations/{conversationId}`: 대화 삭제

대화 목록은 `isPinned` 우선, `lastMessageAt` 최신순으로 정렬된 응답을 사용한다.

`messageCount`는 API spec v2.3.0에서 제거되었으므로 프론트엔드 계약에 포함하지 않는다.

### 6.2 채팅 SSE

채팅 답변 스트리밍 API는 Common Response wrapper를 적용하지 않는다.

```text
POST /api/conversations/{conversationId}/chat
```

Request body:

```json
{ "question": "지난번 S3 버킷 권한 오류 때 어떻게 해결했어?" }
```

프론트엔드는 `Accept: text/event-stream`으로 요청하고 `src/api/client.ts`의 `streamChatRequest()`와 `src/composables/useSSE.ts`를 통해 처리한다.

SSE 이벤트는 다음 7종을 정본으로 사용한다.

- `status`: RAG 처리 단계 표시
- `token`: assistant 답변 content에 수신 순서대로 append
- `sources`: 답변 출처 목록 반영
- `verification`: 답변 검증 결과 반영
- `meta`: 현재는 `title`만 대화 제목 표시 override에 사용
- `done`: 정상 종료, backend assistant `messageId`로 placeholder ID 교체
- `error`: 오류 종료, partial token을 버리고 오류 메시지 표시

SSE 처리 규칙:

- `token.data.content`는 trim, separator 삽입, 재정렬 없이 그대로 append한다.
- 정상 흐름은 `done`으로 종료한다.
- 오류 흐름은 `error`로 종료하며 `error`에는 `messageId`가 없다.
- `done`과 `error`는 상호 배타이며 스트림은 둘 중 하나로 한 번만 종료된다.
- 알 수 없는 event type은 전방 호환을 위해 무시한다.
- 알 수 없는 `status.phase`는 직전 상태를 유지한다.
- 검색 결과가 0건이면 `answering`, `streaming`, `verifying` phase가 생략될 수 있다.
- 0건에서도 `sources`는 빈 배열로 1회 올 수 있고 `verification`은 생략될 수 있다.
- 재연결은 지원하지 않는다. `Last-Event-ID` 기반 재개를 기대하지 않는다.
- 장시간 처리 중에는 backend가 `status` 또는 keep-alive 주석으로 연결을 유지할 수 있다.

### 6.3 임시 assistant bubble

사용자가 질문을 보내면 `done` 수신 전에도 assistant bubble을 먼저 표시한다.

동작 흐름:

1. 사용자 질문을 local user message로 추가한다.
2. `msg-local-assistant-*` 형태의 local assistant placeholder를 추가한다.
3. `status` 이벤트는 placeholder의 phase/status message에 반영한다.
4. `token` 이벤트는 placeholder의 content에 순서대로 append한다.
5. `sources`, `verification`, `meta` 이벤트를 같은 placeholder 상태에 반영한다.
6. `done` 이벤트가 오면 placeholder의 `messageId`를 backend가 반환한 실제 message ID로 교체한다.
7. `error` 이벤트가 오면 partial token을 버리고 오류 메시지로 content를 덮어쓴다.

## 7. 검색 API 정의

현재 API spec v2.3.0에는 프론트엔드가 직접 호출하는 별도 검색 endpoint가 없다.

정의되지 않은 endpoint 예:

```text
GET /api/search
POST /api/search
GET /api/documents/search
GET /api/confluence/pages/search
```

사용자 자연어 검색/질의는 `POST /api/conversations/{conversationId}/chat` SSE API로 수행한다.

검색 결과 문서는 별도 search response가 아니라 SSE `sources` 이벤트로 전달된다. 문서 본문 미리보기는 `GET /api/confluence/pages/preview?pageId=...`를 사용한다.

문서 검색창, 출처만 검색, Confluence 페이지 자동완성 같은 기능이 필요하면 `docs/api-spec.md`에 FE-facing 검색 API를 먼저 추가해야 한다.

## 8. 피드백 API 정의

답변 피드백은 아래 API를 사용한다.

```text
POST /api/messages/{messageId}/feedback
```

Request body:

```json
{
  "rating": "LIKE",
  "comment": "정확한 답변이었어요"
}
```

`rating`은 `LIKE` 또는 `DISLIKE`만 허용한다. `comment`는 선택 값이다.

피드백은 실제 assistant `messageId` 기준으로 전송한다. `done` 전 local placeholder ID로 피드백을 전송하지 않는다.

## 9. Confluence Preview API 정의

출처 hover preview와 Chat 메인 추천 문서 preview는 아래 API를 사용한다.

```text
GET /api/confluence/pages/preview?pageId={pageId}
```

처리 기준:

- `pageId`는 Confluence page ID다.
- preview API는 인증 및 서버 보관 OAuth token에 의존한다.
- BFF는 Confluence OAuth token을 프론트엔드에 노출하지 않는다.
- 응답의 `bodyViewValue`는 프론트엔드에서 DOMPurify로 sanitize한 뒤 렌더링한다.
- 원본 열기 동작은 `pageUrl`을 새 탭으로 연다.

## 10. 인증 API 정의

인증은 Confluence OAuth 2.0에 위임한다.

FE-facing 인증 API:

- `GET /api/auth/login`: Confluence OAuth 로그인 리다이렉트
- `GET /api/auth/callback`: OAuth callback 처리, access/refresh token 발급
- `POST /api/auth/refresh`: refresh token 기반 세션 갱신
- `POST /api/auth/logout`: 로그아웃
- `GET /api/users/me`: 현재 로그인 사용자 정보 조회

인증 정책:

- 인증된 요청은 `Authorization: Bearer {accessToken}` 헤더를 사용한다.
- 로그인/갱신 응답의 `accessToken`, `refreshToken`, `expiresAt`은 FE-facing 계약이다.
- Confluence OAuth access/refresh token은 FE에 노출하지 않고 서버에만 보관한다.
- Refresh Token 저장·회전·전달 정책은 3단계에서 최종 확정되는 항목이다.
- 중간 발표 데모 범위에서는 인증이 비활성화될 수 있으므로 feature13 전까지 mock 또는 placeholder로 격리한다.

## 11. 관리자 API 정의

관리자 화면은 `/api/admin/*` API를 사용한다.

관리자 API:

- `GET /api/admin/stats`: 일간 질의 수, 평균 응답 시간, 시간대별 접속 추이
- `GET /api/admin/users`: 사용자 현황
- `GET /api/admin/data`: 데이터 현황
- `GET /api/admin/feedback`: 피드백 집계와 부정 피드백 원문
- `GET /api/admin/sync`: 동기화 이력
- `POST /api/admin/ingest`: 수집 트리거
- `GET /api/admin/ingest/status/{jobId}`: 수집 상태 조회

권한:

- `/api/admin/*`는 `ADMIN` 전용이다.
- 미인증은 `401` / `UNAUTHORIZED`.
- 일반 사용자 접근은 `403` / `FORBIDDEN`.
- 모든 관리자 API는 Common Response wrapper를 적용한다.

관리자 API의 query parameter와 response shape은 `docs/api-spec.md`를 따른다. 아직 구현 feature가 아닌 항목은 placeholder UI와 mock을 실제 계약과 분리해 관리한다.

## 12. 상태 관리 정의

Pinia store는 여러 컴포넌트가 공유해야 하는 브라우저 메모리 상태를 관리한다.

현재 Chat 상태는 `src/stores/chat.ts`에서 관리한다.

주요 상태:

- `activeConversationId`: 현재 선택된 대화 ID
- `messagesByConversationId`: 대화별 메시지 배열
- `conversationTitlesById`: SSE meta title 기반 대화 제목 표시 override
- `isStreaming`: 현재 SSE 답변 스트리밍 여부
- `streamingMessageId`: 현재 스트리밍 중인 assistant message ID
- `streamingPhase`: 현재 스트리밍 phase

Pinia store는 backend DB가 아니다. 브라우저 탭 안의 JS 메모리에 있는 임시 상태이며, 새로고침하면 기본적으로 초기화된다.

## 13. UI 정의

UI는 기존 디자인 문서를 우선한다.

- `frontend/docs/components.md`
- `frontend/docs/frames/`
- `frontend/docs/design-reference.css`
- `tailwind.config.js`
- `src/styles/main.css`

컴포넌트 기준:

- 아이콘 버튼은 `aria-label`을 제공한다.
- 공통 버튼, spinner, empty state, error retry 상태는 `src/shared` 기준을 따른다.
- Chat 도메인 컴포넌트는 `src/features/chat`에 둔다.
- page shell과 route sync 책임은 `src/pages`에서 담당하되, 기능이 커지면 feature 컴포넌트나 composable로 분리한다.
- 임의 색상보다 project token을 우선 사용한다.

## 14. Mock 정의

Mock API는 MSW를 사용한다.

관련 위치:

- `src/mocks/browser.ts`
- `src/mocks/server.ts`
- `src/mocks/handlers.ts`
- `src/mocks/data.ts`

`VITE_USE_MOCK=true`일 때 mock API를 사용한다.

Mock handler에는 실제 endpoint와 연결되는 `TODO(MOCK): {endpoint}` 주석을 유지한다. 실제 backend 전환 시 제거하거나 유지 사유를 기록한다.

Mock response도 `docs/api-spec.md`의 최신 field name, enum casing, timestamp 정책을 따라야 한다.

## 15. 테스트 정의

테스트는 Vitest와 Vue Test Utils를 사용한다.

테스트 원칙:

- 구현 전 테스트 케이스를 먼저 정리한다.
- 기능 구현은 실패 테스트를 먼저 작성한 뒤 진행한다.
- API contract, SSE parser, store action, UI interaction은 회귀 테스트로 보호한다.
- 버그 수정은 재현 테스트를 먼저 작성한다.
- 테스트를 삭제해서 통과시키지 않는다.

주요 테스트 위치:

```text
src/__tests__/
```

## 16. 검증 명령

작업 완료 전 아래 명령을 실행한다.

```bash
./scripts/format.sh
./scripts/lint.sh
./scripts/test.sh
./scripts/verify.sh
```

일부 명령이 실패하면 실패 원인과 해결 여부를 작업 결과에 기록한다.

## 17. 문서 기록 기준

작업 완료 시 다음을 반영한다.

- 완료된 feature 항목은 `docs/ai/current-plan.md`에서 체크 처리한다.
- 변경 파일, 실행 명령, 테스트 결과, 남은 이슈는 `docs/ai/working-log.md`에 기록한다.
- API 변경 시 `docs/api-spec.md`를 수정한다.
- DB 변경과 관련된 작업이면 `docs/db-schema.md` 수정 여부를 확인한다.
- 아키텍처 변경 시 `docs/architecture.md`를 수정한다.

## 18. 금지 사항

- 요청하지 않은 대규모 리팩토링
- 담당 범위를 벗어난 파일 수정
- 컴포넌트에서 직접 `fetch` 호출
- Public API 또는 함수 시그니처 임의 변경
- 인증/인가 흐름 임의 변경
- Secret, Token, Credential, `.env` 생성 또는 커밋
- 임시 코드, 디버깅 로그, 불필요한 TODO 방치
- 테스트 실패 상태를 완료로 보고

