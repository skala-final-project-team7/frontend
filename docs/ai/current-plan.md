# Frontend Feature Implementation Plan

## Summary

- 목표: LINA Frontend를 Vue 3 + Vite + TypeScript 기반으로 feature 단위 구현한다.
- 기준 문서: `AGENTS.md`, `frontend/AGENTS.md`, `docs/ai/workflow.md`, `docs/conventions.md`, `docs/architecture.md`, `docs/api-spec.md`
- 구현 순서: Chat(SCR-400~600) mock 구현 → Chat 백엔드 연결 → Auth/Login + Role Selection(SCR-100~200 기반, Onboarding 제거) → Settings(SCR-700~720) → Admin(SCR-800~830)
- 원칙: 한 세션에서는 하나의 feature만 구현하고, feature 완료 후 `docs/ai/working-log.md`에 기록한 뒤 다음 feature는 새 세션 또는 `/clear` 이후 진행한다.

## Feature Execution Rule

- feature는 `feature1`부터 순서대로 하나씩만 진행한다.
- 각 feature 시작 전 해당 feature의 요구사항, 수정 범위, 수정 금지 범위, 테스트 케이스를 먼저 요약한다.
- 테스트 코드를 먼저 작성하고 실패를 확인한 뒤 최소 구현을 진행한다.
- 현재 feature 범위를 넘어서는 파일이나 동작은 수정하지 않는다.
- Public API, 인증/인가 흐름, DB Schema 변경이 필요하면 구현 전에 관련 문서를 먼저 수정한다.
- 주요 TypeScript/Vue 모듈에는 `docs/conventions.md`의 표준 주석 블록을 작성한다.
- 화면/컴포넌트 구현 시 `frontend/docs/components.md`, `frontend/docs/frames/`, `frontend/docs/design-reference.css`, `docs/api-spec.md` 순서로 확인한다.
- 완료된 항목은 이 문서에서 체크 처리하고, 작업 결과는 `docs/ai/working-log.md`에 기록한다.

## Per-Feature Completion Flow

1. `docs/ai/current-plan.md`에서 현재 feature 요구사항을 읽고 구현 범위 요약
2. 현재 feature의 Acceptance Criteria와 테스트 케이스 목록 작성
3. 테스트 코드 먼저 작성
4. 테스트 실패 확인
5. 최소한의 코드 변경으로 현재 feature 구현
6. 테스트 통과 확인
7. `./scripts/test.sh` 실행
8. `./scripts/lint.sh` 실행
9. `./scripts/format.sh` 실행
10. `git diff`로 변경 범위 확인
11. 완료 항목을 `docs/ai/current-plan.md`에서 체크 처리
12. `docs/ai/working-log.md`에 변경 파일, 실행 명령, 테스트 결과, 남은 이슈 기록
13. commit 생성

# feature1: 프로젝트 초기 설정

[x] `package.json` 생성 및 Vue 3, Vite, TypeScript 기반 scripts 구성
[x] Pinia, Vue Router, Tailwind CSS, Vitest, Vue Test Utils, MSW 의존성 구성
[x] Vite, TypeScript, Tailwind, PostCSS, ESLint, Prettier 설정 파일 생성
[x] `src/main.ts`, `src/App.vue`, `src/styles/main.css` 전역 스타일 진입점 구성
[x] `src/main.ts`, `src/vite-env.d.ts`, `vite.config.ts`에 표준 주석 블록 작성

# feature2: 폴더 구조 및 아키텍처 골격

[x] `src/pages`, `src/features`, `src/shared` 3계층 컴포넌트 폴더 생성
[x] `src/api`, `src/types`, `src/mocks`, `src/stores`, `src/composables`, `src/router` 폴더 생성
[x] 컴포넌트가 직접 `fetch`를 호출하지 않도록 API 레이어 경계 정의
[x] 서버 상태는 Pinia, UI 상태는 컴포넌트 또는 composable에서 관리하는 기준 적용
[x] 주요 모듈 상단에 TypeScript 표준 주석 블록 작성

# feature3: 라우팅 및 Chat 페이지 뼈대 구성

