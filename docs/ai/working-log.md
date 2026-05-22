# Frontend Working Log

이 문서는 `docs/ai/current-plan.md`의 feature 단위 작업 결과를 기록한다.

## Log Template

```md
## YYYY-MM-DD - featureN: feature title

### Scope

-

### Test Cases

-

### Changed Files

-

### Commands

-

### Results

-

### Notes / Remaining Issues

-
```

## 2026-05-15 - feature1: 프로젝트 초기 설정

### Scope

- Vue 3 + Vite + TypeScript 기반 frontend 앱 초기 설정
- `package.json` 스크립트와 의존성 구성
- Vite, TypeScript, Tailwind CSS, PostCSS, ESLint, Prettier 기본 설정 추가
- `src/main.ts`, `src/App.vue`, 전역 스타일 진입점 구성

### Test Cases

- Vue app 기본 진입점이 컴파일되는지 확인
- TypeScript 설정이 Vue SFC와 Vite 설정을 타입 체크할 수 있는지 확인
- production build가 Vite 기본 target에서 성공하는지 확인
- 루트 검증 스크립트가 root frontend app을 대상으로 실행되는지 확인

### Changed Files

- `package.json`, `package-lock.json`: frontend 의존성 및 npm scripts 구성
- `index.html`, `vite.config.ts`: Vite 앱 진입점과 alias/test 설정
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript project reference 설정
- `tailwind.config.js`, `postcss.config.js`, `src/styles/main.css`: Tailwind 기본 설정과 전역 스타일 연결
- `.eslintrc.cjs`, `.prettierrc.json`, `.prettierignore`, `.gitignore`: lint/format/git ignore 설정
- `src/main.ts`, `src/App.vue`, `src/vite-env.d.ts`: Vue 앱 부팅 진입점

### Commands

- `npm install`
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run build`

### Results

- `npm run typecheck`: passed
- `npm run lint`: passed
- `npm test`: passed, no test files found with `--passWithNoTests`
- `./scripts/verify.sh`: passed
- `npm run build`: passed

### Notes / Remaining Issues

- `npm install` 결과 5개 moderate vulnerability가 보고되었으나, `npm audit fix --force`는 breaking change 가능성이 있어 실행하지 않음.
- API, DB, 인증/인가 문서는 변경하지 않음.
- feature2 이후 구조/컴포넌트 작업은 별도 feature 로그에서 기록한다.

## 2026-05-18 - feature2: 폴더 구조 및 아키텍처 골격

### Scope

- `src/pages`, `src/features`, `src/shared` 3계층 컴포넌트 폴더 골격 생성
- `src/api`, `src/types`, `src/mocks`, `src/stores`, `src/composables`, `src/router` 폴더 골격 생성
- 컴포넌트가 직접 `fetch`를 호출하지 않고 `src/api`를 경유하도록 API 레이어 경계 상수 정의
- 서버 상태는 Pinia, UI 상태는 컴포넌트 또는 composable에서 관리한다는 기준 상수 정의
- 주요 TypeScript 모듈 상단에 표준 주석 블록 작성

### Test Cases

- feature2 필수 폴더가 존재한다.
- API 레이어 경계가 `src/api`로 문서화되고, 외부 직접 fetch 허용이 false이다.
- 서버 상태 소유자는 Pinia, UI 상태 소유자는 component 또는 composable로 문서화된다.
- 주요 TypeScript 모듈에 표준 주석 블록 항목이 포함된다.

### Changed Files

- `src/__tests__/feature2.architecture.test.ts`: feature2 구조 및 경계 검증 테스트 추가
- `src/api/index.ts`: API 레이어 경계 기준 추가
- `src/stores/index.ts`: 서버 상태 관리 기준 추가
- `src/composables/index.ts`: UI 상태 관리 기준 추가
- `src/types/api.ts`: feature5 타입 구체화를 위한 API 타입 모듈 골격 추가
- `src/pages/index.ts`, `src/features/index.ts`, `src/shared/index.ts`, `src/mocks/index.ts`, `src/router/index.ts`: feature2 필수 폴더 추적용 진입 파일 추가
- `docs/ai/current-plan.md`: feature2 완료 체크 처리
- `docs/ai/working-log.md`: feature2 작업 로그 기록

### Commands

- `npm test -- src/__tests__/feature2.architecture.test.ts` 실패 확인
- `npm test -- src/__tests__/feature2.architecture.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- `npm test -- src/__tests__/feature2.architecture.test.ts` 최초 실행: failed, `@/api` 모듈 없음으로 실패 확인
- `npm test -- src/__tests__/feature2.architecture.test.ts`: passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed
- `./scripts/verify.sh`: passed

### Notes / Remaining Issues

- API 상세 타입, 실제 fetch wrapper, mock handler, Vue Router 설정은 feature5, feature6, feature3 범위로 남김.
- API, DB, 인증/인가 문서는 변경하지 않음.

## 2026-05-18 - feature3: 라우팅 및 Chat 페이지 뼈대 구성

### Scope

- Vue Router 기본 설정 생성
- 루트(`/`) 진입 라우트를 Chat 페이지로 연결
- Chat 페이지에 Sidebar / ChatMain / MessageInput / ReferencePanel 영역만 배치
- SCR-400~600 상세 구현 전 placeholder 상태 구분
- SCR-400 상세 디자인은 feature8 범위로 유지

### Test Cases

- 루트 라우트(`/`)의 이름이 `chat`이고 Chat 페이지 컴포넌트에 연결된다.
- App의 RouterView가 루트 경로에서 Chat 페이지를 렌더링한다.
- Chat 페이지가 Sidebar / ChatMain / MessageInput / ReferencePanel placeholder 영역만 노출한다.
- SCR-400 상세 디자인이 feature8 범위임을 placeholder 문구로 구분한다.

### Changed Files

- `src/__tests__/feature3.routing-chat-shell.test.ts`: feature3 라우팅 및 Chat shell 테스트 추가
- `src/router/index.ts`: Vue Router 인스턴스와 루트 Chat 라우트 추가
- `src/main.ts`: 앱 부팅 시 router plugin 연결
- `src/App.vue`: RouterView 기반 렌더링으로 변경
- `src/pages/ChatPage.vue`: Chat shell placeholder 영역 추가
- `src/pages/index.ts`: ChatPage export 추가
- `docs/ai/current-plan.md`: feature3 완료 체크 처리
- `docs/ai/working-log.md`: feature3 작업 로그 기록

### Commands