[x] Vue Router 기본 설정 생성
[x] 기본 진입 라우트를 Chat 페이지로 연결
[x] Chat 페이지에 Sidebar / ChatMain / MessageInput / ReferencePanel 영역만 배치
[x] SCR-400~600 상세 구현 전용 placeholder 상태를 구분
[x] SCR-400 상세 디자인은 feature8에서 구현하도록 placeholder로 유지

# feature4: 디자인 토큰 및 기본 스타일

[x] `frontend/docs/design-reference.css`의 CSS 변수를 Tailwind theme token으로 등록
[x] 임의 색상 사용 없이 `primary`, `bg`, `status`, `overlay` 계열 토큰으로 스타일 기준 구성
[x] 기본 layout, typography, button, panel에 사용할 최소 CSS/Tailwind 기준 작성
[x] 기존 `frontend/assets` 이미지를 참조할 수 있는 import 경로 확인

# feature5: API 타입 및 클라이언트 골격

[x] `docs/api-spec.md` 기준 Common Response wrapper 타입 정의
[x] Conversation, Message, Source, Feedback, SSE event 타입 정의
[x] `src/api/client.ts` fetch wrapper 생성
[x] conversations/messages/chat API 함수 골격 생성
[x] SSE `/api/conversations/{conversationId}/chat`는 wrapper 미적용 이벤트 스트림으로 분리

# feature6: Chat Mock API 기반

[x] `VITE_USE_MOCK=true/false` 환경 토글 기준 정의
[x] MSW browser worker와 test server 구성
[x] `/api/conversations` mock handler 생성
[x] `/api/conversations/{conversationId}/messages` mock handler 생성
[x] `/api/conversations/{conversationId}/chat` SSE mock 방식을 구현 가능한 수준으로 준비
[x] `/api/confluence/pages/preview?pageId={pageId}` hover preview mock handler 생성
[x] Chat 메인 화면에서 사용할 Confluence page preview mock data 1~2개 생성
[x] mock handler마다 `TODO(MOCK): {endpoint}` 주석 추가

# feature7: Shared UI 상태 컴포넌트

[x] `BaseSpinner` 생성
[x] `EmptyState` 생성
[x] `BaseButton` 생성
[x] `BaseIconButton` 생성
[x] Error + Retry 상태를 표현할 수 있는 shared 컴포넌트 또는 패턴 생성
[x] 아이콘 전용 버튼에는 `aria-label`을 필수로 적용

# feature8: Chat 기본 화면 구현 (SCR-400)

[x] `frontend/docs/components.md`의 SCR-400 요구사항 확인
[x] `frontend/docs/frames/[SCR-400]main chatbot.png` 기준 레이아웃 구현
[x] Sidebar 닫힘/열림 기본 상태와 SettingsEntry 위치 구현
[x] ChatEmptyState에 ASK LINA, SKP symbol, 환영 문구, mascot, PreviewPageStack 배치
[x] MessageInput 기본 입력/비활성 상태 구현

# feature9: Chat 대화 화면 구현 (SCR-410, SCR-420, SCR-600)

[x] 메시지 목록과 사용자(테두리 존재o)/LINA(테두리 존재x) MessageBubble 시각 구분 구현
[x] enter - 전송 / shift+enter - 사용자 메시지 안에서 '\n' 구현
[x] SSE 청크 누적 표시와 RAG 단계 라벨 placeholder 구현
[x] 답변 하단 출처 버튼 구현
[x] 사용자 메시지 인라인 수정 모드는 feature19에서 backend version/re-generation 계약 확정 후 재개
[x] 사이드바에서 conversation list에 나오는 제목과 conversation 각각 채팅 내용 연결되도록 구현
[x] conversation list 불러올 시, isPinned - 고정된 채팅 정보도 넘어오게 반영(api-spec.md, src/types/api.ts, src/mocks/data.ts 등)
[x] backend message version 목록 및 수정 이후 답변 재생성 계약 협의는 feature19 범위로 이관

# feature10: 출처 패널 구현 (SCR-500, SCR-510)

[x] 출처 버튼 클릭 시 우측 슬라이드 패널 표시
[x] 출처 List item에 Title / Path / 작성자 / 작성일자 표시
[x] List item hover 시 PreviewPageCard 표시 및 카드로 포인터 이동 중 유지, 카드 자체 hover에서만 shadow / URL 액션 / Path 표시
[x] 새 채팅 진입 시 이전 conversation의 출처 패널 닫기
[x] 후속 feature20 실제 그래프 렌더링 전까지 Graph view placeholder와 List/Graph 토글 구현

# feature10.1: 케밥 아이콘 메뉴 컴포넌트 개발

[x] 최근 채팅 리스트 item hover 시 우측에 케밥 아이콘 메뉴 버튼 표시
[x] 최근 채팅 리스트의 케밥 아이콘 클릭 시 고정, 이름 변경, 삭제 메뉴 표시
[x] 채팅 화면 헤더의 케밥 아이콘 클릭 시 동일한 고정, 이름 변경, 삭제 메뉴 표시
[x] 메뉴 열림/닫힘, 외부 클릭 닫힘, ESC 닫힘, 포커스 이동 등 기본 접근성 동작 구현
[x] 고정/이름 변경/삭제 액션은 기존 store action과 API 함수 시그니처를 임의로 변경하지 않고 연결
[x] 삭제 또는 이름 변경처럼 확인/입력이 필요한 동작은 기존 UI 패턴을 우선 확인한 뒤 적용
[x] 최근 채팅 리스트 hover 상태와 메뉴 open 상태가 충돌하지 않도록 회귀 테스트 작성
[x] 채팅 헤더 메뉴와 최근 채팅 리스트 메뉴가 동일 컴포넌트 또는 동일 동작 계약을 공유하도록 구성

# feature10.4: FE/RAG SSE 스트리밍 계약 확인 (feature10.5 이전 선행)

[x] FE가 `POST /api/conversations/{conversationId}/chat`를 일반 JSON API wrapper가 아니라 SSE/streaming fetch로 분리해서 읽는 구조인지 확인
[x] RAG 운영 모드의 여러 `token`과 PoC fallback의 단일 `token`을 구분하지 않고 `token.data.content`를 순서대로 append하는지 확인
[x] append 시 공백 trim, separator 삽입, 재정렬을 하지 않는지 확인
[x] `sources`, `verification`, `meta`, `done`, `error` 이벤트를 각각 처리하는지 확인
[x] `done` 수신 전까지 메시지를 임시 assistant bubble로 표시할지 확정
[x] `error` 수신 시 이미 받은 partial token을 남길지/버릴지 확정
[x] assistant 답변의 thumbs up/down 선택 시 피드백 사유와 comment를 입력하는 모달 표시
[x] 피드백 모달 제출 시 기존 `submitMessageFeedback(messageId, { rating, comment })` API 함수로 전송
[x] 검색어는 trim 후 2~50자만 API 호출하고, 위반 시 사용자 안내 표시
[x] `matchedMessages[].snippet`과 `matchPositions`를 plain text 기반으로 하이라이트 렌더링
[x] 검색 결과 클릭 시 해당 conversation route로 이동
[x] 접힌 사이드바의 채팅 목록 아이콘 클릭 시 마우스 옆 작은 팝오버로 최근 대화 최대 10개 표시

# feature10.5: ChatPage 책임 분리 리팩토링 (feature11 전 선행 고려)

[x] `ChatPage.vue`는 route/page shell 조립 중심으로 남기고 sidebar/header/submission/route sync 책임을 작게 분리
[x] `ChatSidebar` 또는 동등한 feature 컴포넌트로 sidebar 렌더링과 열림/닫힘 UI 상태 분리
[x] `ChatHeader` 또는 동등한 feature 컴포넌트로 empty/conversation header 분기 분리
[x] `useChatSubmission` 또는 동등한 composable로 새 대화 생성, route conversation fallback, SSE submit, 실패 toast 처리 이동
[x] `useChatRouteSync` 또는 동등한 composable로 route watcher, 메시지 이력 로딩, active conversation clear 처리 이동
[x] Public API, SSE 이벤트 계약, store action signature는 변경하지 않고 기존 feature8/feature9 테스트가 그대로 통과해야 함
[x] 리팩토링 후 `ChatPage.vue` 변경 범위가 UI 동작 변경이 아닌 책임 분리임을 `docs/ai/working-log.md`에 기록

# feature11: Chat 백엔드 연결 전환