- `npm test -- src/__tests__/feature3.routing-chat-shell.test.ts` 실패 확인
- `npm test -- src/__tests__/feature3.routing-chat-shell.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- `npm test -- src/__tests__/feature3.routing-chat-shell.test.ts` 최초 실행: failed, `@/pages/ChatPage.vue` 모듈 없음으로 실패 확인
- `npm test -- src/__tests__/feature3.routing-chat-shell.test.ts`: passed, 3 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 2 test files and 7 tests passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: passed

### Notes / Remaining Issues

- Chat 상세 디자인, 실제 메시지 입력 동작, ReferencePanel 상호작용은 feature8 이후 범위로 남김.
- API, DB, 인증/인가 문서는 변경하지 않음.

## 2026-05-18 - feature4: Pretendard 전역 폰트 적용

### Scope

- Vite 루트 `index.html`에 Pretendard Variable Dynamic Subset CDN stylesheet 추가
- Tailwind 기본 `font-sans`를 Pretendard 폰트 스택으로 설정
- 전역 CSS의 기본 font-family를 Tailwind `fontFamily.sans`와 연결

### Test Cases

- 전역 스타일 설정 파일이 정상 포맷팅된다.
- 기존 lint/test/verify 검증이 통과한다.

### Changed Files

- `index.html`: Pretendard CDN link 추가
- `tailwind.config.js`: `fontFamily.sans` 확장
- `src/styles/main.css`: 전역 font-family를 Tailwind theme 기반으로 변경
- `docs/ai/working-log.md`: 작업 로그 추가

### Commands

- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 2 test files and 7 tests passed
- `./scripts/verify.sh`: passed

### Notes / Remaining Issues

- API, DB, 인증/인가 문서는 변경하지 않음.

## 2026-05-18 - feature4: 디자인 토큰 및 기본 스타일

### Scope

- `frontend/docs/design-reference.css`의 주요 색상, typography, radius, spacing CSS 변수를 Tailwind theme token으로 등록
- `primary`, `bg`, `status`, `overlay` 계열 색상 토큰 기준을 전역 스타일과 Chat shell placeholder에 적용
- 기본 layout, typography, button, panel용 최소 CSS/Tailwind utility contract 추가
- `frontend/assets` 이미지 파일을 Vite import로 참조할 수 있는 경로 모듈 추가

### Test Cases

- Tailwind config에 design-reference 기반 theme token이 등록된다.
- 전역 CSS에 layout, typography, button, panel 기준 클래스가 정의된다.
- Chat shell placeholder가 Tailwind 기본 팔레트 또는 임의 hex class 대신 프로젝트 토큰을 사용한다.
- 기존 `frontend/assets` 이미지가 import 가능한 URL로 export된다.

### Changed Files

- `src/__tests__/feature4.design-tokens.test.ts`: feature4 실패 우선 테스트 추가
- `tailwind.config.js`: design token 기반 color, fontSize, radius, spacing, shadow, blur theme 확장
- `src/styles/main.css`: CSS 변수와 `.lina-*` 기본 스타일 contract 추가
- `src/pages/ChatPage.vue`: feature3 placeholder 스타일을 프로젝트 토큰 기반으로 교체
- `src/shared/assets.ts`: `frontend/assets` 이미지 import URL export 추가
- `src/vite-env.d.ts`: Tailwind config 테스트 import 타입 선언 추가
- `docs/ai/current-plan.md`: feature4 완료 체크 처리
- `docs/ai/working-log.md`: feature4 작업 로그 기록

### Commands

- `npm test -- --run src/__tests__/feature4.design-tokens.test.ts` 실패 확인
- `npm test -- --run src/__tests__/feature4.design-tokens.test.ts`
- `npm test`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run build`

### Results

- `npm test -- --run src/__tests__/feature4.design-tokens.test.ts` 최초 실행: failed, `@/shared/assets` 모듈 없음으로 실패 확인
- `npm test -- --run src/__tests__/feature4.design-tokens.test.ts`: passed, 4 tests passed
- `npm test`: passed, 3 test files and 11 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 3 test files and 11 tests passed
- `./scripts/verify.sh`: passed
- `npm run build`: passed

### Notes / Remaining Issues

- feature5 이후 항목은 수정하지 않음.
- API, DB, 인증/인가 문서는 변경하지 않음.

## 2026-05-18 - feature5: API 타입 및 클라이언트 골격

### Scope

- `docs/api-spec.md` 기준 Common Response wrapper 타입 정의
- Conversation, Message, Source, Feedback, SSE event 타입 정의
- Common Response wrapper를 처리하는 `src/api/client.ts` fetch wrapper 추가
- conversations/messages/chat/feedback API 함수 골격 추가
- SSE `/api/conversations/{conversationId}/chat` 호출을 wrapper 미적용 이벤트 스트림 요청으로 분리

### Test Cases

- Common Response 성공/실패 타입과 Chat 도메인 타입이 API 명세 shape와 호환된다.
- 대화 생성, 대화 목록 조회, 메시지 이력 조회 함수가 Common Response의 `data`를 반환한다.
- 대화 제목 수정, 대화 삭제, 메시지 피드백 등록 함수가 명세의 method/path/body로 요청한다.
- SSE chat 함수는 `Accept: text/event-stream`으로 요청하고 Common Response wrapper를 파싱하지 않는다.

### Changed Files

- `src/__tests__/feature5.api-client.test.ts`: feature5 실패 우선 테스트 추가
- `src/types/api.ts`: Common Response, Chat 도메인, feedback, SSE event 타입 추가
- `src/api/client.ts`: JSON API fetch wrapper와 SSE stream request 함수 추가
- `src/api/index.ts`: conversations/messages/chat/feedback API 함수 export 추가
- `docs/ai/current-plan.md`: feature5 완료 체크 처리
- `docs/ai/working-log.md`: feature5 작업 로그 기록

### Commands

- `npm test -- src/__tests__/feature5.api-client.test.ts` 실패 확인
- `npm test -- src/__tests__/feature5.api-client.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npm test -- src/__tests__/feature5.api-client.test.ts` 최초 실행: failed, API 함수 미구현으로 실패 확인
- `npm test -- src/__tests__/feature5.api-client.test.ts`: passed, 4 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: initially failed due to unused test mock parameters, fixed by typing the fetch mock; final run passed
- `./scripts/test.sh`: passed, 4 test files and 15 tests passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: initially failed due to test mock call tuple narrowing, fixed in test code; final run passed

### Notes / Remaining Issues

- feature6 이후 항목은 수정하지 않음.
- API 명세, DB, 인증/인가 문서는 변경하지 않음.

## 2026-05-18 - feature6: Chat Mock API 기반

### Scope

- `VITE_USE_MOCK=true`일 때만 mock API를 활성화하는 환경 토글 기준 정의
- MSW shared handler, browser worker, Node test server 구성
- `/api/conversations` mock handler 생성
- `/api/conversations/{conversationId}/messages` mock handler 생성
- `/api/conversations/{conversationId}/chat` SSE mock 응답 준비
- `/api/confluence/pages/preview?page_id={pageId}` hover preview mock handler 생성
- Chat 메인 화면에서 사용할 Confluence page preview mock data 1~2개 추가
- `docs/api-spec.md`에 Confluence 페이지 미리보기 API 계약 추가
- `src/types/api.ts`와 API 레이어에 Confluence page preview 타입/함수 추가
- Confluence page preview 응답에 문서 경로 표시용 `breadcrumbs` 필드 추가
- mock handler마다 `TODO(MOCK): {endpoint}` 마커 추가

### Test Cases

- `VITE_USE_MOCK=true`만 mock API 활성화로 판정한다.
- MSW browser worker와 Node test server가 shared handler 기반으로 구성된다.
- `GET /api/conversations`가 Common Response wrapper 형태의 mock 대화 목록을 반환한다.
- `GET /api/conversations/{conversationId}/messages`가 user/assistant 메시지 이력을 반환한다.
- `POST /api/conversations/{conversationId}/chat`가 `text/event-stream` 형식의 token/sources/verification/done 이벤트를 반환한다.
- `GET /api/confluence/pages/preview?page_id={pageId}`가 Confluence `body.view.value`에 대응하는 HTML preview payload를 반환한다.
- Confluence page preview payload가 `breadcrumbs: string[]`를 포함한다.
- 알 수 없는 `page_id`는 Common Response error와 404 status를 반환한다.
- Chat main preview용 Confluence page seed data가 1~2개 존재한다.
- `getConfluencePagePreview(pageId)`가 `page_id` query로 Common Response wrapper를 호출하고 preview data를 반환한다.
- 각 mock endpoint handler에 `TODO(MOCK)` 마커가 남아 있다.

### Changed Files

- `src/__tests__/feature6.mock-api.test.ts`: feature6 실패 우선 테스트 추가
- `src/__tests__/feature5.api-client.test.ts`: Confluence preview API 타입/함수 테스트 추가
- `docs/api-spec.md`: Confluence page preview 외부 API 명세 추가
- `src/types/api.ts`: `ConfluencePagePreview` 타입 추가
- `src/api/index.ts`: `getConfluencePagePreview` 함수 추가
- `src/mocks/index.ts`: mock 환경 토글과 handler export 추가
- `src/mocks/data.ts`: Chat mock 대화, 메시지, 출처, Confluence preview seed data 추가
- `src/mocks/handlers.ts`: conversations/messages/chat/Confluence preview mock handler 추가
- `src/mocks/browser.ts`: 브라우저용 MSW worker lazy facade 추가
- `src/mocks/server.ts`: Vitest용 MSW server 추가
- `src/main.ts`: `VITE_USE_MOCK=true`일 때만 MSW worker 시작
- `src/vite-env.d.ts`: `VITE_USE_MOCK` 타입 추가
- `public/mockServiceWorker.js`: 브라우저 worker script 추가
- `docs/ai/current-plan.md`: feature6 완료 체크 처리
- `docs/ai/working-log.md`: feature6 작업 로그 기록

### Commands

- `npm test -- src/__tests__/feature6.mock-api.test.ts` 실패 확인
- `npm test -- src/__tests__/feature6.mock-api.test.ts`
- `npm test`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npm test -- src/__tests__/feature6.mock-api.test.ts` 최초 실행: failed, `@/mocks/server` 모듈 없음으로 실패 확인
- hover preview mock 추가 테스트 최초 실행: failed, preview handler와 home preview seed data 미구현으로 실패 확인
- Confluence preview API 타입/함수 테스트 최초 실행: failed, `getConfluencePagePreview` 함수 미구현으로 실패 확인
- `breadcrumbs` 추가 테스트 최초 실행: failed, mock seed data에 `breadcrumbs` 필드가 없어 실패 확인
- `npm test -- src/__tests__/feature6.mock-api.test.ts`: passed, 9 tests passed
- `npm test -- src/__tests__/feature5.api-client.test.ts src/__tests__/feature6.mock-api.test.ts`: passed, 14 tests passed
- `npm test`: passed, 5 test files and 24 tests passed
- `npm run typecheck`: passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: initially failed due to unused `mockHandlers` import in `src/mocks/index.ts`, fixed; final run passed
- `./scripts/test.sh`: passed, 5 test files and 24 tests passed
- `./scripts/verify.sh`: passed

### Notes / Remaining Issues

- feature7 이후 항목은 수정하지 않음.
- API 명세, DB, 인증/인가 문서는 변경하지 않음.

## 2026-05-19 - feature7: Shared UI 상태 컴포넌트

### Scope

- `BaseSpinner`, `EmptyState`, `BaseButton`, `BaseIconButton` 공통 UI 컴포넌트 추가
- `BaseGradientButton` 공통 orange-red gradient CTA 버튼 추가
- 버튼 컴포넌트 상태를 Default / Hover / Active / Focus / Disabled로 구분해 스타일 기준 정의
- Error + Retry 상태를 표현하는 `ErrorRetryState` 컴포넌트 추가
- `ErrorRetryState` 재시도 버튼에 `@lucide/vue`의 `RefreshCw` 아이콘 적용
- 아이콘 전용 버튼의 `aria-label` 필수 prop 적용
- `@lucide/vue` 의존성 추가에 따라 `package.json` / `package-lock.json` 버전을 `0.1.1`로 patch bump
- feature8 이후 화면 구현에는 진입하지 않고 shared 컴포넌트 export까지만 수행

### Test Cases

- `BaseSpinner`는 `role="status"`와 `aria-live="polite"`로 로딩 상태를 노출한다.
- `EmptyState`는 제목, 설명, 선택적 action slot을 렌더링한다.
- `BaseButton`은 native button 기본 type과 variant class를 적용하고 click 이벤트를 emit한다.
- disabled `BaseButton`은 비활성 상태에서 click handler를 호출하지 않는다.
- `BaseGradientButton`은 Figma 기준 compact gradient CTA 스타일과 disabled opacity 정책을 적용한다.
- 버튼 컴포넌트는 Default / Hover / Active / Focus / Disabled 상태별 스타일을 가진다.
- `BaseIconButton`은 `ariaLabel` required prop을 가지고 실제 `aria-label` 속성에 적용한다.
- `ErrorRetryState`는 `role="alert"` 메시지, Lucide retry 아이콘, 재시도 버튼을 렌더링하고 retry 이벤트를 emit한다.

### Changed Files

- `src/__tests__/feature7.shared-ui.test.ts`: feature7 실패 우선 테스트 추가
- `src/shared/ui/BaseSpinner.vue`: 공통 Loading 상태 컴포넌트 추가
- `src/shared/ui/EmptyState.vue`: 공통 Empty 상태 컴포넌트 추가
- `src/shared/ui/BaseButton.vue`: 공통 텍스트 버튼 컴포넌트 추가
- `src/shared/ui/BaseGradientButton.vue`: 공통 gradient CTA 버튼 컴포넌트 추가
- `src/shared/ui/BaseIconButton.vue`: aria-label 필수 아이콘 버튼 컴포넌트 추가
- `tailwind.config.js`: 버튼 Focus 상태용 orange glow shadow token 추가
- `src/shared/ui/ErrorRetryState.vue`: Error + Retry 상태 컴포넌트 추가
- `src/shared/index.ts`: shared UI 컴포넌트 export 추가
- `package.json`, `package-lock.json`: `@lucide/vue` 의존성 추가 및 `0.1.1` patch version 반영
- `frontend/assets/mascot-wrong.png`: EmptyState용 512px 투명 배경 mascot asset 추가
- `frontend/design-token-preview.html`: shared UI 컴포넌트 정적 preview 추가
- `docs/ai/current-plan.md`: feature7 완료 체크 처리
- `docs/ai/working-log.md`: feature7 작업 로그 기록

### Commands

- `npm test -- src/__tests__/feature7.shared-ui.test.ts` 실패 확인
- `npm test -- src/__tests__/feature7.shared-ui.test.ts`
- `npm test`
- `npm run typecheck`
- `npm version patch --no-git-tag-version`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npm test -- src/__tests__/feature7.shared-ui.test.ts` 최초 실행: failed, `@/shared`에 feature7 컴포넌트 export가 없어 mount 대상이 undefined인 상태 확인
- `npm test -- src/__tests__/feature7.shared-ui.test.ts`: passed, 8 tests passed
- `npm test`: passed, 6 test files and 33 tests passed
- `npm run typecheck`: passed
- `npm version patch --no-git-tag-version`: package version `0.1.0` → `0.1.1`
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed
- `./scripts/verify.sh`: passed

### Notes / Remaining Issues

- API, DB, 인증/인가 문서는 변경하지 않음.
- feature8 이후 화면 연결은 다음 feature 범위로 남김.

## 2026-05-20 - feature8: Chat 기본 화면 구현 (SCR-400)

### Scope

- `frontend/docs/components.md`와 `frontend/docs/frames/[SCR-400]main chatbot.png` 기준 SCR-400 요구사항 확인
- Chat shell placeholder를 SCR-400 기본 화면으로 교체
- Sidebar 닫힘/열림 기본 상태와 좌하단 SettingsEntry 배치
- ChatEmptyState에 ASK LINA, SKP symbol, 환영 문구, mascot, PreviewPageStack 2개 배치
- MessageInput의 빈 입력 비활성, 입력 후 전송 가능, 스트리밍 중 비활성/취소 상태 구현
- feature9 이후 대화/출처/후속질문 기능은 구현하지 않음