> 보류 사유: 2026-06-04 기준 Chat BFF 실제 응답, SSE, feedback API 연결 검증 환경이 아직 준비되지 않아 feature11은 backend readiness 이후 진행한다. 그동안 백엔드 의존이 낮은 feature12 Auth / Login + Role Selection 화면 및 라우팅 mock 범위를 선행 진행한다.

[ ] `docs/api-spec.md`와 실제 BFF 응답을 대조해 `src/types/api.ts` 수정 필요 여부 확인
[ ] `VITE_USE_MOCK=false` 환경에서 `/api/conversations` 대화 목록 조회 연결
[ ] `VITE_USE_MOCK=false` 환경에서 `/api/conversations/{conversationId}/messages` 메시지 이력 조회 연결
[ ] `VITE_USE_MOCK=false` 환경에서 `/api/conversations/{conversationId}/chat` SSE 스트리밍 연결
[ ] 일반 API 조회/생성 실패를 사용자 안내와 재시도 가능한 error state로 연결
[ ] SSE 연결 실패, stream 중단, backend error 이벤트를 구분해 assistant 오류 표시와 재시도 동작 구현
[ ] 사용자 취소(`AbortError`)는 오류 안내에서 제외하고 정상 중단으로 처리
[ ] API/SSE 실패 유형별 UI 및 store 회귀 테스트 작성
[ ] assistant `ThumbsUp` / `ThumbsDown`을 feedback API와 연결하고 실제 assistant `messageId` 기준 전송 처리
[ ] feedback 버튼의 노출/선택/loading/실패 상태와 request 회귀 테스트 구현
[ ] Chat 화면의 Loading / Error / Empty / Success 상태가 실제 API 실패와 빈 응답에서도 동작하는지 확인
[ ] 답변과 검색 결과의 출처 / 작성일자 / 작성자 표시가 실제 응답에서도 유지되는지 확인
[ ] 실제 API 전환 후 불필요한 `TODO(MOCK)` 마커 제거 또는 후속 mock 유지 사유 기록

#### 전환 체크리스트 (Chat 백엔드 연결시)

- [ ] `src/types/api.ts`가 실제 API 응답과 일치하는가
- [ ] `VITE_USE_MOCK=false`로 변경 시 Chat 화면이 정상 동작하는가
- [ ] `TODO(MOCK)` 마커가 모두 제거되었거나 mock 유지 사유가 기록되었는가
- [ ] SSE 스트리밍이 mock과 실제 응답 모두에서 동일하게 처리되는가
- [ ] 인증 전 임시 토큰/하드코딩이 필요한 경우 `.env` 또는 secret을 커밋하지 않았는가
- [ ] 백엔드 응답 구조가 `docs/api-spec.md`와 다르면 API 명세를 먼저 갱신했는가

# feature11.5: Chat 스트리밍 중단 backend 처리 고려

[ ] stop 버튼의 FE `AbortController` SSE 중단 이후 BFF/RAG downstream 작업 취소 전파 필요 여부 확인
[ ] 사용자 중단 시 partial assistant 응답 저장/폐기와 대화 이력 복원 정책을 backend와 합의
[ ] 별도 cancel API가 필요한 구조로 결정된 경우에만 `docs/api-spec.md` 갱신 후 구현 범위 확정
[ ] stop icon 노출과 사용자 중단 기능은 별도 cancel API 또는 backend 취소 전파 정책이 확정된 뒤 후속 구현한다

# feature12: Auth / Login + Role Selection 화면 구현 (SCR-100~200 기반, SCR-300~310 제거)