### Test Cases

- ChatPage는 닫힌 Sidebar, SettingsEntry, 프로필 버튼, Chat main shell을 렌더링한다.
- Sidebar 토글 시 닫힘/열림 상태와 inline 검색/채팅 섹션이 전환된다.
- ChatEmptyState는 ASK LINA, SKP symbol, 사용자 환영 문구, mascot, PreviewPageCard 2개를 렌더링한다.
- MessageInput은 빈 입력에서 Send 버튼을 비활성화하고 입력 후 Enter 전송을 지원한다.
- MessageInput은 Shift+Enter를 전송으로 처리하지 않고, 스트리밍 중 입력/전송 비활성 및 취소 버튼을 제공한다.

### Changed Files

- `src/__tests__/feature8.chat-main.test.ts`: feature8 실패 우선 테스트 추가
- `src/__tests__/feature3.routing-chat-shell.test.ts`: feature8 구현 이후에도 shell 영역 존재를 검증하도록 조정
- `src/features/chat/ChatEmptyState.vue`: SCR-400 빈 상태 브랜딩/문서 미리보기 화면 추가
- `src/features/chat/MessageInput.vue`: 기본 메시지 입력, 비활성, 전송, 취소 상태 추가
- `src/pages/ChatPage.vue`: feature3 placeholder를 SCR-400 기본 화면으로 교체
- `docs/ai/current-plan.md`: feature8 완료 체크 처리
- `docs/ai/working-log.md`: feature8 작업 로그 기록

### Commands

- `npm test -- --run src/__tests__/feature8.chat-main.test.ts src/__tests__/feature3.routing-chat-shell.test.ts` 실패 확인
- `npm test -- --run src/__tests__/feature8.chat-main.test.ts src/__tests__/feature3.routing-chat-shell.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 최초 feature8 테스트 실행: failed, `@/features/chat/ChatEmptyState.vue` 모듈 없음으로 실패 확인
- 구현 직후 feature8 테스트 실행: initially failed, Enter 제출 핸들러 미호출 확인 후 Vue key modifier로 수정
- 관련 테스트 재실행: passed, 2 test files and 8 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 7 test files and 38 tests passed
- `./scripts/verify.sh`: passed

### Notes / Remaining Issues

- API, DB, 인증/인가 문서는 변경하지 않음.
- feature9 이후 항목은 수정하지 않음.

## 2026-05-20 - feature8: SCR-400 화면 보정

### Scope

- SCR-400 기본 화면이 한 화면에 들어오도록 header/sidebar/input/empty state 크기 조정
- `searchImageUrl` 투명도 80% 적용
- Sidebar 토글을 상단 mascot hover 시 toggle icon으로 대체되는 방식으로 변경
- 아이콘 전용 컨트롤에 공통 tooltip wrapper 적용
- PreviewPageCard를 166:191 비율의 재사용 컴포넌트로 분리
- SKP symbol asset의 외곽 여백이 ASK LINA 로고에서 도드라지지 않도록 crop wrapper 적용

### Test Cases

- Sidebar mascot hover 시 mascot opacity가 사라지고 sidebar toggle icon이 표시된다.
- SCR-400 아이콘 전용 컨트롤은 tooltip label을 가진다.
- BaseTooltip은 hover/focus tooltip content를 렌더링한다.
- ChatEmptyState의 검색 이미지에는 80% opacity가 적용된다.
- SKP symbol은 crop wrapper 안에서 렌더링된다.
- PreviewPageCard는 166:191 비율과 문서 메타/본문을 렌더링한다.

### Changed Files

- `src/__tests__/feature8.chat-main.test.ts`: SCR-400 보정 요구사항 테스트 추가
- `src/shared/ui/BaseTooltip.vue`: 공통 tooltip wrapper 추가
- `src/shared/index.ts`: `BaseTooltip` export 추가
- `src/features/chat/PreviewPageCard.vue`: 재사용 가능한 문서 미리보기 카드 추가
- `src/features/chat/ChatEmptyState.vue`: 화면 배율, search opacity, SKP crop, PreviewPageCard 적용
- `src/features/chat/MessageInput.vue`: send icon tooltip 적용
- `src/pages/ChatPage.vue`: mascot hover sidebar toggle, 전체 icon tooltip, 화면 높이 맞춤 조정

### Commands

- `npm test -- --run src/__tests__/feature8.chat-main.test.ts` 실패 확인
- `npm test -- --run src/__tests__/feature8.chat-main.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 최초 보정 테스트 실행: failed, `PreviewPageCard.vue` 모듈 없음으로 실패 확인
- feature8 보정 테스트 재실행: passed, 8 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 7 test files and 41 tests passed
- `./scripts/verify.sh`: passed

### Notes / Remaining Issues

- API, DB, 인증/인가 문서는 변경하지 않음.
- feature9 이후 항목은 수정하지 않음.

## 2026-05-20 - feature8: SCR-400 후속 보정 (Preview hover, Toast, 진입 애니메이션)

### Scope

- "채팅 검색" input 테두리 제거 + readonly 처리, 클릭 시 모달 열기 TODO 핸들러 연결
- "설정 및 도움말" 버튼 폰트/색상을 "새 채팅"과 동일하게 정렬, 사이드바 열린 상태에서 tooltip 비활성화 (component 분기)
- MessageInput 카드에 `focus-within:shadow-focus` 추가하여 textarea focus 시 orange glow 적용
- 프로필 진입 버튼 aria-label "프로필 메뉴 열기" → "계정 관리"로 변경
- 라우터 루트 경로 `/` → `/chat`로 변경
- PreviewPageCard 호버 인터랙션 추가
  - 카드 hover 시 안쪽 inset 그림자 (`shadow-card-press` 신규 토큰)
  - 우측 상단에 URL 복사(Link2) / 외부 열기(ArrowUpRight) 아이콘 노출, BaseTooltip 라벨 부여
  - 하단에 breadcrumbs를 hover 시 노출 (`group-hover:opacity-100`)
  - article wrapper를 도입해 tooltip이 카드 `overflow-hidden` 경계 밖에서 표시되도록 분리
- 공통 Toast 시스템 추가
  - `useToast` composable로 전역 toast 큐 관리
  - `BaseToast` 컴포넌트가 Teleport로 body 상단 중앙에 렌더링, success/error/info variant 지원
  - App.vue에 `BaseToast` 1회 마운트
  - PreviewPageCard 복사 성공/실패 시 toast 노출
- ChatEmptyState section에 mount 진입 애니메이션 (`<Transition appear>`, 500ms ease-out, translate-y-6 → 0)
- `dompurify` 의존성 추가 (PreviewPageCard `bodyViewValue` sanitize 용도)
- `@lucide/vue` 아이콘 추가 import: `Check`, `Info`, `XCircle`, `Link2`, `ArrowUpRight`
- `tailwind.config.js`에 `boxShadow.card-press` 토큰 추가

### Test Cases

- 기존 feature8 회귀 테스트 12개 유지 통과
- profile-entry aria-label 변경 반영 (`프로필 메뉴 열기` → `계정 관리`)
- settings-entry-label 색상 토큰 변경 (`text-overlay-dark-40` → `text-overlay-dark-80`)

### Changed Files