[ ] `frontend/docs/components.md`의 기존 Phase 2가 Onboarding(SCR-300~310)을 포함하더라도, 이번 흐름에서는 Onboarding 화면을 구현하지 않고 라우팅 대상에서도 제외한다
[ ] LandingPage(SCR-100)는 유지하되 `Continue with Confluence` CTA가 LoginPage 또는 역할 선택 진입으로 자연스럽게 이어지도록 화면 흐름만 정리
[ ] LoginPage(SCR-200)에 `Continue with Confluence` CTA를 배치하고, 클릭 후 사용자/관리자 선택 UI를 표시한다
[ ] `Continue with Confluence` CTA는 즉시 OAuth를 시작하지 않고 역할 선택 UI를 여는 진입점으로 둔다
[ ] 역할 선택 UI에는 일반 사용자와 관리자 버튼을 명확히 구분해 제공한다
[ ] 일반 사용자 선택 시 사용자 로그인 모드로 진행하고, 인증 완료 후 현재 구현된 Chat 화면(`/chat`)으로 이동하는 흐름을 준비한다
[ ] 관리자 선택 시 관리자 로그인 모드로 진행하고, 인증 완료 후 Admin 화면(`/admin`)으로 이동하는 흐름을 준비한다
[ ] 일반 사용자 선택은 향후 `GET /api/auth/login?returnTo=/chat` 호출로 연결될 수 있게 mock 또는 placeholder 경계로 처리한다
[ ] 관리자 선택은 향후 `GET /api/auth/login?mode=admin&returnTo=/admin` 호출로 연결될 수 있게 mock 또는 placeholder 경계로 처리한다
[ ] 사용자가 선택한 역할은 클라이언트 표시/라우팅 의도일 뿐이며, 최종 권한 판단은 `GET /api/users/me`의 `role` 및 BFF의 `mode=admin` 검증 결과를 따른다

**주의사항**
[ ] feature12에서는 accessToken/refreshToken 저장, refresh, logout 실제 처리를 구현하지 않고 feature13 인증 백엔드 연결 범위로 남긴다
[ ] feature12 mock 흐름에서도 `docs/api-spec.md`의 Bearer token 기반 세션 계약과 충돌하는 cookie 기반 인증 가정을 추가하지 않는다
[ ] Onboarding 관련 route/page/component/test가 이미 존재하면 제거 또는 비활성화하고, 새 흐름 회귀 테스트로 대체한다
[ ] 인증 API가 불명확한 항목은 mock 또는 placeholder로 격리하되, `docs/api-spec.md`의 `/api/auth/login?mode=admin` 계약과 충돌하지 않게 둔다

# feature13: Auth 백엔드 연결 전환

[ ] `docs/api-spec.md`의 인증 API 예정 항목과 실제 BFF 인증 흐름 대조
[ ] 일반 사용자 선택 시 `GET /api/auth/login`으로 Confluence OAuth 시작 endpoint 연결
[ ] 관리자 선택 시 `GET /api/auth/login?mode=admin`으로 Confluence OAuth 시작 endpoint 연결
[ ] OAuth callback 이후 사용자 상태 복원 방식 확인
[ ] OAuth callback 성공 후 `GET /api/users/me`를 호출해 사용자 이름/프로필/`role` 표시 데이터 흐름 연결
[ ] `role === "USER"`이면 Chat 화면(`/chat`)으로 이동하고, `role === "ADMIN"`이면 선택한 흐름에 맞춰 Admin 화면(`/admin`) 또는 Chat 화면 진입 정책을 확정해 적용
[ ] 관리자 선택 흐름에서 BFF가 `users.role != ADMIN`을 `403 FORBIDDEN`으로 거부하면 로그인 화면에 권한 부족 안내를 표시하고 토큰을 저장하지 않음
[ ] 일반 사용자 세션으로 `/admin` 접근 시 `403 FORBIDDEN` 또는 `role !== "ADMIN"`을 기준으로 접근 차단 처리
[ ] 인증 실패 / 세션 만료 / 로그아웃 상태 처리
[ ] 인증/인가 흐름 변경 시 관련 문서 갱신

# feature14: Settings 모달 구현 (SCR-700~720)

[ ] Settings 중앙 모달 shell 구현
[ ] 일반 / 계정 / 데이터 탭 구현
[ ] ESC / 백드롭 / X 닫기와 포커스 트랩 구현
[ ] 일반 설정의 히스토리 관리 UI 구현
[ ] 계정 관리와 데이터 관리 UI 구현

# feature15: Admin 기본 shell 및 데이터 수집 메인 보드 구현 (SCR-800)