- `src/App.vue`: BaseToast 글로벌 마운트
- `src/composables/useToast.ts`: 전역 toast composable 신규 추가
- `src/shared/ui/BaseToast.vue`: 공통 toast 컴포넌트 신규 추가
- `src/shared/index.ts`: `BaseToast` export 추가
- `src/features/chat/PreviewPageCard.vue`: wrapper 분리, hover 액션, breadcrumbs, toast 연결
- `src/features/chat/ChatEmptyState.vue`: mount 진입 transition wrapper 추가
- `src/features/chat/MessageInput.vue`: `focus-within:shadow-focus` 적용
- `src/pages/ChatPage.vue`: 채팅 검색 input 테두리 제거, 설정 항목 스타일 정합, profile aria-label 변경
- `src/router/index.ts`: 루트 라우트 경로 `/chat`로 변경
- `src/__tests__/feature8.chat-main.test.ts`: profile aria-label, settings-entry-label 색상 변경 반영
- `tailwind.config.js`: `boxShadow.card-press` inset shadow 토큰 추가
- `package.json`, `package-lock.json`: `dompurify` 의존성 추가, version 0.1.1 → 0.1.2

### Commands

- `npm install dompurify`
- `npm test -- --run src/__tests__/feature8.chat-main.test.ts`
- `npm run typecheck`
- `npm version patch --no-git-tag-version`

### Results

- `npm test -- --run src/__tests__/feature8.chat-main.test.ts`: passed, 12 tests passed
- `npm run typecheck`: passed
- `npm version patch --no-git-tag-version`: package version `0.1.1` → `0.1.2`

### Notes / Remaining Issues

- `npm test` 전체 실행 시 feature3 (`router path '/' 기대`), feature6 (mock data shape 기대 불일치) 4건 실패가 존재하며, 이는 이번 세션 변경(`/` → `/chat` 라우팅, mock data 확장)에 따른 회귀로 후속 보정 필요.
- API, DB, 인증/인가 문서는 변경하지 않음.
- 채팅 검색 모달 본체는 미구현 상태로 `openSearchModal` 함수에 TODO 주석 남김.
- BaseToast은 success/error/info variant만 정의했고, 실제 사용처는 PreviewPageCard 복사 결과 알림 한 곳.

## 2026-05-21 - feature9: Chat 대화 화면 구현 (SCR-410, SCR-420, SCR-600)

### Scope

- 메시지 목록 렌더링과 사용자/LINA MessageBubble 시각 구분 구현
- MessageInput Enter 전송, Shift+Enter 줄바꿈 동작 회귀 테스트 추가
- 질문 전송 시 SSE token/sources/verification/done 이벤트를 누적 반영
- LINA 답변 하단에 RAG 단계 라벨과 출처 버튼 표시
- 사용자 메시지 인라인 수정 모드 구현
- Sidebar conversation list 클릭 시 conversation별 메시지 이력 연결
- 첫 진입 시 mock conversation의 메시지 이력을 자동 로드해 대화 화면이 바로 보이도록 조정
- conversation list `isPinned` 필드를 API 타입, mock data, API 문서에 반영

### Test Cases

- 대화 메시지는 사용자 bubble에 border를 적용하고 LINA bubble에는 border를 적용하지 않는다.
- MessageInput은 Enter로 전송하고 Shift+Enter는 줄바꿈 입력을 유지한다.
- 질문 전송 후 SSE 청크가 하나의 LINA 답변으로 누적되고 RAG 단계 라벨이 노출된다.
- 사용자 메시지는 수정 버튼으로 인라인 편집 후 내용이 갱신된다.
- Sidebar의 pinned/recent conversation title을 클릭하면 해당 conversation 메시지가 표시된다.
- 첫 진입 시 첫 번째 mock conversation 메시지가 표시된다.

### Changed Files

- `src/__tests__/feature9.chat-conversation.test.ts`: feature9 실패 우선 테스트 추가
- `src/pages/ChatPage.vue`: 메시지 목록, SSE 누적 처리, 인라인 수정, conversation 선택 연결 구현
- `src/types/api.ts`: `Conversation.isPinned` 타입 추가
- `src/mocks/data.ts`: mock conversation pinned 상태 추가
- `src/__tests__/feature8.chat-main.test.ts`: feature9 pinned list 도입에 따른 stale placeholder 기대값 갱신
- `src/__tests__/feature3.routing-chat-shell.test.ts`: 기존 `/chat` 라우트 구현에 맞춰 stale 라우팅 기대값 갱신
- `src/__tests__/feature6.mock-api.test.ts`: 기존 mock data URL에 맞춰 stale URL 기대값 갱신
- `docs/api-spec.md`: 대화 목록 응답 예시에 `isPinned` 추가
- `docs/ai/current-plan.md`: feature9 완료 항목 체크

### Commands

- `npm test -- --run src/__tests__/feature9.chat-conversation.test.ts` 실패 확인
- `npm test -- --run src/__tests__/feature9.chat-conversation.test.ts`
- `npm test`
- `npm test -- --run src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- 최초 feature9 테스트 실행: failed, 메시지 목록/편집/SSE/pinned list 미구현으로 5 tests failed, 1 passed
- feature9 구현 후 단일 테스트: passed, 5 tests passed
- feature8/feature9 관련 테스트: passed, 18 tests passed
- 최초 전체 `npm test`: failed, feature8 stale pinned placeholder 기대값 1건과 기존 feature3/feature6 stale 기대값 4건 확인
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 8 test files and 52 tests passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: passed

### Notes / Remaining Issues

- feature10 이후 항목은 수정하지 않음.
- ReferencePanel 상세 열림/카드/그래프 동작은 feature10 범위로 유지하고, feature9에서는 출처 버튼 클릭 핸들러에 TODO만 남김.
- DB, 인증/인가 흐름 변경 없음.

## 2026-05-21 - feature9: Chat route/component 분리 및 액션 tooltip 보강

### Scope

- Chat shell은 `ChatPage.vue`에 유지하고 대화 본문은 내부 컴포넌트로 분리
- `/chat`은 SCR-400 빈 채팅 시작 화면, `/chat/:conversationId`는 SCR-410/420/600 대화 화면으로 route 분리
- Sidebar conversation 클릭 시 `router.push('/chat/{conversationId}')`로 URL을 변경하고 route param 기준으로 메시지 이력 로드
- 새 채팅 버튼 클릭 시 `/chat`으로 이동해 빈 상태 표시
- 사용자/LINA 메시지 하단 액션 아이콘에 기존 `BaseTooltip` 적용
- 사용자가 수정한 tooltip label 문구 유지
  - 사용자: `메시지 복사`, `메시지 수정`
  - LINA: `응답 복사`, `좋은 응답`, `별로인 응답`, `다시 시도`

### Test Cases

- `/chat` route는 ChatPage를 렌더링한다.
- `/chat/:conversationId` route는 ChatPage를 렌더링한다.
- Sidebar conversation 클릭 시 route가 `/chat/{conversationId}`로 변경된다.
- 메시지 액션 아이콘은 `BaseTooltip` label을 가진다.
- `/chat` 직접 진입 시 SCR-400 빈 상태가 유지된다.

### Changed Files

- `src/router/index.ts`: `/chat/:conversationId` route 추가
- `src/pages/ChatPage.vue`: route param 기반 메시지 로딩, 새 채팅/대화 선택 route 이동 처리, 대화 본문 렌더링 책임 분리
- `src/features/chat/ChatConversationView.vue`: 대화 메시지 목록 컴포넌트 추가
- `src/features/chat/MessageBubble.vue`: 메시지 버블, 인라인 수정, 출처 버튼, 하단 액션 아이콘 및 tooltip 컴포넌트 추가
- `src/__tests__/feature3.routing-chat-shell.test.ts`: 대화 상세 route 검증 추가
- `src/__tests__/feature8.chat-main.test.ts`: `/chat` 빈 상태 기준으로 테스트 정리
- `src/__tests__/feature9.chat-conversation.test.ts`: `/chat/:conversationId` 기준 대화 화면, route 이동, tooltip 검증 추가

### Commands

- `npm test -- --run src/__tests__/feature3.routing-chat-shell.test.ts src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- 관련 테스트: passed, 3 test files and 21 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 8 test files and 53 tests passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: passed