[ ] `frontend/docs/frames/[SCR-800] 관리자 데이터 수집 메인 보드.pdf` 기준으로 Admin shell, 좌측 nav, 관리자 프로필 영역, 데이터 파이프라인 영역을 구현
[ ] `/admin` 또는 `/admin/operations` route를 추가하고 기본 진입 시 SCR-800 화면을 표시
[ ] 데이터 현황 카드에 `GET /api/admin/data` 응답 필드(`totalSpaces`, `totalPages`, `totalAttachments`, `vectorDbSize`, `totalChunks`, `lastSyncAt`)를 매핑
[ ] 최근 동기화 이력에는 `GET /api/admin/sync` 응답의 `status`, `updatedPages`, `deletedPages`, `duration`, `completedAt`을 매핑
[ ] 데이터 수집/싱크 버튼은 `POST /api/admin/ingest` 계약을 확인한 뒤 연결하고, 연결 전에는 mock/placeholder 상태로 분리
[ ] 관리자 API는 모두 Common Response wrapper를 사용하고, `/api/admin/*`의 Loading / Error / Empty 상태를 처리
[ ] `role !== "ADMIN"` 접근 차단 회귀 테스트와 관리자 shell 렌더링 테스트 작성

# feature16: Admin 대시보드 구현 (SCR-810)

[ ] `frontend/docs/frames/[SCR-810] 관리자 추이 확인 대시보드.pdf` 기준으로 대시보드 화면을 구현
[ ] `/admin/dashboard` route를 추가하고 Admin shell nav에서 이동 가능하게 구성
[ ] `GET /api/admin/stats`의 일간 질의 수, 평균 응답 시간, 전체 대화 수, 시간대별 접속 추이를 표시
[ ] `GET /api/admin/users`의 전체/일일 활성 사용자 수와 사용자별 스페이스/페이지/첨부 수, 대화 수, 마지막 접속 정보를 표시
[ ] 기간 탭(오늘/7일/30일)은 `docs/api-spec.md`의 공통 query parameter 확정 상태를 확인한 뒤 연결하고, 미확정이면 UI 상태만 mock으로 격리
[ ] 사용자 목록 pagination과 empty/error 상태 테스트 작성

# feature17: Admin 피드백 확인 구현 (SCR-820)

[ ] `frontend/docs/frames/[SCR-820] 관리자 피드백 확인.pdf` 기준으로 피드백 화면을 구현
[ ] `/admin/feedback` route를 추가하고 Admin shell nav에서 이동 가능하게 구성
[ ] `GET /api/admin/feedback`의 `likeCount`, `dislikeCount`, `positiveRatio`, `trend`, `negativeFeedbacks`를 표시
[ ] 부정 피드백 원문에는 질문, 답변, comment, createdAt을 표시하되 민감 정보가 노출되지 않도록 API 응답 범위만 렌더링
[ ] 기간 탭(7일/14일/30일)은 query parameter 확정 상태를 확인한 뒤 연결하고, 미확정이면 mock으로 격리
[ ] 피드백 목록 pagination, empty/error 상태 테스트 작성

# feature18: Admin 동기화 이력 구현 (SCR-830)

[ ] `frontend/docs/frames/[SCR-830] 관리자 동기화 이력 확인.pdf` 기준으로 전체 동기화 이력 화면을 구현
[ ] `/admin/sync` route를 추가하고 Admin shell nav에서 이동 가능하게 구성
[ ] `GET /api/admin/sync`의 `syncHistory`를 상태, 업데이트 수, 삭제 수, 소요 시간, 완료 시각 테이블로 표시
[ ] 실패 상태를 완료 상태와 시각적으로 구분하되 임의 status 값을 만들지 않고 API enum을 따른다
[ ] pagination, loading, empty, error 상태 테스트 작성

# feature19: Chat 후속 기능 - 인라인 수정 backend 연결

[ ] feature11 완료 후 message version/답변 재생성 API 계약을 확정하고 `docs/api-spec.md` 및 FE 타입을 갱신
[ ] 사용자 메시지 inline edit와 version navigation을 backend version 응답 기준으로 활성화
[ ] 수정 version 전환 핵심 플로우 테스트 작성

# feature20: 출처 패널 그래프 뷰 후속 구현