### Notes / Remaining Issues

- ChatPage를 page shell로 유지하고 page 파일 추가 분리는 하지 않음.
- ReferencePanel 상세 구현은 feature10 범위로 유지함.

## 2026-05-21 - feature9: SSE composable / Pinia 누적 store 전환

### Scope

- Chat SSE 처리 책임을 `ChatPage.vue`의 직접 fetch/파싱에서 `useSSE` composable로 분리
- SSE token/sources/verification/done 누적 결과를 Pinia `chat` store에 저장
- `ChatPage.vue`는 route, sidebar, 입력 이벤트를 store action에 연결하는 shell 역할로 축소
- `main.ts`에 Pinia plugin 등록
- MSW chat SSE mock 응답을 문자열 응답에서 `ReadableStream<Uint8Array>` chunk 응답으로 변경
- backend 전환 시 `streamConversationChat()` API 함수만 실제 endpoint 계약에 맞추면 `useSSE`/store/UI는 유지되도록 구성

### Test Cases

- Pinia chat store가 SSE token chunk를 assistant message content로 누적한다.
- Pinia chat store가 sources / verification / done messageId를 assistant message에 반영한다.
- Chat conversation 화면은 Pinia store 기반 메시지를 렌더링한다.
- MSW SSE mock은 `text/event-stream` 응답을 반환하고 token/sources/verification/done 이벤트를 제공한다.

### Changed Files

- `src/composables/useSSE.ts`: SSE Response stream parser composable 추가
- `src/stores/chat.ts`: conversation messages와 SSE 누적 응답을 관리하는 Pinia store 추가
- `src/stores/index.ts`: `useChatStore` export 추가
- `src/main.ts`: Pinia plugin 등록
- `src/pages/ChatPage.vue`: 로컬 메시지/SSE state 제거, `useChatStore` action/getter 사용
- `src/mocks/handlers.ts`: chat SSE mock 응답을 ReadableStream chunk 방식으로 변경
- `src/__tests__/feature9.chat-sse-store.test.ts`: SSE chunk 누적 store 테스트 추가
- `src/__tests__/feature3.routing-chat-shell.test.ts`, `src/__tests__/feature8.chat-main.test.ts`, `src/__tests__/feature9.chat-conversation.test.ts`: Pinia plugin 주입 및 store 기반 기대값 유지

### Commands

- `npm test -- --run src/__tests__/feature9.chat-sse-store.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `npm test -- --run src/__tests__/feature3.routing-chat-shell.test.ts src/__tests__/feature6.mock-api.test.ts src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- SSE store 관련 테스트: passed, 2 test files and 6 tests passed
- route/mock/chat 관련 테스트: passed, 4 test files and 31 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: initially failed due to `while (true)` in `useSSE`, loop 구조 수정 후 passed
- `./scripts/test.sh`: passed, 9 test files and 54 tests passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: passed

### Notes / Remaining Issues

- 실제 backend 연결 시에는 `streamConversationChat()`의 endpoint/인증/에러 계약만 feature11에서 맞추면 된다.
- 현재 mock SSE는 MSW browser worker에서도 chunk 단위로 응답을 enqueue한다.

## 2026-05-21 - feature9: mock SSE 3초 token demo / loading 표시

### Scope

- MSW chat SSE mock을 token별 chunk로 세분화하고 browser 환경에서 약 3초 동안 순차 표시되도록 지연 추가
- 첫 token 전 빈 assistant placeholder에 `BaseSpinner` 기반 loading 표시
- Pinia chat store에 현재 streaming 중인 assistant message id를 저장해 loading 대상 메시지만 식별
- 3초 지연은 backend 연결 전 제거/단축해야 하므로 `// TODO(MOCK)` 주석으로 명시

### Test Cases

- streaming 중인 빈 assistant placeholder는 loading spinner와 `답변 생성 중` 문구를 렌더링한다.
- SSE 완료 후 Pinia store는 streaming 상태와 streaming message id를 초기화한다.

### Changed Files

- `src/mocks/handlers.ts`: browser MSW에서 token별 3초 demo streaming delay 추가
- `src/stores/chat.ts`: `streamingMessageId` state 추가 및 stream lifecycle에 연결
- `src/features/chat/ChatConversationView.vue`: streaming props를 message bubble로 전달
- `src/features/chat/MessageBubble.vue`: 빈 assistant streaming placeholder에 `BaseSpinner` 표시
- `src/pages/ChatPage.vue`: Pinia streaming 상태/id를 conversation view에 전달
- `src/__tests__/feature9.chat-conversation.test.ts`: assistant loading placeholder 렌더링 테스트 추가
- `src/__tests__/feature9.chat-sse-store.test.ts`: stream 완료 후 `streamingMessageId` 초기화 검증 추가

### Commands

- `npm test -- --run src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature9.chat-sse-store.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- feature9 관련 테스트: passed, 2 test files and 7 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 9 test files and 55 tests passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: passed

## 2026-05-21 - feature9: chat UX polish / stream first-message fix

### Scope

- 채팅 화면의 내부 세로 스크롤을 제거하고 브라우저 페이지 스크롤로 이동
- assistant 답변 버블에서 RAG 단계 배지와 source 제목 목록 제거
- streaming 중 `BaseSpinner`를 답변 콘텐츠 위에 표시
- `/chat`에서 첫 메시지 전송 시 route 전환 뒤에도 stream 결과가 유지되도록 기존 로드 결과와 local stream 메시지를 병합
- 사이드바 expanded 상태에서 텍스트/리스트는 width transition이 거의 끝난 뒤 노출되도록 지연
- 실제 SSE transport는 `fetch + ReadableStream` 유지, EventSource로는 전환하지 않음

### Test Cases

- `/chat`에서 첫 메시지를 보내면 conversation route로 이동하고 stream 결과가 유지된다.
- sidebar에서 conversation을 선택하면 empty state 대신 해당 대화 기록이 렌더링된다.
- assistant bubble에는 source 제목이 렌더링되지 않고 source button만 남는다.
- streaming assistant placeholder는 `BaseSpinner`를 표시한다.
- sidebar expanded 텍스트는 transition 이후 노출된다.

### Changed Files

- `src/pages/ChatPage.vue`: page-level scroll, route 기반 active conversation 판정, sidebar text reveal delay, stream/history merge 대응
- `src/features/chat/ChatConversationView.vue`: 내부 overflow-y scroll 제거
- `src/features/chat/MessageBubble.vue`: RAG 배지/source title 제거, streaming spinner를 content 위에 표시
- `src/stores/chat.ts`: route 이동 중 로드가 stream 메시지를 덮어쓰지 않도록 기존 local 메시지 병합
- `src/__tests__/feature8.chat-main.test.ts`: sidebar reveal delay 반영
- `src/__tests__/feature9.chat-conversation.test.ts`: first-message stream / sidebar selection / source title 제거 검증 추가
- `docs/ai/working-log.md`: 작업 로그 갱신

### Commands

- `npm test -- --run src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature9.chat-sse-store.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- 관련 테스트: passed, 3 test files and 21 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 9 test files and 57 tests passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: passed

## 2026-05-21 - feature9: /chat 첫 전송 새 대화 생성 및 함수 주석 보강

### Scope

- `/chat`에서 첫 메시지 전송 시 기존 conversation을 재사용하지 않고 `createConversation()`으로 새 대화를 만든 뒤 해당 route로 이동하도록 수정
- MSW mock에 `POST /api/conversations` handler 추가
- `ChatPage.vue`, `useSSE.ts`, `chat` store, mock handler, 테스트 helper 함수들에 목적/parameter 주석을 보강
- 첫 대화 생성 흐름이 `chat` mock API, router, SSE stream과 함께 일관되게 동작하도록 테스트 보강

### Test Cases

- `/chat`에서 첫 메시지 전송 시 새 conversation이 생성되고 해당 route로 이동한 뒤 stream 결과가 보인다.
- MSW mock API는 `POST /api/conversations`를 반환한다.
- 채팅 화면 관련 helper 함수와 상태 관리 함수에는 호출자용 주석이 존재한다.

### Changed Files

- `src/pages/ChatPage.vue`: `/chat` 첫 전송 시 새 conversation 생성 후 라우팅하도록 변경, 함수 주석 보강
- `src/mocks/handlers.ts`: `POST /api/conversations` mock handler 추가
- `src/__tests__/feature6.mock-api.test.ts`: createConversation mock API 검증 추가
- `src/__tests__/feature8.chat-main.test.ts`, `src/__tests__/feature9.chat-conversation.test.ts`, `src/__tests__/feature9.chat-sse-store.test.ts`: 테스트 helper 함수 주석 보강 및 첫 전송 route 기대값 조정
- `src/features/chat/MessageInput.vue`, `src/features/chat/MessageBubble.vue`, `src/stores/chat.ts`, `src/composables/useSSE.ts`: 함수 주석 보강

### Commands

- `npm test -- --run src/__tests__/feature6.mock-api.test.ts src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature9.chat-sse-store.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- 관련 테스트: passed, 4 test files and 32 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 9 test files and 58 tests passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: passed

## 2026-05-21 - feature9: chat header fixed / page scroll layout

### Scope

- ChatPage 상단 헤더를 sticky 처리하고, `conversation title + menu + account` 구조로 재배치
- `MessageInput`는 하단에 sticky 상태로 유지해 입력창이 화면 아래에 고정되도록 조정
- 페이지 전체 스크롤을 통해 긴 대화 내용을 위아래로 확인하도록 레이아웃 유지
- `/chat` 기본 상태에서는 `새 채팅` 제목을 표시하고, conversation route에서는 해당 대화 제목을 표시

### Test Cases

- `/chat` 기본 화면의 헤더는 `새 채팅` 제목과 더보기/계정 버튼을 렌더링한다.
- conversation 화면의 헤더는 현재 대화 제목을 렌더링한다.
- 메시지 내용이 길어져도 헤더는 상단에 남아 있고 입력창은 하단에 유지된다.

### Changed Files

- `src/pages/ChatPage.vue`: sticky header/input layout과 conversation title 렌더링 추가
- `src/__tests__/feature8.chat-main.test.ts`: 헤더 제목/더보기 버튼 기대값 업데이트
- `src/__tests__/feature9.chat-conversation.test.ts`: conversation title 기대값 추가
- `docs/ai/working-log.md`: 작업 로그 갱신

### Commands

- `npm test -- --run src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts`

### Results

- 관련 테스트: passed, 2 test files and 20 tests passed

## 2026-05-21 - feature9: SSE phase placeholder state 반영

### Scope

- SSE 스트리밍 중 `검색 중... -> 검증 중... -> 답변 생성 중... -> token 누적` 단계가 화면에서 보이도록 상태를 명시적으로 분리
- `chat` store에 `streamingPhase` state 추가
- `MessageBubble`의 streaming placeholder가 phase label을 표시하도록 수정
- MSW mock SSE 이벤트 순서를 `sources -> verification -> token...`으로 바꿔 stage placeholder가 먼저 보이도록 조정

### Test Cases

- streaming placeholder는 `검색 중...` 라벨부터 시작한다.
- `sources` / `verification` 이벤트 이후에는 phase label이 변경된다.
- 스트림 종료 후 `streamingPhase`는 `idle`로 초기화된다.

### Changed Files

- `src/stores/chat.ts`: `streamingPhase` state와 event 기반 phase 전환 추가
- `src/features/chat/MessageBubble.vue`: streaming phase label 렌더링 추가
- `src/features/chat/ChatConversationView.vue`: streaming phase prop 전달
- `src/mocks/handlers.ts`: SSE mock event 순서 변경
- `src/types/api.ts`: `ChatStreamingPhase` 타입 추가
- `src/__tests__/feature9.chat-conversation.test.ts`, `src/__tests__/feature9.chat-sse-store.test.ts`: phase label/state 테스트 추가

### Commands

- `npm test -- --run src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature9.chat-sse-store.test.ts`

### Results

- 관련 테스트: passed, 2 test files and 10 tests passed

## 2026-05-21 - feature9: empty state header / conversation header 분리

### Scope

- `/chat` empty state에서는 기존처럼 `LINA + 프로필`만 보여주고, conversation 화면에서만 제목 헤더를 노출
- conversation 헤더의 타이포그래피 크기를 축소해 시각적 위계를 낮춤
- 헤더 분기 기준을 `hasActiveConversation`으로 분리해 empty state와 conversation layout을 자연스럽게 구분

### Test Cases

- `/chat` empty state에는 conversation title과 menu button이 렌더링되지 않는다.
- conversation 화면에는 현재 대화 제목이 더 작은 크기로 렌더링된다.

### Changed Files

- `src/pages/ChatPage.vue`: empty state header / conversation header 조건 분리, title font size 축소
- `src/__tests__/feature8.chat-main.test.ts`: empty state header 기대값 업데이트
- `src/__tests__/feature9.chat-conversation.test.ts`: conversation title font size 기대값 추가

### Commands

- `npm test -- --run src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts`

### Results

- 관련 테스트: passed, 2 test files and 20 tests passed

## 2026-05-21 - feature9: streaming phase label store 이동

### Scope

- `MessageBubble.vue`의 phase-to-label 분기 로직을 제거하고, 화면 표시용 자연어 문구를 `chat` store getter로 이동
- 스트리밍 상태 제어는 기존 `streamingPhase` enum을 유지하고, UI는 `streamingStatusText`만 렌더링하도록 분리

### Test Cases

- `streamingPhase`가 `searching / verifying / answering / streaming / idle`일 때 store getter가 각각 올바른 표시 문구를 반환한다.
- `MessageBubble`은 label 계산 없이 전달받은 status text만 렌더링한다.

### Changed Files

- `src/stores/chat.ts`: `streamingStatusText` getter 및 phase-to-label helper 추가
- `src/features/chat/MessageBubble.vue`: phase 기반 label computed 제거, 전달받은 text만 렌더링
- `src/features/chat/ChatConversationView.vue`: status text prop 전달로 변경
- `src/pages/ChatPage.vue`: chat store getter를 conversation view에 전달
- `src/__tests__/feature9.chat-conversation.test.ts`, `src/__tests__/feature9.chat-sse-store.test.ts`: status text prop/getter 테스트 갱신

### Commands

- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 관련 테스트: passed, 9 test files and 60 tests passed

## 2026-05-21 - feature9: SSE stream 동작 점검 및 abort 보강

### Scope

- SSE token 누적 경로를 `mock handler -> useSSE -> chat store -> MessageBubble` 순서로 재점검
- `cancelStreaming()`이 UI 상태만 내리던 문제를 수정해 실제 fetch stream을 `AbortController`로 중단
- backend 호환성을 위해 `useSSE` parser가 CRLF(`\r\n`) frame과 여러 `data:` line을 처리하도록 보강
- SSE `error` 이벤트 수신 시 assistant placeholder에 오류 문구를 반영하고 버튼 상태를 복구

### Test Cases

- `streamConversationChat()` 호출에 `AbortSignal`이 전달되고, cancel 시 signal이 abort된다.
- CRLF SSE frame도 token/done 이벤트로 정상 파싱된다.
- backend `error` 이벤트 수신 시 assistant 메시지에 오류 문구가 표시되고 streaming 상태가 초기화된다.

### Changed Files

- `src/api/client.ts`, `src/api/index.ts`: SSE request에 선택적 `AbortSignal` 전달 추가
- `src/composables/useSSE.ts`: CRLF/multi-data frame parser 및 reader cancel 처리 추가
- `src/stores/chat.ts`: active stream abort controller, cancel abort, error event 처리 추가
- `src/__tests__/feature9.chat-sse-store.test.ts`: abort/CRLF/error 이벤트 재현 테스트 추가

### Commands

- `npm test -- --run src/__tests__/feature9.chat-sse-store.test.ts src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature5.api-client.test.ts`

### Results

- 관련 테스트: passed, 3 test files and 20 tests passed

## 2026-05-22 - feature9: empty/conversation submit SSE 경로 보강

### Scope

- 메시지 제출 시 store active conversation이 아직 비어 있어도 현재 route conversation ID를 우선 사용하도록 수정
- 대화 이력 로딩 중 바로 질문을 입력해도 새 대화를 만들지 않고 현재 대화의 SSE endpoint로 전송되도록 보강
- 새 대화 생성 또는 전송 실패 시 사용자에게 error toast를 표시해 입력 후 무반응처럼 보이지 않도록 처리

### Test Cases

- `/chat/:conversationId` 진입 직후 메시지 이력 로딩이 끝나기 전에 입력해도 `POST /api/conversations`를 호출하지 않는다.
- 같은 상황에서 `/api/conversations/{conversationId}/chat` SSE endpoint로 질문이 전송되고 사용자 메시지와 누적 답변이 렌더링된다.

### Changed Files

- `src/pages/ChatPage.vue`: submit 경로의 conversation ID 결정과 실패 toast 처리 보강
- `src/__tests__/feature9.chat-conversation.test.ts`: route ID fallback SSE submit 회귀 테스트 추가
- `docs/ai/working-log.md`: 작업 로그 갱신

### Commands

- `npm test -- src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature9.chat-sse-store.test.ts`
- `npm run typecheck`
- `npm run lint`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 관련 테스트: passed, 2 test files and 17 tests passed

## 2026-05-22 - feature9: RAG status 이벤트 계약 반영

### Scope

- RAG streaming status phase를 `connecting → acl_filtering → searching → answering → streaming → verifying → formatting` 구조로 정리
- 기존 SSE 이벤트 흐름에 `meta` 이벤트 타입을 추가하고 store에서는 현재 UI에 영향 없이 무시
- 알 수 없는 `status.phase`가 오면 기존 phase/statusMessage를 유지하도록 방어 처리
- mock SSE stream을 status 추가 이벤트와 기존 token/sources/verification/meta/done 순서가 맞물리도록 갱신
- `docs/api-spec.md`에 `stream=true` RAG streaming mode, status phase 처리 규칙, 0건 단축 흐름, 비-streaming 모드 주의사항 반영

### Test Cases

- `status` 이벤트 message는 그대로 저장하되 UI 분기는 message에 의존하지 않는다.
- `meta` 이벤트가 와도 기존 token/source/verification 누적 동작이 깨지지 않는다.
- 알 수 없는 phase는 무시하고 직전 상태를 유지한다.

### Changed Files

- `docs/api-spec.md`: RAG status 이벤트 phase/처리 규칙 및 `meta` 이벤트 문서화
- `src/types/api.ts`: `ChatMetaEvent` 추가, status phase를 확장 가능한 문자열로 수신
- `src/stores/chat.ts`: known phase guard와 `meta` no-op 처리 추가
- `src/mocks/handlers.ts`: RAG status phase 순서와 `meta` mock 추가
- `src/composables/useSSE.ts`: SSE 이벤트 목록 주석에 `meta` 반영
- `src/__tests__/feature9.chat-sse-store.test.ts`: meta/unknown phase 회귀 테스트 추가

### Commands

- `npm test -- src/__tests__/feature9.chat-sse-store.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`

### Results

- 관련 테스트: passed, 2 test files and 18 tests passed
- typecheck: passed
- 전체 검증: passed, 9 test files and 66 tests passed

## 2026-05-22 - feature9: chat page-level scroll layout

### Scope

- 대화 메시지 영역 내부 스크롤(`overflow-y-auto`)을 제거하고, 브라우저 문서 레벨의 세로 스크롤을 사용하도록 변경
- header는 상단 sticky, message input은 viewport 하단 fixed로 유지해 메시지가 많아질 때 본문만 자연스럽게 위로 흐르도록 조정
- sidebar는 viewport 높이에 고정되도록 `sticky top-0 h-screen` 처리

### Test Cases

- `chat-scroll-region`이 내부 세로 스크롤을 만들지 않는다.
- conversation header는 `sticky top-0`으로 유지된다.
- message input region은 `fixed bottom-0`으로 하단에 유지된다.

### Changed Files

- `src/pages/ChatPage.vue`: page-level scroll + sticky header/fixed input layout으로 변경
- `src/__tests__/feature9.chat-conversation.test.ts`: 내부 스크롤 제거와 fixed input layout 기대값 갱신
- `docs/ai/working-log.md`: 작업 로그 갱신

### Commands

- `npm test -- src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature8.chat-main.test.ts`
- `npm run typecheck`
- `npm run lint`
- `./scripts/format.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 관련 테스트: passed, 2 test files and 24 tests passed
- 전체 검증: passed, 9 test files and 66 tests passed