[ ] feature10 출처 패널 및 List/Graph 토글 기본 UI 구현 완료 후 진행
[ ] backend 또는 RAG와 출처 graph node/edge 데이터 계약 확정
[ ] 계약 확정 시 `docs/api-spec.md`를 먼저 갱신하고 graph response 타입과 mock 데이터를 반영
[ ] ReferencePanel Graph view에서 source 관계를 실제 node/edge 그래프로 렌더링
[ ] 그래프 node 클릭 시 선택 강조와 해당 Confluence 문서 미리보기 연결
[ ] 그래프 줌/팬 및 viewport 내 초기 framing 동작 구현
[ ] source 목록과 graph 선택 상태가 동일 문서를 기준으로 동기화되도록 처리
[ ] 그래프 loading/error/empty 상태와 접근성 대체 표시를 구현
[ ] 그래프 렌더링 및 node 선택/줌/팬 동작을 관련 테스트로 검증

# feature21: 테스트 및 검증 기반 확장

[ ] App 기본 렌더링 테스트 작성
[ ] Chat shell Empty 상태 테스트 작성
[ ] API client wrapper 성공/실패 처리 테스트 작성
[ ] mock conversation list 응답 테스트 작성
[ ] 핵심 플로우 검색어 입력 → 결과 표시 → 출처 클릭 테스트 작성
[ ] 루트 검증 명령 `./scripts/format.sh`, `./scripts/lint.sh`, `./scripts/test.sh`, `./scripts/verify.sh`와 호환 확인

## 공통 완료 체크리스트

- [ ] feature별 작업 결과를 `docs/ai/working-log.md`에 기록
- [ ] API 변경 시 `docs/api-spec.md` 수정 여부 확인
- [ ] DB 변경이 없음을 확인하고 `docs/db-schema.md` 미수정 유지
- [ ] 아키텍처 변경 시 `docs/architecture.md` 수정 여부 확인
- [ ] 불필요한 로그, 임시 코드, 사용하지 않는 TODO 제거
- [ ] 최종 `git diff` 기준 요청 범위 외 변경이 없는지 확인
- [ ] commit 생성 전 `./scripts/test.sh`, `./scripts/lint.sh`, `./scripts/format.sh` 실행 결과 기록

## Files To Modify

- `docs/ai/current-plan.md`
- `docs/ai/working-log.md`
- `package.json`, `package-lock.json`
- Vite / TypeScript / Tailwind / PostCSS / ESLint / Prettier 설정 파일
- `src/**`

## Files Not To Modify Without Explicit Need

- `docs/api-spec.md`
- `docs/db-schema.md`
- `docs/architecture.md`
- `docs/conventions.md`
- `frontend/docs/**`
- `frontend/assets/**`
- `mock-data/**`
- Backend, RAG Pipeline, DB 관련 파일

## Test Plan

- feature 단위 테스트 우선 작성
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `./scripts/test.sh`
- `./scripts/lint.sh`
- `./scripts/format.sh`
- `./scripts/verify.sh`

## Acceptance Criteria

- feature별 범위가 `current-plan.md`와 `working-log.md`에 일치하게 기록된다.
- 한 세션에서 하나의 feature만 구현한다.
- Chat 화면은 mock 데이터 기반으로 먼저 동작하고, 실제 API 전환 시 컴포넌트 변경을 최소화한다.
- 답변과 검색 결과에는 항상 출처 / 작성일자 / 작성자를 표시한다.
- 모든 비동기 화면은 Loading / Error / Empty 상태를 처리한다.
- API 응답 타입은 `docs/api-spec.md`와 일치하며 임의 추정하지 않는다.
- Onboarding(SCR-300~310)은 새 로그인 흐름에서 제거되고, 로그인 후 역할 선택을 거쳐 사용자(Chat) 또는 관리자(Admin) 화면으로 진입한다.
- 관리자 화면은 `frontend/docs/frames/`의 SCR-800~830 PDF와 `docs/api-spec.md`의 `/api/admin/*` 계약을 기준으로 구현한다.

## Assumptions

- `frontend/docs/components.md`의 Phase 2에는 아직 Onboarding 문구가 남아 있지만, 최신 사용자 요청 기준으로 SCR-300~310은 구현 대상에서 제외한다.
- API/DB/인증 문서는 실제 변경이 필요한 feature에서만 수정한다.
- 관리자 API의 query parameter 중 `period`, `from`, `to`, `page`, `size`는 `docs/api-spec.md`에서 제안 상태이므로 실제 연결 전 BFF 계약을 재확인한다.