## 2026-05-22 - feature9: backend status.message 기반 SSE 상태 표시

### Scope

- SSE `status` 이벤트 타입을 추가하고, backend가 내려주는 `message`를 assistant 메시지의 `statusMessage`에 그대로 저장
- phase 값을 프론트에서 정적 문구로 변환하던 store helper 제거
- MessageBubble은 store getter label 대신 메시지별 `statusMessage`를 렌더링
- mock SSE stream과 API 명세에 `status` 이벤트를 반영

### Test Cases

- `status` 이벤트 수신 시 `phase`와 `statusMessage`가 현재 assistant 메시지에 반영된다.
- `status.message`가 MessageBubble의 streaming loading 영역에 그대로 표시된다.
- `done`/`error`/cancel 처리 시 `statusMessage`가 초기화된다.

### Changed Files

- `src/types/api.ts`: `ChatStatusEvent`, 확장 `ChatStreamingPhase`, 메시지 status 상태 타입 추가
- `src/stores/chat.ts`: phase-to-label 변환 제거, `status.message` 저장 및 종료 시 초기화
- `src/features/chat/MessageBubble.vue`, `src/features/chat/ChatConversationView.vue`, `src/pages/ChatPage.vue`: 메시지별 `statusMessage` 렌더링 경로로 정리
- `src/mocks/handlers.ts`: mock SSE에 `status` 이벤트 순서 추가
- `docs/api-spec.md`: SSE `status` 이벤트 문서화
- `src/__tests__/feature9.chat-sse-store.test.ts`, `src/__tests__/feature9.chat-conversation.test.ts`: status event 회귀 테스트 추가

### Commands

- `npm test -- src/__tests__/feature9.chat-sse-store.test.ts src/__tests__/feature9.chat-conversation.test.ts`

### Results

- 관련 테스트: passed, 2 test files and 17 tests passed
