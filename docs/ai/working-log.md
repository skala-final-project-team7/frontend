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

## 2026-05-22 - feature9: SSE meta.title 및 API 명세 보강

### Scope

- RAG streaming `meta` 이벤트의 현재 구현 필드(`intent`, `used_llm`, `feedback_enabled`, `latency_ms`)를 API 명세에 정리
- 채팅 제목은 별도 이벤트를 늘리지 않고 `meta.title`로 수신하도록 타입과 store 상태 반영
- `docs/api-spec.md`를 v2.1.0으로 버전업하고, BE 조정 명세의 변경점을 현행 FE 명세에 반영
- mock SSE stream에 `meta.title`을 추가해 대화 제목 갱신 흐름을 검증 가능하게 정리

### Test Cases

- `meta.title` 수신 시 conversation title이 갱신된다.
- `meta` 이벤트가 기존 token/source/verification/done 누적 흐름을 깨지 않는다.

### Changed Files

- `docs/api-spec.md`: RAG streaming status/meta 이벤트 계약과 v2.1.0 버전 반영
- `src/types/api.ts`: `ChatMetaEvent.data.title` optional 필드 추가
- `src/stores/chat.ts`: `conversationTitlesById` 상태와 `meta.title` 반영 처리 추가
- `src/pages/ChatPage.vue`: store의 streaming title을 현재 대화 제목과 sidebar 대화 목록에 반영
- `src/mocks/handlers.ts`: mock SSE `meta.title` 추가
- `src/__tests__/feature9.chat-sse-store.test.ts`, `src/__tests__/feature9.chat-conversation.test.ts`: meta title 회귀 테스트 추가

### Commands

- `npm test -- src/__tests__/feature9.chat-sse-store.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `npm run lint`
- `./scripts/verify.sh`

### Results

- 관련 테스트: passed
- 전체 검증: passed

## 2026-05-22 - feature9: Chat scroll owner 및 scrollbar layout shift 보강

### Scope

- Chat 화면에서 내부 스크롤을 만드는 실제 scroll owner를 추적
- `overflow-x-hidden`이 computed `overflow-y: auto`를 만들던 원인을 제거하고, Chat content wrapper/message list는 `overflow-x-clip`을 사용하도록 변경
- 메시지 목록은 내부 scrollbar 없이 document/body scroll을 유지
- body scrollbar가 생길 때 viewport 폭 변화로 좌우 layout shift가 발생하지 않도록 전역 `scrollbar-gutter: stable` 적용

### Test Cases

- `chat-scroll-region`과 `message-list`에 `overflow-y-auto`, `overflow-y-scroll`, `overflow-x-hidden`, `flex-1`이 남아 있지 않다.
- 전역 CSS에 `scrollbar-gutter: stable`, `body overflow-y: auto`, `body overflow-x: hidden`이 유지된다.

### Changed Files

- `src/pages/ChatPage.vue`: Chat page/main scroll region의 `overflow-x-hidden`을 `overflow-x-clip`으로 변경
- `src/features/chat/ChatConversationView.vue`: message list overflow/flex class 정리
- `src/styles/main.css`: `html { scrollbar-gutter: stable; }`, body scroll 기본값 보강
- `src/__tests__/feature9.chat-conversation.test.ts`: 내부 스크롤 제거 회귀 테스트 보강
- `src/__tests__/feature4.design-tokens.test.ts`: 전역 scrollbar-gutter 회귀 테스트 추가

### Commands

- `npm test -- src/__tests__/feature4.design-tokens.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `npm run lint`
- `./scripts/verify.sh`

### Results

- 관련 테스트: passed
- 브라우저 확인: forced tall content 기준 document/html만 scroll owner로 동작
- 전체 검증: passed, 9 test files and 68 tests passed

## 2026-05-22 - feature9: MessageInput streaming stop button UI

### Scope

- 스트리밍 중 별도 `취소` 텍스트 버튼을 제거
- 기존 원형 전송 버튼이 스트리밍 중 `CircleStop` 아이콘을 렌더링하고 cancel action을 수행하도록 통합
- 스트리밍 중 원형 버튼은 disabled 색상 계열로 보이되 클릭 가능한 중단 버튼으로 유지

### Test Cases

- 스트리밍 중 textarea는 disabled 상태다.
- 별도 `message-cancel-button`은 렌더링되지 않는다.
- 원형 action button의 aria-label은 `응답 중단`이며 click 시 `cancel` 이벤트를 emit한다.
- 스트리밍 중 icon은 `circle-stop` 형태로 렌더링된다.

### Changed Files

- `src/features/chat/MessageInput.vue`: send/stop action button 상태 통합 및 `CircleStop` 아이콘 적용
- `src/__tests__/feature8.chat-main.test.ts`: streaming stop action UI 회귀 테스트 갱신

### Commands

- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `npm run lint`
- `./scripts/verify.sh`

### Results

- 관련 테스트: passed, 2 test files and 25 tests passed
- 전체 검증: passed, 9 test files and 68 tests passed

## 2026-05-22 - feature9: 사용자 메시지 inline edit bubble UI 보강

### Scope

- 사용자 메시지 수정 UI가 별도 카드처럼 보이지 않도록 기존 user bubble 안에서 inline edit 형태로 렌더링
- textarea를 user bubble 배경과 자연스럽게 이어지는 `bg-transparent` 스타일로 변경
- textarea 자동 높이 조절과 최대 높이 내부 스크롤을 추가
- Enter는 수정 전송, Shift+Enter는 줄바꿈으로 처리
- 수정 모드의 `보내기` 버튼을 이미지 기준에 맞춰 검정 계열 pill 버튼으로 변경
- 수정 전/후 사용자 메시지와 바로 뒤 assistant 답변을 로컬 version 상태로 보관
- < 클릭 시 이전 사용자 메시지와 해당 답변이 다시 표시되도록 표시용 메시지 배열을 매핑
- 메시지별 version indicator 상태와 version 선택 이벤트 전달

### Test Cases

- edit textarea는 기존 user bubble 안에서 렌더링되고 `bg-primary-white`/강한 border를 사용하지 않는다.
- textarea는 기존 메시지 내용으로 초기화된다.
- Shift+Enter 줄바꿈과 Enter 전송이 유지된다.
- `보내기` 버튼은 `bg-overlay-dark-80`과 `text-primary-white`를 사용하며 `bg-primary`를 쓰지 않는다.

### Changed Files

- `src/features/chat/MessageBubble.vue`: inline edit textarea 스타일, 자동 높이, keyboard submit 처리, 검정 submit 버튼 적용
- `src/__tests__/feature9.chat-conversation.test.ts`: inline edit bubble, Enter/Shift+Enter, submit button style 테스트 보강

### Commands

- `npm test -- src/__tests__/feature9.chat-conversation.test.ts`
- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `npm run lint`
- `./scripts/verify.sh`

### Results

- 관련 테스트: passed, 2 test files and 25 tests passed
- 전체 검증: passed, 9 test files and 68 tests passed

## 2026-05-22 - feature9: 사용자 메시지 하단 hover action 및 수정본 indicator

### Scope

- 사용자 메시지 하단 copy/edit 아이콘은 기본 숨김 처리하고, 메시지 hover/focus 시 해당 위치에 보이도록 변경
- 사용자 메시지를 수정 후 다시 보내면 하단 action row에 `2/2` indicator와 좌우 chevron control을 표시
- 현재는 서버/도메인에 메시지 version 목록이 없으므로, 수정 재전송된 메시지를 로컬 표시 상태로만 관리

### Test Cases

- 사용자 메시지 하단 action icon wrapper는 `opacity-0`과 `group-hover/message:opacity-100`을 가진다.
- 수정 전송 후 `message-version-indicator`에 `2/2`가 표시된다.
- 좌우 version control 버튼 2개가 렌더링된다.

### Changed Files

- `src/pages/ChatPage.vue`: 수정 재전송된 메시지 ID를 로컬 상태로 기록하고 conversation 변경 시 초기화
- `src/features/chat/ChatConversationView.vue`: 수정 재전송 여부를 MessageBubble에 전달
- `src/features/chat/MessageBubble.vue`: hover action wrapper와 `2/2` version navigation UI 추가
- `src/__tests__/feature9.chat-conversation.test.ts`: hover action 및 version indicator 회귀 테스트 추가

### Commands

- `npm test -- src/__tests__/feature9.chat-conversation.test.ts`
- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `npm run lint`
- `./scripts/verify.sh`

### Results

- 관련 테스트: passed, 2 test files and 25 tests passed
- 전체 검증: passed, 9 test files and 68 tests passed

## 2026-05-26 - feature9: MessageEdit/version navigation 노출 보류

### Scope

- backend message version 목록과 수정 이후 답변 재생성 계약을 추후 협의하기로 결정
- 계약 확정 전까지 사용자 메시지 하단의 수정/복사/version navigation action row를 화면에 노출하지 않도록 feature gate 적용
- inline edit/version 전환 구현 코드는 후속 계약 연결을 위해 유지하되 사용자 진입점은 닫음
- 화면 사양과 current plan을 “계약 확정 후 활성화” TODO 상태로 갱신

### Test Cases

- 대화 화면에서 사용자 메시지 action row와 수정 버튼이 렌더링되지 않는다.
- edit textarea 및 version navigation이 노출되지 않는다.
- assistant 하단 액션과 기존 채팅 흐름은 유지된다.

### Changed Files

- `src/features/chat/MessageBubble.vue`: `isUserMessageRevisionEnabled` gate와 backend 계약 TODO 추가
- `src/__tests__/feature9.chat-conversation.test.ts`: 사용자 수정/version UI 비노출 회귀 테스트로 변경
- `frontend/docs/components.md`: MessageEdit를 backend 계약 확정 후 구현할 TODO로 전환
- `docs/ai/current-plan.md`: 인라인 수정 완료 표시를 후속 작업 상태로 변경
- `docs/ai/working-log.md`: 보류 결정과 검증 내용 기록

### Commands

- `npm test -- src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature8.chat-main.test.ts`
- `npm run typecheck`
- `npm run lint`
- `./scripts/verify.sh`

### Results

- 관련 테스트: passed, 2 test files and 25 tests passed
- typecheck: passed
- lint: passed
- 전체 검증: passed, 9 test files and 68 tests passed

## 2026-05-26 - feature9: Chat 로딩 경쟁 조건, Source 계약, assistant action 회귀 수정

### Scope

- 지연된 메시지 이력 조회 실패가 이미 표시된 로컬 질문/SSE 답변을 초기화하지 않도록 보존
- API 명세에 맞춰 RAG `Source` 수정 시각 필드를 `sourceUpdatedAt`으로 통일
- 스트리밍 시작 직후, 취소로 남은 빈 assistant placeholder, error 응답에서 출처/일반 assistant action 비노출

### Test Cases

- 메시지 이력 요청이 늦게 실패해도 먼저 완료된 SSE 질문/답변이 화면에 유지된다.
- 타입, mock history, SSE event fixture가 `sourceUpdatedAt`을 사용한다.
- 빈 streaming/cancel placeholder와 error 응답에는 출처/assistant action row가 표시되지 않는다.

### Changed Files

- `src/pages/ChatPage.vue`: message history 조회 실패 시 현재 표시 메시지를 파괴적으로 초기화하지 않도록 수정
- `src/features/chat/MessageBubble.vue`: 완료된 유효 답변과 실제 sources가 있을 때만 하단 액션/출처 버튼 표시
- `src/types/api.ts`, `src/mocks/data.ts`: `Source.sourceUpdatedAt` 계약과 mock payload 반영
- `src/__tests__/feature5.api-client.test.ts`, `src/__tests__/feature6.mock-api.test.ts`: source 계약 회귀 검증 갱신
- `src/__tests__/feature9.chat-conversation.test.ts`, `src/__tests__/feature9.chat-sse-store.test.ts`: stale load 실패, source field, action 노출 조건 검증 추가
- `frontend/docs/SSE-streaming.md`: canonical source field 예시와 타입을 `sourceUpdatedAt` 기준으로 정렬

### Commands

- `npm test -- --run src/__tests__/feature9.chat-conversation.test.ts` (회귀 테스트 실패 확인 후 수정 검증)
- `npm test -- --run src/__tests__/feature6.mock-api.test.ts src/__tests__/feature9.chat-sse-store.test.ts` (계약 테스트 실패 확인)
- `npm run typecheck` (계약 타입 실패 확인 후 수정 검증)
- `npm test -- --run src/__tests__/feature5.api-client.test.ts src/__tests__/feature6.mock-api.test.ts src/__tests__/feature9.chat-sse-store.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 각 회귀 테스트는 구현 변경 전 예상 실패를 확인했다.
- 대상 테스트와 typecheck는 수정 후 통과했다.
- 전체 검증: passed, 9 test files and 70 tests passed

## 2026-05-26 - feature11.5: 스트리밍 stop backend 처리 정책 TODO 기록

### Scope

- 현재 FE stop 버튼이 SSE 요청 abort까지만 수행한다는 점을 유지
- BFF/RAG downstream 취소 전파와 partial assistant 응답 저장 정책은 backend 협의 후 결정할 TODO로 기록
- 새 cancel endpoint를 미리 정의하지 않고, 필요 구조로 확정된 경우에만 API 명세를 갱신하도록 계획에 분리

### Changed Files

- `src/features/chat/MessageInput.vue`: stop 버튼 cancel 발생 위치에 backend 중단 정책 TODO 기록
- `docs/ai/current-plan.md`: 실제 Chat 연결 이후 고려할 `feature11.5` 추가
- `docs/ai/working-log.md`: 결정 사항과 변경 범위 기록

### Commands

- `./scripts/verify.sh`

### Results

- 전체 검증: passed, 9 test files and 70 tests passed

## 2026-05-26 - API 명세 정합성: Common Error, KST timestamp, SSE phase 정렬

### Scope

- `docs/api-spec.md`의 Common Response 실패 계약을 기준으로 FE 에러 타입과 API client 예외 전달을 정렬
- API 응답 mock 및 계약 테스트 timestamp를 KST(`+09:00`) 표기로 통일
- `frontend/docs/SSE-streaming.md`의 status phase 목록과 예시 sequence를 canonical API 명세 기준으로 정리
- Confluence preview는 후속 기능 상태를 유지하며, 해당 섹션의 실패 응답 예시만 공통 wrapper와 일치하도록 정정

### Test Cases

- Common Response 실패 응답의 `errorCode`가 `ApiClientError`에 보존된다.
- mock create/user/history/preview 응답 timestamp가 KST 형식으로 반환된다.
- preview mock 실패 응답이 `errorCode` 기반 Common Response 형식을 따른다.

### Changed Files

- `docs/api-spec.md`: preview 실패 예시를 공통 실패 wrapper와 정렬하고 명세 버전을 `v2.2.1`로 갱신
- `frontend/docs/SSE-streaming.md`: status phase 타입/표/sequence를 canonical phase 집합으로 정리
- `src/types/api.ts`, `src/api/client.ts`: `ApiErrorResponse.errorCode`와 `ApiClientError.errorCode` 전달 구현
- `src/mocks/data.ts`, `src/mocks/handlers.ts`: KST timestamp와 공통 실패 payload 반영
- `src/__tests__/feature5.api-client.test.ts`, `src/__tests__/feature6.mock-api.test.ts`, `src/__tests__/feature8.chat-main.test.ts`, `src/__tests__/feature9.chat-conversation.test.ts`: 계약 fixture 및 회귀 검증 갱신

### Commands

- `npm test -- --run src/__tests__/feature5.api-client.test.ts src/__tests__/feature6.mock-api.test.ts` (구현 전 회귀 테스트 실패 확인)
- `npm test -- --run src/__tests__/feature5.api-client.test.ts src/__tests__/feature6.mock-api.test.ts`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 계약 회귀 테스트는 `errorCode` 미전달, UTC mock timestamp, preview 실패 payload 불일치로 실패했다.
- 관련 테스트 및 typecheck: passed
- 전체 테스트: passed, 9 test files and 71 tests passed

## 2026-05-26 - feature10: 출처 패널 구현 (SCR-500, SCR-510)

### Scope

- assistant 답변의 출처 버튼에서 우측 ReferencePanel을 열고 열린 sidebar를 자동으로 닫는 흐름 구현
- 기존 Confluence preview API를 이용해 검색 결과형 list item에 제목, breadcrumb path, 작성자, 수정일 표시
- list item hover/focus 시 패널 왼쪽에 `PreviewPageCard`를 popover로 표시
- `PreviewPageCard`는 모든 사용 위치에서 자체 named hover group을 사용해 카드 자체 hover/focus에서만 URL action/path 표현 노출
- list item 자체의 URL action은 제거해 hover preview card에서만 아이콘과 경로가 노출되도록 정리
- 사용자 피드백에 따라 오래된 문서 badge와 질문 문자열 기반 keyword 강조를 제거
- 새 채팅 진입 시 이전 conversation에서 열린 출처 패널 상태 초기화
- 공통 카드 기본 레이아웃과 shadow를 유지하면서 새 채팅 화면과 출처 패널의 hover 기준 통일
- list item과 팝오버 사이 간격을 팝오버 hover 영역으로 연결해 카드로 이동 중 preview 유지
- feature16 전까지 List/Graph 토글과 Graph placeholder 제공

### Test Cases

- 출처 버튼 클릭 시 우측 패널이 표시되고 열린 sidebar가 닫힌다.
- list item이 title/path/author/date와 각 metadata 아이콘을 표시하되 URL action은 직접 표시하지 않는다.
- list item hover 시 패널 왼쪽에 해당 페이지의 shadowed `PreviewPageCard`가 나타난다.
- list item hover만으로 카드 action/path가 활성화되지 않고 카드 자체 hover/focus에서만 활성화된다.
- ChatEmptyState의 기본 `PreviewPageCard`는 기존 shadow를 유지하고 자체 named hover scope를 사용한다.
- list item과 popover card 사이의 시각 간격은 hover 이동 영역을 유지한다.
- 목록에는 오래된 문서 badge와 단순 keyword 강조 markup이 표시되지 않는다.
- 출처 패널이 열린 상태에서 새 채팅을 누르면 패널이 닫힌다.
- Graph 탭은 실제 graph 대신 placeholder를 표시하고 List 탭으로 복귀할 수 있다.

### Changed Files

- `src/__tests__/feature10.reference-panel.test.ts`: SCR-500/510 acceptance 및 회귀 테스트 추가
- `src/features/chat/ReferencePanel.vue`: 목록형 source item, `PreviewPageCard` hover popover와 포인터 이동 bridge, stale badge 제거, List/Graph 토글 구현
- `src/features/chat/PreviewPageCard.vue`: 기본 카드 구조 유지, 공통 named hover group으로 중첩 hover 전파 차단
- `src/pages/ChatPage.vue`: 출처 버튼에서 패널 상태 연결, 열린 패널 폭 반영, 새 채팅 route 초기화 및 불필요한 keyword 전달 상태 제거
- `docs/ai/current-plan.md`: feature10 완료 체크 처리
- `docs/ai/working-log.md`: feature10 구현 및 검증 기록

### Commands

- `npm test -- src/__tests__/feature10.reference-panel.test.ts` (구현 전 실패 확인)
- `npm test -- src/__tests__/feature10.reference-panel.test.ts`
- `npm test -- src/__tests__/feature10.reference-panel.test.ts` (목록형 UI 보정 전 실패 확인)
- `npm test -- src/__tests__/feature10.reference-panel.test.ts` (badge 제거 및 새 채팅 초기화 전 실패 확인)
- `npm test -- src/__tests__/feature10.reference-panel.test.ts` (목록 action 제거 전 실패 확인)
- `npm test -- src/__tests__/feature10.reference-panel.test.ts` (preview hover scope 분리 전 실패 확인)
- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature10.reference-panel.test.ts` (메인 카드 회귀/팝오버 variant 복구 전 실패 확인)
- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature10.reference-panel.test.ts` (공통 named hover scope/팝오버 이동 bridge 구현 전 실패 확인)
- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature10.reference-panel.test.ts`
- `npm run typecheck`
- `npm run lint`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 feature10 테스트: failed, `ReferencePanel.vue` 미존재 확인
- 목록형 UI 보정 테스트: failed, 기존 boxed `reference-card`가 list item/hover preview 조건을 충족하지 않음
- 후속 UI 보정 테스트: failed, 오래된 문서 badge가 노출되고 새 채팅에서도 패널이 유지됨
- hover action 보정 테스트: failed, list item 자체에도 URL action이 렌더링됨
- hover scope 보정 테스트: failed, `PreviewPageCard`의 일반 `group-hover`가 list item hover를 상속함
- 메인 카드 회귀/팝오버 variant 테스트: failed, 공통 카드 기본 shadow 구조가 바뀌었고 팝오버 격리 prop이 없음
- 공통 named hover scope/팝오버 이동 bridge 테스트: failed, 기본 카드는 일반 group을 사용하고 팝오버 간격은 hover 영역 밖임
- 구현 후 feature10 테스트: passed, 5 tests passed
- 연관 Chat 테스트: passed, 3 test files and 32 tests passed
- `npm run typecheck`: passed
- `./scripts/format.sh`: passed
- hover scope 테스트 보정 후 `./scripts/lint.sh`: failed, 미사용 테스트 변수 제거 후 passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 10 test files and 76 tests passed
- `./scripts/verify.sh`: passed, 10 test files and 76 tests passed

### Notes / Remaining Issues

- API 계약은 변경하지 않고 기존 preview endpoint를 사용했으므로 `docs/api-spec.md` 추가 수정은 필요하지 않다.
- 실제 graph node/edge 렌더링과 상호작용은 계획된 feature16 범위로 유지한다.
- boxed ReferenceCard, 오래된 문서 badge, 단순 질문 keyword highlight는 사용자 피드백에 따라 유지하지 않고 목록형 item으로 정리했다.

## 2026-05-26 - SCR-400 UI 보정 (collapsed sidebar tooltip clipping)

### Scope

- 자체 `BaseTooltip` content를 body-level portal로 렌더링해 sidebar/layout overflow clipping 방지
- 기본 tooltip을 trigger 우측 중앙, 12px offset으로 fixed 배치하고 높은 z-index 적용
- 기존 `placement` prop 기반 top/right/bottom/left 호출 계약 유지
- sidebar layout과 overflow 속성은 변경하지 않음

### Test Cases

- `BaseTooltip` hover 시 content가 `document.body` 아래에 렌더링된다.
- 기본 tooltip은 `right`, `center`, `12px` offset metadata와 `z-[9999]`를 가진다.
- collapsed sidebar의 `사이드바 열기` tooltip이 body portal의 오른쪽 tooltip으로 표시된다.
- 기존 `placement="left"` tooltip은 trigger 왼쪽 바깥에 유지된다.

### Changed Files

- `src/shared/ui/BaseTooltip.vue`: Teleport, fixed positioning, hover/focus 표시 상태 및 resize/scroll 재배치 추가
- `src/__tests__/feature8.chat-main.test.ts`: portal 기본 배치와 collapsed sidebar tooltip 회귀 테스트 추가
- `docs/ai/working-log.md`: SCR-400 tooltip clipping 보정 기록

### Commands

- `npm test -- src/__tests__/feature8.chat-main.test.ts` (portal 구현 전 실패 확인)
- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature10.reference-panel.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- portal 구현 전 테스트: failed, tooltip content가 trigger 내부에 렌더링되어 body portal 조건을 충족하지 않음
- left placement 호환 테스트: failed, 포털 전환 후 왼쪽 tooltip의 가로 변환이 누락됨
- 연관 Chat 테스트: passed, 3 test files and 34 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `npm run typecheck`: passed
- `./scripts/test.sh`: passed, 10 test files and 78 tests passed
- `./scripts/verify.sh`: passed, 10 test files and 78 tests passed

### Notes / Remaining Issues

- Radix/shadcn 의존성이 없는 프로젝트이므로 기존 공통 `BaseTooltip`에 Vue `Teleport`로 동일 목적을 구현했다.
- API, DB, 인증/인가 계약 변경은 없다.

## 2026-05-26 - feature10 UI 보정 (PreviewPageCard 본문 전용 표시)

### Scope

- 새 채팅 화면과 출처 hover 팝오버에서 재사용하는 `PreviewPageCard`의 상단 게시일/작성자 문구 제거
- 카드 안에는 sanitized body preview만 표시하고, 출처 목록의 작성자/작성일 metadata는 유지

### Test Cases

- 새 채팅 화면의 preview card에 게시일/작성자 문구가 표시되지 않는다.
- 출처 hover preview card에 게시일/작성자 문구가 표시되지 않는다.
- preview card body는 별도 상단 metadata 간격 없이 렌더링된다.

### Changed Files

- `src/features/chat/PreviewPageCard.vue`: 상단 metadata 렌더링 및 포맷 helper 제거, body 상단 margin 제거
- `src/__tests__/feature8.chat-main.test.ts`: 새 채팅 preview 본문 전용 표시 회귀 테스트 반영
- `src/__tests__/feature10.reference-panel.test.ts`: 출처 hover preview 본문 전용 표시 회귀 테스트 반영
- `docs/ai/working-log.md`: UI 보정 기록

### Commands

- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature10.reference-panel.test.ts` (구현 전 실패 확인)
- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature10.reference-panel.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 관련 테스트: failed, PreviewPageCard가 상단 게시일/작성자 문구와 body margin을 렌더링함
- 관련 preview 테스트: passed, 2 test files and 19 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `npm run typecheck`: passed
- `./scripts/test.sh`: passed, 10 test files and 78 tests passed
- `./scripts/verify.sh`: passed, 10 test files and 78 tests passed

### Notes / Remaining Issues

- 출처 목록 item의 작성자/작성일 표시는 변경하지 않았다.
- API, DB, 인증/인가 계약 변경은 없다.

## 2026-05-26 - feature10 UI 보정 (출처 keyword highlight 제거)

### Scope

- 출처 목록의 질문 문자열 단순 일치 highlight(`<mark>`) 제거
- `ReferencePanel`의 `keyword` prop 및 `ChatPage`의 전달 상태 제거
- 실제 검색 근거 강조는 backend/RAG snippet 또는 highlight metadata 계약 확정 후 별도 범위로 검토

### Test Cases

- 출처 목록은 제목/경로/작성자/작성일을 표시하되 `<mark>` highlight markup을 렌더링하지 않는다.
- 출처 hover preview, 새 채팅 패널 초기화, Chat 기본/대화 화면 회귀가 유지된다.

### Changed Files

- `src/features/chat/ReferencePanel.vue`: keyword prop/helper 및 `<mark>` 분기 제거
- `src/pages/ChatPage.vue`: `referenceKeyword` 상태와 패널 전달 제거
- `src/__tests__/feature10.reference-panel.test.ts`: 단순 highlight 미노출 회귀 테스트 반영
- `docs/ai/current-plan.md`: feature10 highlight 완료 항목 제거
- `docs/ai/working-log.md`: UI 보정 기록

### Commands

- `npm test -- src/__tests__/feature10.reference-panel.test.ts` (구현 전 실패 확인)
- `npm test -- src/__tests__/feature10.reference-panel.test.ts src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 관련 테스트: failed, `keyword` prop과 `highlightSegments()`가 여전히 필수이며 목록이 highlight markup을 렌더링함
- 연관 Chat 테스트: passed, 3 test files and 34 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `npm run typecheck`: passed
- `./scripts/test.sh`: passed, 10 test files and 78 tests passed
- `./scripts/verify.sh`: passed, 10 test files and 78 tests passed

### Notes / Remaining Issues

- 출처 목록의 title/path/작성자/작성일 및 hover preview 동작은 유지한다.
- API response 계약은 변경하지 않았으며, 실제 highlight metadata를 도입할 때만 API 명세 갱신을 검토한다.

## 2026-06-01 - feature10.1 케밥 아이콘 메뉴 컴포넌트

### Scope

- 최근 채팅 리스트와 채팅 헤더에서 공유하는 대화 케밥 메뉴 컴포넌트 구현
- 메뉴 열림/닫힘, ESC 닫힘, 외부 클릭 닫힘, open 시 첫 menuitem 포커스 이동 구현
- 고정/이름 변경/삭제 액션을 기존 `updateConversationTitle`, `deleteConversation` API 함수로 연결
- 기존 별도 모달/다이얼로그 패턴이 없어 이름 변경은 `window.prompt`, 삭제 확인은 `window.confirm`으로 최소 적용

### Test Cases

- 최근 채팅 row hover 전/후 케밥 버튼 표시와 메뉴 open 유지 동작을 검증한다.
- 최근 채팅과 헤더 메뉴가 동일한 `ConversationActionMenu` 컴포넌트 계약과 menuitem 구성을 공유한다.
- 메뉴 open 시 첫 menuitem으로 포커스가 이동하고 ESC/외부 클릭으로 닫힌다.
- 고정, 이름 변경, 삭제 액션이 기존 API 함수 시그니처에 맞는 PATCH/DELETE 요청을 보내고 UI를 갱신한다.

### Changed Files

- `src/__tests__/feature10.1.conversation-menu.test.ts`: feature10.1 메뉴 표시/접근성/API 액션 회귀 테스트 추가
- `src/features/chat/ConversationActionMenu.vue`: 공유 케밥 메뉴 컴포넌트 추가
- `src/pages/ChatPage.vue`: 최근 채팅/헤더 메뉴 연결 및 기존 API 액션 처리 추가
- `docs/ai/current-plan.md`: feature10.1 완료 항목 체크
- `docs/ai/working-log.md`: 변경 범위와 검증 결과 기록

### Commands

- `npm run test -- src/__tests__/feature10.1.conversation-menu.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature10.1.conversation-menu.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 테스트: failed, 최근 채팅 row/menu 식별자와 메뉴 컴포넌트 및 액션 연결이 존재하지 않음
- 신규 feature10.1 테스트: passed, 1 test file and 4 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 11 test files and 82 tests passed
- `./scripts/verify.sh`: passed, 11 test files and 82 tests passed

### Notes / Remaining Issues

- Public API와 기존 API 함수 시그니처는 변경하지 않았다.
- API, DB, 인증/인가 계약 변경은 없다.
- `feature10.5` 이후 항목은 수정하지 않았다.

## 2026-06-01 - feature10.1 회귀 수정 (고정 채팅 메뉴 표시)

### Scope

- 고정 채팅 리스트 row에도 최근 채팅과 동일한 케밥 메뉴 trigger와 action menu 연결
- 고정 채팅 hover/open 상태가 메뉴 표시와 충돌하지 않도록 회귀 테스트 추가

### Test Cases

- 고정 채팅 row hover 전에는 케밥 버튼이 표시되지 않는다.
- 고정 채팅 row hover 후 케밥 메뉴를 열면 `고정 해제`, `이름 변경`, `삭제` 항목이 표시된다.
- 메뉴 open 상태에서는 hover가 해제되어도 trigger와 menu가 유지된다.

### Changed Files

- `src/__tests__/feature10.1.conversation-menu.test.ts`: 고정 채팅 케밥 메뉴 회귀 테스트 추가
- `src/pages/ChatPage.vue`: 고정 채팅 리스트 row에 `ConversationActionMenu` 연결
- `docs/ai/working-log.md`: 회귀 수정 기록

### Commands

- `npm run test -- src/__tests__/feature10.1.conversation-menu.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature10.1.conversation-menu.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 테스트: failed, 고정 채팅 row에 메뉴 test id와 trigger가 존재하지 않음
- feature10.1 테스트: passed, 1 test file and 5 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 11 test files and 83 tests passed
- `./scripts/verify.sh`: passed, 11 test files and 83 tests passed

### Follow-up Note

- 고정 채팅과 최근 채팅 row가 `ConversationActionMenu`를 공유하지만, hover/open wrapper와 row button markup은 `ChatPage.vue`에 중복되어 있다.
- `feature10.5`의 ChatPage 책임 분리 시 `ConversationListItem` 또는 동등한 row 컴포넌트로 추출하면 고정/최근 목록이 같은 row 계약을 재사용할 수 있다.
- `ConversationActionMenu`는 메뉴 trigger와 menuitem 렌더링에 집중시키고, row hover/open 유지와 선택 버튼 배치는 row 컴포넌트가 담당하는 구조가 더 적절하다.

## 2026-06-01 - feature10.4 SSE 임시 assistant bubble 정책 확인

### Scope

- `done` 수신 전까지 스트리밍 중인 답변을 임시 assistant bubble로 표시하는 현재 FE 정책 확인
- 사용자가 질문을 보내면 `msg-local-assistant-*` 메시지를 먼저 추가하고, `done.messageId` 수신 시 backend message ID로 교체하는 흐름 확인

### Decision

- `done` 수신 전에도 임시 assistant bubble을 표시한다.
- 임시 bubble은 streaming status/spinner와 수신된 token 누적 답변을 보여주는 단일 UI 자리로 사용한다.
- `done` 수신 후에는 같은 메시지의 `messageId`를 backend가 반환한 실제 assistant message ID로 교체한다.

### Evidence

- `src/stores/chat.ts`: `streamMessage()`가 local user message와 local assistant placeholder를 먼저 active messages에 추가한다.
- `src/stores/chat.ts`: `applySseEvent()`의 `done` branch가 `event.data.messageId`로 placeholder ID를 교체한다.
- `src/features/chat/MessageBubble.vue`: streaming assistant message에 spinner/status를 렌더링한다.
- `src/__tests__/feature9.chat-conversation.test.ts`: 빈 assistant placeholder가 streaming 중 loading spinner로 표시되는 동작을 검증한다.

### Commands

- 실행하지 않음. 이번 항목은 기존 구현과 테스트 근거를 확인하는 정책 확정 작업이다.

## 2026-06-01 - feature10.4 SSE error partial token 폐기 정책 확인

### Scope

- `error` 수신 전 이미 append된 partial token을 화면에 남길지/버릴지 정책 확정
- partial token 이후 backend `error` 이벤트가 오는 상황을 회귀 테스트로 고정

### Decision

- `error` 수신 시 partial token은 버린다.
- assistant bubble은 partial 답변 대신 backend가 내려준 error message만 표시한다.
- 이 정책은 `docs/api-spec.md`의 "`error` 로 종료되면 assistant 메시지는 저장하지 않는다" 계약에 맞춘다.

### Logic

- `token` 이벤트 수신 시 `src/stores/chat.ts`의 `applySseEvent()`가 현재 assistant placeholder의 `content` 뒤에 `event.data.content`를 append한다.
- 이후 `error` 이벤트를 수신하면 같은 `applySseEvent()`의 `error` branch가 `phase: 'error'`, `error: event.data.message`, `content: event.data.message`로 메시지를 갱신한다.
- 이때 `content`를 기존 content에 append하지 않고 오류 문구로 대체하므로, 이전 partial token은 화면 상태에서 제거된다.
- `streamMessage()`는 `error` 이벤트 처리 직후 예외를 던지고, `finally`에서 streaming 상태를 종료한다.

### Changed Files

- `src/__tests__/feature9.chat-sse-store.test.ts`: token 일부 수신 후 `error`로 종료될 때 partial 답변이 남지 않는 회귀 테스트 추가
- `docs/ai/working-log.md`: error partial token 폐기 정책과 동작 로직 기록

### Commands

- `npm run test -- src/__tests__/feature9.chat-sse-store.test.ts`

### Results

- passed, 1 test file and 7 tests passed

## 2026-06-02 - Frontend API v2.3.0 정합화

### Scope

- `docs/api-spec.md` v2.3.0 기준으로 Frontend 정의서와 실제 FE 타입/목 데이터를 대조
- 메시지 `role` 값 체계를 API 명세의 `user` / `assistant` lowercase로 정합화
- API v2.3.0에서 제거된 conversation `messageCount`를 FE 타입/목 데이터/로컬 생성 흐름에서 제거
- 별도 FE-facing 검색 API가 없고, 자연어 검색/질의는 Chat SSE API로 수행한다는 내용을 Frontend 정의서에 명시

### Changed Files

- `FRONTEND_SPEC.md`: API v2.3.0 기준 Frontend 정의서 생성
- `src/types/api.ts`: `MessageRole` lowercase 반영 및 `Conversation.messageCount` 제거
- `src/stores/chat.ts`: local user/assistant message role을 lowercase로 생성
- `src/features/chat/MessageBubble.vue`: 메시지 role 분기 조건을 lowercase로 변경
- `src/pages/ChatPage.vue`: assistant message 탐색 조건 lowercase 반영 및 신규 대화 local `messageCount` 제거
- `src/mocks/data.ts`: mock conversation/message payload를 API v2.3.0에 맞게 정리
- `src/__tests__/feature5.api-client.test.ts`: API 타입 계약 테스트 갱신
- `src/__tests__/feature6.mock-api.test.ts`: mock API response 계약 테스트 갱신
- `src/__tests__/feature9.chat-sse-store.test.ts`: SSE store role 기대값 갱신
- `src/__tests__/feature9.chat-conversation.test.ts`: MessageBubble role fixture 갱신

### Commands

- `npm run test -- src/__tests__/feature5.api-client.test.ts src/__tests__/feature6.mock-api.test.ts src/__tests__/feature9.chat-sse-store.test.ts src/__tests__/feature9.chat-conversation.test.ts` (구현 전 실패 확인)
- `npm run typecheck`
- `npm run test -- src/__tests__/feature5.api-client.test.ts src/__tests__/feature6.mock-api.test.ts src/__tests__/feature9.chat-sse-store.test.ts src/__tests__/feature9.chat-conversation.test.ts`

### Results

- 구현 전 테스트: failed, 기존 FE가 `USER` / `ASSISTANT` uppercase role을 생성/렌더링하고 mock response도 uppercase를 반환함
- 관련 테스트: passed, 4 test files and 40 tests passed
- `npm run typecheck`: passed

### Notes / Remaining Issues

- 인증 token 저장/Authorization header 자동 주입, auth refresh/logout API 구현은 feature13 범위로 남긴다.
- 관리자 대시보드 API 구현은 현재 화면 feature 범위 밖이며, `FRONTEND_SPEC.md`에 API spec 기준 범위만 명시했다.

## 2026-06-02 - SSE terminal event reader cancel 처리

### Scope

- API spec의 `done` / `error` terminal event 수신 후 클라이언트가 스트림을 종료하는 계약을 FE reader 동작에 반영
- 서버가 `done` 또는 `error` 이벤트 이후 stream을 닫지 않아도 FE가 직접 `reader.cancel()`로 읽기를 중단하도록 구현

### Changed Files

- `src/composables/useSSE.ts`: 완성된 SSE frame 파싱 결과에 terminal event 여부를 반환하고, `done` 수신 시 `reader.cancel()` 후 정상 완료 처리
- `src/composables/useSSE.ts`: `error` 이벤트 처리 중 store callback이 예외를 던지는 경우에도 reader를 cancel한 뒤 예외를 전파
- `src/__tests__/feature9.chat-sse-store.test.ts`: 서버가 stream을 닫지 않는 `done` / `error` 응답에서도 reader cancel과 상태 정리가 되는 회귀 테스트 추가
- `docs/ai/working-log.md`: 구현 내용과 검증 결과 기록

### Commands

- `npm run test -- src/__tests__/feature9.chat-sse-store.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature9.chat-sse-store.test.ts`

### Results

- 구현 전 테스트: failed, `done` 이후 stream이 열린 채로 남으면 테스트가 timeout되고 `error` 이후에도 reader cancel이 호출되지 않음
- feature9 SSE store 테스트: passed, 1 test file and 9 tests passed

## 2026-06-02 - feature10.4 assistant feedback comment modal

### Scope

- assistant 답변의 thumbs up/down 선택 시 피드백 사유와 optional comment를 입력하는 모달 표시
- 선택 사유와 세부 comment를 하나의 `comment` 문자열로 구성해 기존 `submitMessageFeedback(messageId, { rating, comment })` API 함수로 전송
- API 함수 시그니처와 feedback endpoint 계약은 변경하지 않음

### Test Cases

- assistant thumbs down 클릭 시 피드백 모달이 열린다.
- 사유를 선택하기 전에는 제출 버튼이 비활성화된다.
- 사유와 comment를 입력하고 제출하면 `POST /api/messages/{messageId}/feedback`에 `DISLIKE`와 조합된 comment가 전송된다.
- 제출 성공 후 모달이 닫힌다.

### Changed Files

- `docs/ai/current-plan.md`: feature10.4 피드백 모달 항목 추가 및 완료 체크
- `src/features/chat/FeedbackModal.vue`: 피드백 사유/comment 입력 모달 추가
- `src/features/chat/MessageBubble.vue`: thumbs up/down 클릭 시 feedback rating 이벤트 emit
- `src/features/chat/ChatConversationView.vue`: feedback 이벤트를 ChatPage로 전달
- `src/pages/ChatPage.vue`: 모달 상태, close/submit 처리, `submitMessageFeedback` API 연결
- `src/__tests__/feature9.chat-conversation.test.ts`: feedback modal open/submit 회귀 테스트 추가
- `docs/ai/working-log.md`: 작업 범위와 검증 결과 기록

### Commands

- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 테스트: failed, thumbs down 클릭 후 `feedback-modal`이 렌더링되지 않음
- feature9 chat conversation 테스트: passed, 1 test file and 16 tests passed
- `npm run typecheck`: passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 11 test files and 87 tests passed
- `./scripts/verify.sh`: passed, 11 test files and 87 tests passed

### Notes / Remaining Issues

- 현재 모달은 선택 사유를 필수로 하고 세부 comment는 선택으로 둔다.
- API가 별도 reason 필드를 제공하지 않으므로 `[사유] 세부내용` 형식의 comment 문자열로 전송한다.

## 2026-06-02 - feature10.4 feedback modal submit condition 보정

### Scope

- 피드백 API payload가 `rating`과 `comment`만 받는 구조에 맞춰 모달 제출 조건 조정
- 사유 선택 없이 공유 세부 정보만 입력해도 제출 가능하도록 변경
- 사유와 공유 세부 정보가 모두 있으면 기존처럼 `[사유] 세부내용` 형식으로 전송

### Changed Files

- `src/features/chat/FeedbackModal.vue`: 제출 가능 조건과 comment 조합 로직 수정
- `src/__tests__/feature9.chat-conversation.test.ts`: 공유 세부 정보만 입력한 경우 제출 가능 및 API payload 검증 테스트 추가
- `docs/ai/working-log.md`: 변경 내용과 검증 결과 기록

### Commands

- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 테스트: failed, 공유 세부 정보만 입력하면 제출 버튼이 비활성 상태로 유지됨
- feature9 chat conversation 테스트: passed, 1 test file and 17 tests passed
- `npm run typecheck`: passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 11 test files and 88 tests passed

## 2026-06-02 - feature10.4 conversation search modal

### Scope

- `docs/F-api-spec.md`의 `GET /api/conversations/search` 계약을 기준으로 Chat 대화 검색 모달 구현
- 사이드바 `채팅 검색` 진입점에서 모달을 열고, 검색 결과 클릭 시 해당 conversation route로 이동
- 검색어는 trim 후 2~50자만 API 호출하며, 위반 시 클라이언트 안내 표시
- `matchedMessages[].snippet`과 `matchPositions`를 plain text 기반으로 렌더링하고 FE에서 직접 하이라이트 처리

### Test Cases

- `searchConversations`가 `/api/conversations/search?q=...&page=0&size=20`로 요청한다.
- 검색 모달에서 1자 검색어는 API 호출 없이 validation message를 표시한다.
- 정상 검색 결과는 대화 제목, 매칭 메시지, 하이라이트를 표시한다.
- 검색 결과 클릭 시 모달을 닫고 해당 conversation route로 이동한다.
- 빈 결과와 API 실패 상태를 각각 표시한다.

### Changed Files

- `docs/ai/current-plan.md`: feature10.4 검색 모달 체크리스트 추가 및 완료 체크
- `src/types/api.ts`: 대화 검색 요청/응답 타입 추가
- `src/api/index.ts`: `searchConversations` API 함수 추가
- `src/features/chat/ConversationSearchModal.vue`: 검색 모달, validation, 결과/empty/error/loading UI, matchPositions 하이라이트 구현
- `src/pages/ChatPage.vue`: 검색 모달 open/close 상태와 결과 선택 route 이동 연결
- `src/mocks/data.ts`: 대화 검색 mock response 추가
- `src/mocks/handlers.ts`: `GET /api/conversations/search` mock handler 추가
- `src/__tests__/feature5.api-client.test.ts`: 검색 API 함수 요청/응답 테스트 추가
- `src/__tests__/feature9.chat-conversation.test.ts`: 검색 모달 통합 회귀 테스트 추가
- `docs/ai/working-log.md`: 작업 범위와 검증 결과 기록

### Commands

- `npm run test -- src/__tests__/feature5.api-client.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature5.api-client.test.ts`
- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 API 테스트: failed, `searchConversations is not a function`
- 구현 전 모달 테스트: failed, 검색 모달/검색 연결이 없어 `conversation-search-modal` 관련 UI를 찾지 못함
- feature5 API 테스트: passed, 1 test file and 8 tests passed
- feature9 chat conversation 테스트: passed, 1 test file and 20 tests passed
- `npm run typecheck`: passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 11 test files and 92 tests passed
- `./scripts/verify.sh`: passed, 11 test files and 92 tests passed
- `./scripts/verify.sh`: passed, 11 test files and 88 tests passed

## 2026-06-02 - feature10.4 feedback modal close focus border 보정

### Scope

- 피드백 모달 닫기 버튼 hover/focus-visible 상태에서 주황색 테두리가 보이도록 스타일 보정

### Changed Files

- `src/features/chat/FeedbackModal.vue`: 닫기 버튼에 `hover:border-status-error`, `focus-visible:border-status-error` 클래스 추가
- `src/__tests__/feature9.chat-conversation.test.ts`: 닫기 버튼 hover/focus border 클래스 회귀 테스트 추가
- `docs/ai/working-log.md`: 변경 내용과 검증 결과 기록

### Commands

- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`

### Results

- 구현 전 테스트: failed, 닫기 버튼에 hover/focus-visible 주황색 border 클래스가 없음
- feature9 chat conversation 테스트: passed, 1 test file and 17 tests passed
- `npm run typecheck`: passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 11 test files and 88 tests passed

## 2026-06-04 - feature10.4 collapsed sidebar conversation popover

### Scope

- 접힌 사이드바의 `채팅 목록` 아이콘 클릭 시 아이콘 오른쪽에 작은 최근 채팅 팝오버 표시
- 기존 `/api/conversations`로 로드한 conversation 목록을 재사용하고, 최대 10개까지만 렌더링
- 팝오버 항목 클릭 시 해당 conversation route로 이동하고 팝오버 닫힘

### Test Cases

- 접힌 사이드바의 `채팅 목록` 버튼 클릭 시 최근 채팅 팝오버가 표시된다.
- conversation 목록이 12개여도 팝오버에는 최대 10개만 표시된다.
- 팝오버 항목 클릭 시 `/chat/{conversationId}`로 이동하고 팝오버가 닫힌다.

### Changed Files

- `docs/ai/current-plan.md`: feature10.4 팝오버 항목 추가 및 완료 체크
- `src/pages/ChatPage.vue`: 접힌 사이드바 최근 채팅 팝오버 상태, 렌더링, 외부 클릭/ESC 닫힘 처리 추가
- `src/__tests__/feature9.chat-conversation.test.ts`: 팝오버 표시, 10개 제한, 항목 선택 route 이동 회귀 테스트 추가
- `docs/ai/working-log.md`: 작업 범위와 검증 결과 기록

### Commands

- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 구현 전 테스트: failed, `collapsed-conversation-popover` UI가 없음
- feature9 chat conversation 테스트: passed, 1 test file and 22 tests passed
- `npm run typecheck`: passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 11 test files and 94 tests passed
- `./scripts/verify.sh`: passed, 11 test files and 94 tests passed

## 2026-06-04 - api-spec v2.4.0 FE contract alignment

### Scope

- `docs/api-spec.md` v2.4.0 기준으로 FE 타입/API 호출/목업 응답을 대조
- LINA API 표면에서 제거된 `spaceKey`, 구버전 preview query `page_id`, 제거된 `messageCount`가 런타임 코드에 남아 있는지 확인
- `GET /api/conversations` query parameter는 명세상 `page`/`size`만 지원하므로 FE 타입에서 임의 `query` 파라미터 제거

### Changed Files

- `src/types/api.ts`: `ListConversationsParams.query` 제거
- `src/__tests__/feature5.api-client.test.ts`: 대화 목록 조회 params가 `page`/`size`만 허용됨을 타입 회귀 테스트로 고정
- `docs/ai/current-plan.md`: Confluence preview query 표기를 현재 명세의 `pageId`로 정정
- `docs/ai/working-log.md`: 대조 결과와 검증 결과 기록

### Commands

- `npm run typecheck` (구현 전 실패 확인)
- `npm run typecheck`
- `npm run test -- src/__tests__/feature5.api-client.test.ts`

### Results

- 구현 전 typecheck: failed, `ListConversationsParams.query`가 허용되어 `@ts-expect-error`가 unused 처리됨
- `npm run typecheck`: passed
- feature5 API 테스트: passed, 1 test file and 8 tests passed
- `spaceKey`, `page_id`, `messageCount` 런타임 코드 잔존 없음

## 2026-06-04 - collapsed sidebar chat popover routing fix

### Scope

- 접힌 사이드바의 채팅 목록 팝오버에서 conversation item 클릭 시 팝오버만 닫히고 `/chat/{conversationId}`로 이동하지 않는 회귀 수정
- expanded sidebar의 기존 conversation 선택 동작은 유지
- 기존 route path, store action signature, conversation loading 로직은 변경하지 않음

### Cause

- collapsed popover item 선택이 `click` 이벤트에 의존하고 있었고, popover dismiss/DOM 변경 타이밍 때문에 item click이 route 이동까지 안정적으로 도달하지 못했다.
- 이전 수정에서도 handler 내부 순서는 `router.push` 이후 popover close였지만, 그 handler 자체가 `click` 이벤트에 묶여 있었다. `pointerdown` 이후 `click` 전에 popover가 닫히거나 item이 이벤트 대상에서 벗어나면 click handler가 실행되지 않아 `router.push`까지 도달하지 못했다.
- 네이티브 anchor `href`에서도 이동이 발생하지 않아, 실제 navigation 로직을 `click`보다 빠른 pointer/mouse down 단계에서 실행해야 하는 문제로 판단했다.
- 사용자가 확인한 브라우저 로그에서 `pointerdown` handler, `router.push`, route change, message history API 요청이 모두 실행되는 것을 확인했다.

### Changed Files

- `src/features/chat/ChatSidebar.vue`: collapsed popover item을 `RouterLink custom` anchor로 렌더링하고, `pointerdown`/`mousedown` 단계에서 `router.push`를 먼저 실행하도록 변경. popover 닫힘은 route change watcher로 분리하고, popover stacking context를 보정
- `src/__tests__/feature9.chat-conversation.test.ts`: collapsed popover item의 `pointerdown`/`mousedown` 라우팅, route change 후 close, outside click close 회귀 테스트 추가
- `docs/ai/working-log.md`: 원인과 수정 내용, 검증 결과 기록

### Commands

- `npm run test -- src/__tests__/feature9.chat-conversation.test.ts`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- feature9 chat conversation 테스트: passed, 1 test file and 25 tests passed
- `npm run typecheck`: passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 12 test files and 100 tests passed
- `./scripts/verify.sh`: passed, 12 test files and 100 tests passed
- 임시 디버그 로그 제거 확인: `ChatSidebar.vue`에 `collapsed popover debug`/`console.log` 잔존 없음

## 2026-06-04 - feature10.5: ChatPage 책임 분리 리팩토링

### Scope

- `ChatPage.vue`를 route/page shell 조립 중심으로 축소
- sidebar 렌더링과 열림/닫힘 UI 상태를 `ChatSidebar.vue`로 분리
- empty/conversation header 분기를 `ChatHeader.vue`로 분리
- 새 대화 생성, route fallback, SSE submit, 실패 toast 흐름을 `useChatSubmission`으로 분리
- route watcher, 메시지 이력 로딩, active conversation clear 처리를 `useChatRouteSync`로 분리

### Test Cases

- `ChatPage`가 `ChatSidebar`와 `ChatHeader`를 조립하고 기존 collapsed sidebar/header DOM 계약을 유지한다.
- submission/route sync 책임이 composable로 분리되어 있고 `ChatPage.vue`가 직접 `createConversation`/message history loading을 소유하지 않는다.
- 새 대화 fallback 후 `/api/conversations/{conversationId}/chat` SSE submit과 token 누적 표시가 유지된다.
- 기존 feature8/feature9/feature10/feature10.1 채팅 회귀 테스트가 그대로 통과한다.

### Changed Files

- `src/pages/ChatPage.vue`: page shell 조립 중심으로 축소
- `src/features/chat/ChatSidebar.vue`: sidebar UI와 접힌 최근 대화 팝오버 상태 분리
- `src/features/chat/ChatHeader.vue`: header 분기와 profile affordance 분리
- `src/composables/useChatSubmission.ts`: message submit 흐름 분리
- `src/composables/useChatRouteSync.ts`: route sync 흐름 분리
- `src/__tests__/feature10.5.chat-page-refactor.test.ts`: feature10.5 책임 분리 회귀 테스트 추가
- `docs/ai/current-plan.md`: feature10.5 완료 체크 처리
- `docs/ai/working-log.md`: 작업 결과 기록

### Commands

- `npm test -- src/__tests__/feature10.5.chat-page-refactor.test.ts` 실패 확인
- `npm test -- src/__tests__/feature10.5.chat-page-refactor.test.ts`
- `npm test -- src/__tests__/feature8.chat-main.test.ts src/__tests__/feature9.chat-conversation.test.ts src/__tests__/feature9.chat-sse-store.test.ts src/__tests__/feature10.reference-panel.test.ts src/__tests__/feature10.1.conversation-menu.test.ts`

### Results

- 최초 feature10.5 테스트: failed, `ChatHeader.vue` 미존재로 실패 확인
- feature10.5 테스트: passed, 3 tests passed
- 기존 chat 회귀 테스트: passed, 5 test files and 55 tests passed

### Notes / Remaining Issues

- Public API, SSE 이벤트 계약, store action signature는 변경하지 않음.
- UI 동작 변경 목적이 아닌 책임 분리 리팩토링이며 feature11 이후 항목은 수정하지 않음.

## 2026-06-04 - feature11 backend readiness hold

### Decision

- Chat BFF 실제 응답, SSE, feedback API 연결 검증 환경이 아직 준비되지 않아 feature11을 보류한다.
- 백엔드 의존이 낮은 feature12 Auth / Login + Role Selection 화면 구현과 라우팅 mock 범위를 선행한다.
- feature11 완료 체크는 하지 않고, backend readiness 확인 후 재개한다.

### Scope Impact

- Chat API/SSE/feedback 실제 연결 코드는 이번 결정에서 변경하지 않는다.
- feature12는 인증 API 미확정 항목을 mock 또는 placeholder 경계 안에 격리해서 진행한다.
- 최종 인증/인가 판단은 feature13에서 `GET /api/users/me`와 BFF 인증 계약을 기준으로 연결한다.

## 2026-06-05 - chat streaming stop UI deferred

### Scope

- `docs/api-spec.md`에 chat SSE streaming 중 별도 cancel POST API가 정의되어 있지 않음을 기준으로, 사용자에게 노출되던 streaming stop icon과 cancel action을 후속 구현 범위로 보류
- 기존 `POST /api/conversations/{conversationId}/chat` SSE 계약과 store 내부 AbortController 기반 처리 자체는 변경하지 않음
- 별도 cancel API 또는 BFF/RAG downstream 취소 전파 정책이 확정되면 feature11.5에서 stop UI와 사용자 중단 기능을 다시 구현

### Changed Files

- `src/features/chat/MessageInput.vue`: streaming 중에도 stop icon으로 전환하지 않고 send button disabled 상태를 유지하도록 변경
- `src/pages/ChatPage.vue`: MessageInput의 cancel event 연결 제거
- `src/composables/useChatSubmission.ts`: UI에서 사용하지 않는 cancel handler 반환 제거
- `src/__tests__/feature8.chat-main.test.ts`: streaming 중 stop action 대신 send disabled 상태를 검증하도록 회귀 테스트 수정
- `docs/ai/current-plan.md`: feature11.5에 stop icon/사용자 중단 기능을 backend 취소 정책 확정 후 구현한다고 명시
- `docs/ai/working-log.md`: 변경 사유와 검증 결과 기록

### Commands

- `npm run test -- src/__tests__/feature8.chat-main.test.ts` (구현 전 실패 확인)
- `npm run test -- src/__tests__/feature8.chat-main.test.ts`
- `npm run typecheck`

### Results

- 구현 전 테스트: failed, streaming 중 버튼 label이 `응답 중단`으로 남아 있음
- feature8 chat main 테스트: passed, 1 test file and 14 tests passed
- `npm run typecheck`: passed

## 2026-06-05 - feature12: Auth / Login + Role Selection 화면 구현

### Scope

- SCR-100 LandingPage와 SCR-200 LoginPage를 Auth 진입 흐름으로 추가
- 서비스 루트(`/`)는 `/login`으로 redirect하고, LandingPage는 라우팅 대상에 추가하지 않은 채 CTA 동작만 유지하며, Login CTA는 즉시 OAuth를 시작하지 않고 역할 선택 UI를 표시
- 일반 사용자 선택은 `/api/auth/login?returnTo=/chat`, 관리자 선택은 `/api/auth/login?mode=admin&returnTo=/admin` 계약과 맞는 mock 경계로 구성
- feature12 범위에서 accessToken/refreshToken 저장, refresh, logout, 실제 인증 API 호출은 구현하지 않음
- Onboarding(SCR-300~310)은 route/page/component 구현 대상에서 제외

### Test Cases

- `/`는 `/login`으로 redirect하고, `/login` Auth 진입 route가 LoginPage에 연결되며 `/landing` 및 onboarding route가 존재하지 않는다.
- LandingPage의 `Continue with Confluence` CTA가 onboarding이 아니라 LoginPage로 이동한다.
- LoginPage의 `Continue with Confluence` CTA는 OAuth URL 없이 역할 선택 UI만 연다.
- 사용자/관리자 역할 버튼은 향후 OAuth URL과 returnTo를 준비하고 mock 흐름에서 각각 `/chat`, `/admin`으로 이동한다.

### Changed Files

- `src/__tests__/feature12.auth-login-role-selection.test.ts`: feature12 실패 우선 테스트 추가
- `src/features/auth/authIntent.ts`, `src/features/auth/index.ts`: 역할별 auth intent와 예정 OAuth URL 정의
- `src/pages/LandingPage.vue`: SCR-100 Landing 화면 및 Login 진입 CTA 추가
- `src/pages/LoginPage.vue`: SCR-200 Login CTA와 사용자/관리자 역할 선택 UI 추가
- `src/pages/AdminEntryPage.vue`: feature12 mock 관리자 진입용 placeholder route 추가
- `src/router/index.ts`: `/` to `/login` redirect, `/login`, `/admin` route 추가
- `src/pages/index.ts`: 신규 Auth page export 추가
- `src/shared/assets.ts`: Confluence icon asset export 추가
- `src/shared/index.ts`: Auth page에서 사용하는 shared asset barrel export 추가
- `docs/ai/current-plan.md`: feature12 완료 체크 처리
- `docs/ai/working-log.md`: 작업 결과 기록

### Commands

- `npm test -- --run src/__tests__/feature12.auth-login-role-selection.test.ts` 실패 확인
- `npm test -- --run src/__tests__/feature12.auth-login-role-selection.test.ts`
- `./scripts/test.sh`
- `./scripts/lint.sh`
- `./scripts/format.sh`
- `./scripts/verify.sh`
- `npm run typecheck`

### Results

- 최초 feature12 테스트: failed, Auth intent/page 모듈 미존재로 실패 확인
- feature12 테스트: passed, 4 tests passed
- `./scripts/test.sh`: passed, 13 test files and 104 tests passed
- `./scripts/lint.sh`: passed
- `./scripts/format.sh`: passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: passed

### Notes / Remaining Issues

- `/admin`은 feature12 역할 선택 mock 흐름을 위한 placeholder이며, SCR-800 Admin shell 구현은 feature15 범위로 유지한다.
- 실제 `/api/auth/login`, OAuth callback, `GET /api/users/me`, 토큰 저장/갱신/로그아웃 처리는 feature13 범위로 남긴다.
- API, DB, 인증/인가 명세는 변경하지 않음.

## 2026-06-08 - refactor: feature12 Landing/Login 디자인 정리

- `/` 랜딩을 3패널 스크롤 구조로 정리하고, 첫 화면에 큐트 LINA 로고와 장식용 지식 그래프 배경을 배치했다.
- 랜딩 acronym 텍스트(`INKED / INTELLIGENCE / AVIGATION / GENT`)에 순차 rise animation을 적용하고, `INKED` 위치를 로고 안쪽으로 조정했다.
- `/login`은 중간 Confluence CTA 없이 일반 사용자/관리자 역할 카드 2개를 즉시 표시하도록 정리했다.
- 역할 카드에 `lina-user.png`, `lina-admin.png` 이미지를 적용하고 중앙 정렬, rise animation, hover lift/primary border 효과를 추가했다.
- 관리자 카드에는 권한 확인 note와 작은 shield icon을 추가했다.
- 사용자/관리자 설명 문구를 서비스 톤으로 다듬고 `whitespace-pre-line`으로 의도한 줄바꿈이 보이게 했다.
- graph용 blue/sky/purple/indigo 디자인 토큰을 추가해 랜딩 그래프 색상을 토큰 기반으로 관리한다.

## 2026-06-08 - refactor: LandingPage 디자인 개선 (Ask 화살표 · 캐릭터 이미지 · 탭 안정성)

### Scope

- LandingPage Ask 탭 화살표 SVG를 직선에서 스웁 곡선으로 개선
- lina-ask / lina-search / lina-verify 캐릭터 이미지를 각 탭 텍스트 하단 우측에 배치
- 탭 전환 시 레이아웃 jitter 수정: 그리드에 min-height 고정, `items-start` 적용
- 탭 콘텐츠에 Vue `<Transition mode="out-in">` fade 애니메이션 추가
- 스냅 스크롤 컨테이너에 `scroll-smooth` 적용
- `src/shared/assets.ts`에 lina-ask / lina-search / lina-verify 이미지 export 추가

### Changed Files

- `src/pages/LandingPage.vue`: 화살표 SVG, 캐릭터 이미지 배치, 탭 Transition, scroll-smooth
- `src/shared/assets.ts`: linaAskImageUrl / linaSearchImageUrl / linaVerifyImageUrl export 추가

### Results

- 탭 전환 시 탭 바 Y 위치 고정 확인 (puppeteer 측정: 3탭 모두 235px STABLE)
- scroll-smooth로 snap 스크롤 전환 부드러움 개선

### Notes / Remaining Issues

- lina-verify.png는 흰 배경이 포함된 원본 파일이다. PNG 배경 제거 버전 파일로 교체 시 `mix-blend-darken` 클래스 제거 필요.

## 2026-06-09 - refactor: feature12 Landing/Login 인터랙션 정리

- `/login` 역할 카드의 rise animation을 내부 래퍼로 분리해, 페이지 진입 직후에도 hover impact가 즉시 보이도록 조정했다.
- 랜딩 `Verify` mockup을 상하 2박스 구조에서 고정 높이 `list / graph` 토글 구조로 정리하고 기본값을 `graph`로 맞췄다.
- 랜딩 `Ask` 섹션의 입력 박스와 화살표 위치를 여러 차례 조정해 겹침을 줄이고 시선 흐름을 정리했다.
- `Ask` 캐릭터 foot shadow 실험은 제거하고, 현재는 원본 이미지 그대로 사용한다.

## 2026-06-09 - feature14: Admin 기본 shell 및 데이터 수집 메인 보드 구현

### Scope

- `docs/ai/current-plan.md`의 feature14 요구사항을 기준으로 Admin 운영 메인 보드(SCR-800)만 구현
- `/admin`과 `/admin/operations`에서 동일한 Admin shell 진입 화면을 렌더링
- `GET /api/admin/data`, `GET /api/admin/sync` 응답 타입과 mock handler를 추가하고 보드 카드/최근 동기화 이력에 매핑
- `POST /api/admin/ingest`는 feature14 범위에서 placeholder 상태로 분리
- ADMIN 권한 확인, loading/error/empty/access denied 상태를 화면에 분리

### Test Cases

- `/admin`과 `/admin/operations`가 Admin 보드 entry에 연결된다.
- ADMIN 사용자는 Admin shell, 데이터 현황 카드, 최근 동기화 이력, ingest placeholder를 본다.
- 최근 동기화 이력이 비어 있으면 empty state를 표시한다.
- 현재 사용자가 `ADMIN`이 아니면 admin data/sync API 호출 없이 접근 차단 상태를 표시한다.
- admin data 요청이 실패하면 retry 가능한 error state를 표시하고 재시도 후 정상 보드로 복구된다.

### Changed Files

- `src/__tests__/feature14.admin-operations-board.test.ts`: feature14 전용 route/admin board/access guard 테스트 추가
- `src/pages/AdminEntryPage.vue`: placeholder를 실제 Admin shell, 운영 보드, 상태 분기 UI로 교체
- `src/router/index.ts`: `/admin/operations` route 추가
- `src/api/index.ts`: `getAdminDataOverview`, `getAdminSyncHistory` API 함수 추가
- `src/types/api.ts`: admin data overview / sync history 타입 추가
- `src/mocks/data.ts`, `src/mocks/handlers.ts`: admin data/sync mock payload와 handler 추가
- `docs/ai/current-plan.md`: feature14 완료 체크 처리
- `docs/ai/working-log.md`: feature14 작업 로그 기록

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts` 최초 실행: failed
- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `npm test`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts` 최초 실행: failed, `/admin/operations` route와 Admin 보드 UI/상태 분기 미구현 확인
- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`: passed
- `npm test`: passed, 14 files / 114 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed
- `./scripts/verify.sh`: passed

### Notes / Remaining Issues

- `POST /api/admin/ingest` 실제 연결은 feature14 요구사항에 따라 placeholder 상태로 남겨두었고, feature15 이후 범위는 수정하지 않음.
- 인증 백엔드 연결(feature13)이 아직 제외 상태이므로 Admin 접근 제어는 `GET /api/users/me` role 확인 기준으로만 동작한다.

## 2026-06-09 - follow-up: Admin 접근 차단 UI 및 인증 저장 전략 문서 정리

### Scope

- 비관리자 사용자가 `/admin`에 접근했을 때 보이는 차단 화면 UX를 보강
- `/admin` 운영 보드를 시안에 맞춰 화이트톤 중심으로 리디자인
- 인증 토큰 저장 전략 논의를 `frontend/docs` 문서로 정리

### Changed Files

- `src/pages/AdminEntryPage.vue`: 비관리자 차단 상태에 Login 복귀 버튼과 아이콘 추가, 해당 버튼만 볼드 제거, 운영 보드 타이포/레이아웃을 화이트톤 시안 방향으로 재조정
- `frontend/docs/auth-session-storage-plan.md`: `HttpOnly cookie` 미사용 전제, `Pinia + localStorage` 혼합 저장 전략, refresh 기반 세션 복원 플로우 문서화
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 5 tests passed

### Notes / Remaining Issues

- Admin 권한 판별은 여전히 `GET /api/users/me`의 `role` 값을 기준으로만 동작하며, 실제 토큰 저장/복원 구현은 feature13 범위다.
- 인증 저장 전략 문서는 현재 논의 결정사항을 기록한 것이며, 실제 store / refresh 구현 코드는 아직 포함하지 않는다.

## 2026-06-09 - follow-up: Admin 수집 버튼 역할 분리

### Scope

- Admin 운영 보드에서 `API 키 발급` 버튼과 `데이터 불러오기` 버튼의 역할을 분리
- `데이터 불러오기`는 관리자가 계속 사용하는 운영 버튼으로 `POST /api/admin/ingest`를 호출
- `API 키 발급`은 테스트/수동 검증용 `POST /api/admin/key/activate` 버튼으로 유지

### Changed Files

- `src/__tests__/feature14.admin-operations-board.test.ts`: key activate와 ingest 버튼의 분리된 동작 테스트 추가
- `src/types/api.ts`: admin key activate / ingest start 응답 타입 추가
- `src/api/index.ts`: `activateAdminKey`, `startAdminIngestJob` API 함수 추가
- `src/mocks/data.ts`, `src/mocks/handlers.ts`: admin key activate / ingest mock 응답과 handler 추가
- `src/pages/AdminEntryPage.vue`: 버튼 활성화, action loading state, 결과 안내 문구, ingest 단독 호출 로직 추가
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 7 tests passed

### Notes / Remaining Issues

- `데이터 불러오기` 버튼은 FE에서 `POST /api/admin/ingest`만 호출하고, Admin Key 자동 활성화는 API spec에 따라 서버 내부 처리에 맡긴다.
- 실제 수집 상태 polling(`GET /api/admin/ingest/status/{jobId}`)과 job progress UI는 아직 이번 범위에 포함하지 않았다.

## 2026-06-09 - follow-up: Admin 자동 key activation 예외 처리 및 수집 상태 시연 UI

### Scope

- `데이터 불러오기` 버튼 클릭 시, Admin Key가 아직 없거나 만료된 경우 FE에서 먼저 key activation을 시도한 뒤 ingest로 이어가도록 예외 처리 추가
- 수동 `API 키 발급` 이후에는 동일 세션에서 중복 발급 없이 ingest만 진행되도록 로컬 활성 시각 기준 분기 추가
- 시연용으로 `STARTED`, `IN_PROGRESS`, `COMPLETED` 상태 예시 HTML 3개를 운영 보드에 추가

### Changed Files

- `src/__tests__/feature14.admin-operations-board.test.ts`: 자동 key activation 후 ingest, 수동 발급 후 중복 발급 방지 테스트 추가
- `src/pages/AdminEntryPage.vue`: key 활성 만료 시각 상태, 자동 key activation 분기, 최신 ingest 상태 표시, 수집 상태 예시 카드 3개 추가
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `npm run typecheck`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 8 tests passed
- `npm run typecheck`: failed, `src/__tests__/feature12.auth-login-role-selection.test.ts`의 기존 Vue Test Utils 타입 오류가 남아 있음. 이번 변경으로 추가된 feature14 타입 오류는 정리 완료

### Notes / Remaining Issues

- 현재 자동 key activation 분기는 FE가 직전 활성 성공 시각을 메모리로 기억하는 수준이다. 브라우저 새로고침 후에도 서버 측 활성 상태를 조회하는 API는 아직 없다.
- 수집 상태 시연 UI 3개는 HTML 예시이며, 실제 `GET /api/admin/ingest/status/{jobId}` polling 결과와 연결되지는 않았다.

## 2026-06-09 - follow-up: Admin 수집 문구 사용자 기준 정리

### Scope

- Admin 운영 보드의 데이터 수집 설명에서 스페이스 기준 문구 제거
- 사용자 허용 권한 기준으로 Confluence 문서를 수집한다는 설명으로 교체

### Changed Files

- `src/pages/AdminEntryPage.vue`: `Confluence 스페이스: CPC` 문구를 사용자 허용 권한 기반 수집 설명으로 변경
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Notes / Remaining Issues

- 현재 `GET /api/admin/data` 계약의 `totalSpaces` 필드와 UI 카드까지 사용자 기준 지표로 바꾸려면 backend/API spec 변경이 선행되어야 한다.

## 2026-06-09 - follow-up: Admin ingest store 연결 및 INLINE D 진행 카드 반영

### Scope

- `adminIngest` Pinia store 오류를 수정하고 Admin 운영 보드 상단 `데이터 파이프라인` 영역에 `ingest-status-preview.html`의 `INLINE · D` 인라인 진행 시안을 적용
- `POST /api/admin/ingest` 이후 `GET /api/admin/ingest/status/{jobId}` polling 결과를 3초 간격으로 반영
- 최근 몇 개 polling 샘플의 이동평균 속도로 ETA를 계산하고, `FAILED` 상태에서는 CTA를 `다시 시도`로 유지

### Test Cases

- `/admin` 운영 보드가 인라인 진행 카드와 새로고침 note를 렌더링한다
- `데이터 불러오기` 클릭 후 polling tick마다 `STARTED -> IN_PROGRESS` 상태, 진행률, 실패 수, ETA가 갱신된다
- `feature6` mock API 테스트가 현재 `mockCurrentUser` 계약과 일치한다

### Changed Files

- `src/stores/adminIngest.ts`: polling timer 타입 오류 수정, 이동평균 속도/ETA/경과 시간 getter 추가, terminal status 분기 정리
- `src/pages/AdminEntryPage.vue`: local ingest state를 store로 대체하고 `INLINE · D` 스타일 인라인 진행 카드 및 ETA/속도/상태 pill UI 적용
- `src/shared/assets.ts`: running/flag 캐릭터 asset export 추가
- `src/mocks/handlers.ts`: ingest status MSW handler 응답 타입 충돌 수정
- `src/__tests__/feature14.admin-operations-board.test.ts`: polling 기반 진행 카드/ETA 업데이트 테스트 추가
- `src/__tests__/feature6.mock-api.test.ts`: 현재 mock user role 계약에 맞게 기대값 보정

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 10 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-09 - follow-up: Admin ingest 시작 단계 문구 및 경과 시간 갱신 보정

### Scope

- 자동 key activation이 있어도 시작 토스트를 `데이터 불러오기를 시작했습니다.` 1회로 통일
- Admin 진행 카드 하단 안내 문구가 실제 API 호출 단계에 맞춰 `API Key 발급 -> 데이터 수집 시작 -> 시작 완료` 순서로 보이도록 조정
- 경과 시간이 00:00에 머무르지 않도록 store에 1초 clock tick을 추가

### Changed Files

- `src/stores/adminIngest.ts`: polling과 별도로 1초 elapsed clock timer 추가
- `src/pages/AdminEntryPage.vue`: 단계형 action hint 추가, 시작 토스트 단일화, elapsed/action hint test id 추가
- `src/__tests__/feature14.admin-operations-board.test.ts`: 단계형 안내 문구와 elapsed 갱신 테스트 추가
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-09 - follow-up: Admin 에러 상태 마스코트 추가

### Scope

- 관리자 보드 로딩 에러 화면 상단에 `mascotWrongImageUrl` 이미지를 추가해 빈 에러 상태의 시각 밀도를 보강

### Changed Files

- `src/pages/AdminEntryPage.vue`: 에러 상태 상단에 wrong mascot 이미지 추가
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-09 - follow-up: data-overview preview 22 확장 시안 추가

### Scope

- `docs/data-overview-preview.html`의 22번 계열을 덜 블럭형이고 덜 생성형처럼 보이도록 확장
- 실제 제품 화면에 가까운 데이터 현황 시안 3종을 정적 preview 문서에 추가

### Changed Files

- `docs/data-overview-preview.html`: 27~29번 상업형 데이터 현황 시안과 관련 스타일 추가
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 14 files / 120 tests passed
- `./scripts/verify.sh`: passed

## 2026-06-09 - follow-up: Admin ETA idle 표기 정리

### Scope

- 속도와 동일하게 ETA도 시작 전/초반 샘플 부족 구간에는 `계산 중` 대신 `-`로 표시되도록 조정

### Changed Files

- `src/pages/AdminEntryPage.vue`: ETA 표시 computed를 `계산 중 -> -` 규칙으로 보정
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-09 - follow-up: Admin 진행 카드 idle 표기 및 note 위치 조정

### Scope

- 진행 카드 설명 문구 색을 이전 대비로 되돌림
- 새로고침 note를 버튼 아래로 이동
- 상태 pill idle 표기를 `IDLE`로 변경
- idle 상태의 ETA/속도는 `계산 중` 대신 `-`로 표시

### Changed Files

- `src/pages/AdminEntryPage.vue`: 카피 색상/배치 수정, idle 상태 표시값 조정
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-09 - follow-up: Admin 설명 문구 대비 조정

### Scope

- `사용자별 문서를 최신 상태로 유지합니다.` 설명 문구의 가독성을 높이기 위해 텍스트 색을 한 단계 진하게 조정
- 바뀐 카피에 맞춰 feature14 테스트 기대 문자열 갱신

### Changed Files

- `src/pages/AdminEntryPage.vue`: 진행 카드 설명 문구 색을 `text-overlay-dark-60`로 조정
- `src/__tests__/feature14.admin-operations-board.test.ts`: 현재 운영 탭 카피 기준으로 기대값 갱신
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-09 - follow-up: Admin note 아이콘 추가 및 사이드바 고정 스크롤

### Scope

- 새로고침 안내 note 앞에 정보 아이콘 추가
- Admin 레이아웃에서 사이드바는 화면에 고정하고 메인 콘텐츠 영역만 세로 스크롤되도록 조정

### Changed Files

- `src/pages/AdminEntryPage.vue`: note 아이콘 추가, `h-screen`/`overflow` 레이아웃으로 사이드바 고정
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-09 - follow-up: Admin 진행 카드 카피 정리 및 완료 flag 위치 미세 조정

### Scope

- `Inline · D` 태그를 제거하고 `데이터 파이프라인` 설명 문구를 더 제품형 카피로 정리
- 완료 상태 flag LINA가 진행바를 더 자연스럽게 덮도록 오른쪽 위치를 소폭 조정

### Changed Files

- `src/pages/AdminEntryPage.vue`: 태그 제거, 상태별 설명 문구 정리, 완료 flag offset 조정
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-09 - follow-up: Admin 에러 재조회 동작 및 로그 EOF 기준 재확인

### Scope

- `보드 다시 불러오기` 버튼이 전체 브라우저 새로고침이 아니라 `loadAdminBoard()` 재호출임을 확인
- `working-log.md` 기록은 앞으로도 파일 맨 마지막 EOF에만 append한다는 기준 재확인

### Changed Files

- `docs/ai/working-log.md`: EOF append 기준 확인용 후속 작업 기록 추가

### Notes / Remaining Issues

- 이후 `working-log.md` 추가 기록은 tail 확인 후 EOF에만 append한다.

## 2026-06-09 - follow-up: Admin 에러 재시도 전체 새로고침 전환

### Scope

- 관리자 보드 에러 상태의 `보드 다시 불러오기` 버튼 동작을 데이터 재조회에서 `location.reload()` 기반 전체 페이지 새로고침으로 변경
- 관련 주석 제거 및 feature14 에러 상태 테스트를 reload 호출 검증으로 갱신

### Changed Files

- `src/pages/AdminEntryPage.vue`: `ErrorRetryState` retry handler를 `reloadAdminBoard()`로 교체
- `src/__tests__/feature14.admin-operations-board.test.ts`: jsdom에서 `window.location` 교체 방식으로 reload 호출 검증
- `docs/ai/working-log.md`: 후속 작업 기록 추가

### Commands

- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-10 - feature15 디자인 개선: 데이터 현황 섹션 17번 벤토 시안 적용

### Scope

- 시안(정리형 벤토)을 `AdminEntryPage.vue` 데이터 현황 섹션에 적용
- 마지막 동기화 카드(lina-desk 일러스트 + 상대 시간), 스페이스/페이지/첨부파일 3분할 타일, VectorDB/청크 타일, 최근 동기화 업데이트 페이지 바차트, 동기화 소요시간 추이 라인차트(hover 요약 툴팁)로 구성
- 모든 표시 데이터는 `docs/api-spec.md` 기준 — 카드 값은 `GET /api/admin/data`(`totalSpaces`/`totalPages`/`totalAttachments`/`vectorDbSize`/`totalChunks`/`lastSyncAt`), 두 차트는 `GET /api/admin/sync`의 `syncHistory`(`updatedPages`/`duration`/`status`/`completedAt`) 최근 7건을 시간순으로 렌더링. 임의 필드 추가 없음
- 동기화 이력이 비어 있을 때 두 차트 타일에 빈 상태 문구 표시
- 색상은 디자인 토큰(`primary`/`primary-light`/`status-success`/`--color-error`)만 사용

### Changed Files

- `src/pages/AdminEntryPage.vue`: 데이터 현황 영역을 벤토 그리드로 교체, 차트 계산 computed(`syncChartBars`/`durationChart`)와 `formatChartDate`/`formatRelativeTime` 추가. 기존 `admin-last-sync-at`, `admin-data-card-*` testid 유지
- `src/shared/assets.ts`: `linaDeskImageUrl` import/export 추가
- `src/__tests__/feature14.admin-operations-board.test.ts`: 날짜 의존으로 깨진 key 활성화 스킵 테스트의 `activatedUntil` fixture를 미래 시각 상대값으로 수정 (고정 날짜 `2026-06-09T23:59`가 실행일 경과로 만료 판정되어 실패하던 기존 문제 — 본 작업과 무관하게 main에서도 재현 확인)
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `./scripts/format.sh`
- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`
- `./scripts/test.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- 전체 테스트: passed, 14 files / 120 tests passed
- `./scripts/lint.sh`: passed

### Notes / Remaining Issues

- MSW mock(`mockAdminSyncHistory`)은 5건이라 차트가 5포인트로 표시됨 — 백엔드 통합 시 `syncHistory` 응답 그대로 최근 7건까지 자동 반영
- `frontend/assets/lina-character/lina-desk.png`는 신규 에셋으로 커밋에 포함 필요

## 2026-06-10 - follow-up: 운영 화면 UI/UX 개선 (스크린샷 점검 기반)

### Scope

- headless Chrome으로 `/admin` 화면을 직접 캡처해 점검한 뒤 합의된 개선 항목을 일괄 적용
- 소요시간 추이 차트 미화: 선 1.5px(`vector-effect="non-scaling-stroke"`), 점을 SVG circle 대신 % 좌표 HTML 요소로 교체해 가로 스트레치 시 타원 왜곡 제거, viewBox 양끝 여백으로 점 잘림 해결, 그라데이션 옅게, 최신 점만 살짝 크게
- IDLE 파이프라인 정리: 수집/전체·경과 메트릭을 작업 전 `-` 표시, 진행 캐릭터는 작업 상태가 있을 때만 표시, 좌측 설명을 액션 안내문으로 통합하고 중복되던 하단 힌트 박스는 작업 발생 후에만 노출
- 상태 표기 한글화: 저장 enum(UPPER_SNAKE_CASE)은 유지하고 화면 라벨만 매핑(대기 중/수집 준비/수집 중/완료/실패 등) — 파이프라인 pill과 동기화 이력 테이블 공통
- 바차트 라벨 중복 해결: 같은 날짜가 여러 번이면 시각(`HH시`)을 두 번째 줄로 병기, 바 최대 폭 16px→28px
- 마지막 동기화 LED: 24시간 초과 시 `status-warning` 색으로 전환
- '전체 보기' 버튼을 disabled에서 동기화 이력 섹션 전환(`activeSection = 'sync'`)으로 연결

### Changed Files

- `src/pages/AdminEntryPage.vue`: 위 항목 전체
- `src/__tests__/feature14.admin-operations-board.test.ts`: 상태 라벨 한글화·IDLE 기본 문구 변경에 맞춰 단언 갱신(`COMPLETED`→`완료`, `STARTED`→`수집 준비` 등)
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `./scripts/format.sh`
- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts`
- `./scripts/lint.sh`
- `./scripts/test.sh`

### Results

- feature14 admin 보드 테스트: passed, 1 file / 11 tests passed
- 전체 테스트: passed, 14 files / 120 tests passed
- `./scripts/lint.sh`: passed
- 적용 전/후 headless Chrome 스크린샷으로 IDLE 카드·차트·테이블 표시 확인

### Notes / Remaining Issues

- '전체 보기'와 nav의 동기화 이력 섹션은 현재 feature17 전이라 "준비 중" placeholder로 연결됨 — feature17(SCR-830) 구현 시 자연 해소

## 2026-06-10 - follow-up: 파이프라인 캐릭터 연출 보강 및 카드 높이 고정

### Scope

- IDLE 상태에 신규 에셋 `lina-waiting.png` 캐릭터를 진행바 출발선에 표시 (직전 작업의 "IDLE 캐릭터 숨김"을 사용자 피드백으로 대체)
- `lina-waiting.png`가 알파 채널 없는 흰 배경이라 캐릭터 wrapper에 `mix-blend-multiply`를 적용해 라이트 톤 카드 위에서 배경 제거 — img가 아닌 wrapper에 적용한 이유는 `z-10` wrapper가 stacking context를 만들어 img 단독 블렌드로는 뒤의 진행바와 섞이지 않기 때문
- 완료 상태 캐릭터를 scale 트릭 없이 10rem으로 확대하고, 이미지 폭 기준으로 중심이 진행바 끝을 살짝 넘도록 offset 재계산(`calc(% - 60px)`, top -2.5rem) — 기존에는 진행 중 캐릭터보다 작아 보이고 끝에 어정쩡하게 걸쳐 보였음
- IDLE에서 힌트 박스를 숨기던 직전 변경을 되돌려 항상 표시 — 작업 시작 시 카드 높이가 출렁이던 문제 해소, 좌측 설명은 원래 문구("사용자별 문서를 최신 상태로 유지합니다.")로 복원해 중복 없음
- Playwright(임시, /tmp)로 IDLE→수집→완료 전 과정을 실제 클릭해 상태별 스크린샷 검증

### Changed Files

- `src/pages/AdminEntryPage.vue`: 캐릭터 이미지/위치/크기 상태 분기, 힌트 박스 상시 표시, 헤더 변경이력 추가
- `src/shared/assets.ts`: `linaWaitingImageUrl` import/export 추가
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`

### Results

- 전체 테스트: passed, 14 files / 120 tests passed
- `./scripts/lint.sh`: passed
- IDLE/완료 상태 스크린샷으로 캐릭터 표시·카드 높이 고정 확인

### Notes / Remaining Issues

- `frontend/assets/lina-character/lina-waiting.png`는 흰 배경 PNG라 multiply 블렌드에 의존 — 다크 배경 카드로 바뀌면 알파 채널 있는 원본으로 교체 필요
- `frontend/assets/lina-character/lina-waiting.png` 신규 에셋 커밋 포함 필요

## 2026-06-10 - follow-up: 파이프라인 카피 정리 및 완료 캐릭터 연출 마무리

### Scope

- 진행 상태 문구를 자연스러운 톤으로 정리하고 Confluence 종속 표현 제거(다른 문서 소스 확장 가능성 대비) — "Confluence 제한 문서…" → "문서를 수집하고 있습니다…" 등 상태별 5종
- 완료 캐릭터를 더 오른쪽으로 이동(`calc(% - 60px)` → `calc(% - 40px)`)
- 완료 시 크기가 늘었다 줄었다 보이던 잔상 제거: 좌표 이동 transition을 STARTED/IN_PROGRESS에서만 적용하고 완료 시점에는 즉시 결승점에 배치 — 완료 직후 연속 프레임 캡처로 캐릭터 크기·위치 불변(진행바 채움 애니메이션만 동작) 확인
- `lina-waiting.png`가 알파 채널 있는 누끼 이미지로 교체되어 multiply 블렌드 우회 제거, 다른 상태와 동일하게 원본 렌더링

### Changed Files

- `src/pages/AdminEntryPage.vue`: 상태 문구 수정, 캐릭터 위치/전환 로직 정리, multiply 제거
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`

### Results

- 전체 테스트: passed, 14 files / 120 tests passed
- `./scripts/lint.sh`: passed
- IDLE/완료 스크린샷 및 완료 직후 4연속 프레임 비교로 잔상 제거 확인

### Notes / Remaining Issues

- 직전 로그의 "multiply 블렌드 의존" 노트는 에셋 교체로 해소됨

## 2026-06-10 - follow-up: 완료 캐릭터 확대 및 IDLE 캐릭터 출발선 정렬

### Scope

- 완료 캐릭터가 진행 캐릭터보다 작아 보이던 문제 수정 — `lina-flag.png`는 캔버스 여백이 커서 박스 10rem으로는 체감 크기가 작았음. 박스를 13rem으로 확대하고 offset(`calc(% - 64px)`, top -4rem)을 재조정해 진행 캐릭터보다 확실히 크게 표시
- IDLE 대기 캐릭터를 왼쪽(-1.75rem)으로 이동해 진행바 시작 가장자리에 몸이 걸치도록 정렬
- 상태별 IDLE/완료 스크린샷으로 크기·위치 확인

### Changed Files

- `src/pages/AdminEntryPage.vue`: `pipelineCharacterStyle`/`pipelineCharacterClasses` 수치 조정
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`

### Results

- 전체 테스트: passed, 14 files / 120 tests passed
- `./scripts/lint.sh`: passed

## 2026-06-10 - follow-up: 완료 캐릭터 위치 조정 불가 원인(max-width) 수정

### Scope

- 완료 캐릭터를 오른쪽으로 옮길수록 작아지고, 진행바 끝(100%)에선 아예 사라지던 문제의 근본 원인 수정
- 원인: Tailwind preflight의 `img { max-width: 100% }` — absolute wrapper가 `left: calc(100% - Npx)`에 위치하면 컨테이너 오른쪽까지 남은 공간(Npx)으로 wrapper가 줄고, 이미지가 max-width에 걸려 가로로 압축됨(측정: 34×208px)
- 수정: 캐릭터 `img`에 `max-w-none` 추가로 위치·크기 독립 분리
- 압축 보정으로 키워뒀던 박스(13rem)를 실제 렌더 기준 7rem으로 재조정, offset `calc(% - 66px)`/top `-1.6rem`으로 결승점에 걸친 연출 확정

### Changed Files

- `src/pages/AdminEntryPage.vue`: 캐릭터 img `max-w-none` 추가, `pipelineCharacterStyle`/`pipelineCharacterClasses` 수치 재조정
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `./scripts/lint.sh`
- `./scripts/test.sh`

### Results

- 전체 테스트: passed, 14 files / 120 tests passed
- `eslint src/pages/AdminEntryPage.vue`: passed
- Playwright 측정으로 img computed width 34px → 112px(7rem) 정상화 확인, IDLE/완료 스크린샷 검증

## 2026-06-10 - follow-up: 완료 시 진행바 '리셋 후 재채움' 착시 제거

### Scope

- 완료 순간 초록 바가 안으로 들어갔다가 다시 채워지는 듯 보이던 문제 수정
- 원인: 폭 측정 결과 너비는 줄지 않으나, 완료 시점에 색(주황 그라데이션→초록)이 즉시 바뀌는 동시에 너비가 73%→100%로 전환되어 '초록 바가 중간부터 새로 채워지는' 착시 발생
- 수정: `isCompletionBarSettled` ref + status watch로 width 전환(500ms)이 끝난 뒤(550ms) 초록색을 적용 — 주황 바가 끝까지 채워진 후 초록으로 전환되는 순서로 분리, `onUnmounted`에서 타이머 정리

### Changed Files

- `src/pages/AdminEntryPage.vue`: `isCompletionBarSettled` watch/타이머 추가, 진행바 색 분기를 settled 기준으로 변경
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `./scripts/lint.sh`
- `./scripts/test.sh`

### Results

- 전체 테스트: passed, 14 files / 120 tests passed
- `eslint src/pages/AdminEntryPage.vue`: passed
- 60ms 간격 진행바 폭 트레이스 및 완료 직후 연속 프레임 스크린샷으로 '주황 채움 완료 → 초록 전환' 순서 확인

## 2026-06-10 - follow-up: 진행바 완료 색 전환을 타이머 없이 opacity 크로스페이드로 단순화

### Scope

- 직전의 `isCompletionBarSettled` 타이머 방식(watch + setTimeout + onUnmounted)이 '채움 완료 후 초록 스냅'으로 어색하다는 피드백 반영
- fill 내부에 초록(`#2EB97F`) 오버레이 레이어를 두고 완료 시 `opacity 0→1`(700ms)로 페이드 — width 전환(500ms)과 겹치며 주황→초록이 자연스럽게 섞임
- JS 타이머/ref/watch/onUnmounted 전부 제거, CSS 전환만으로 처리

### Changed Files

- `src/pages/AdminEntryPage.vue`: settled 타이머 로직 제거, 진행바 fill에 초록 오버레이 + `transition-opacity` 추가
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `./scripts/lint.sh`
- `./scripts/test.sh`

### Results

- 전체 테스트: passed, 14 files / 120 tests passed
- `eslint src/pages/AdminEntryPage.vue`: passed
- 완료 직후 연속 프레임에서 주황·초록 크로스페이드 중간 상태 확인

## 2026-06-10 - follow-up: VectorDB 카드 색상 수정 및 SVG 개선

### Scope

- CSS 변수명 오류 수정: `var(--color-status-error/warning)`이 `main.css`에 존재하지 않아 SVG fill이 검정, 프로그레스바 background가 투명으로 렌더링되던 문제 → 실제 변수명 `var(--color-error/warning)`으로 교정
- VectorDB 색상 체계 변경: 정상(< 60%) = `var(--color-success)` 초록(여유 있는 느낌), 주의(60–79%) = `var(--color-warning)` 노랑, 위험(≥ 80%) = `var(--color-error)` 빨강
- SVG 실린더 디자인 개선: 수평 링 선 2개 유지, 상단 캡이 사용량 ≥ 90%일 때 채움 색과 동일하게 연결(뚜껑처럼 보이던 문제 제거), 채움 표면 타원 ≥ 90% 이상에서 숨김, viewBox 32×52 → 36×52로 미세 조정
- "VectorDB 스토리지" 타이틀 행을 카드 최상단으로 분리 — 기존에는 SVG와 같은 flex 컨테이너 안에 있어 SVG 폭만큼 우측으로 밀려 보였음

### Changed Files

- `src/pages/AdminEntryPage.vue`: `vectorDbFillColor` computed 변수명 수정, 색상 체계 변경, SVG 실린더 재설계, 타이틀 레이아웃 분리

### Commands

- `npm test`

### Results

- 전체 테스트: passed, 14 files / 119 tests passed

## 2026-06-10 - follow-up: 데이터 현황 카드 hover lift 제거 및 바 차트 툴팁 추가

### Scope

- 데이터 현황 섹션 카드 5개 전체에서 `hover:-translate-y-0.5` + hover shadow 제거 — 클릭 동작이 없는 정보 표시 카드에서 인터랙티브 암시를 주는 side effect 제거
- 바 차트("최근 동기화 · 업데이트 페이지") hover 툴팁 추가: 각 바에 mouseenter/mouseleave 연결, 날짜·업데이트 페이지 수 표시(실패 건은 "수집 실패"), hover된 바는 opacity 50% → 100%로 강조
- `syncChartBars` computed에 `updatedPages` 필드 추가, `hoveredBarId` ref 추가

### Changed Files

- `src/pages/AdminEntryPage.vue`: 카드 hover 클래스 일괄 제거, 바 차트 hover 인터랙션 및 툴팁 템플릿 추가, `syncChartBars`에 `updatedPages` 포함

### Commands

- `npm test`

### Results

- 전체 테스트: passed, 14 files / 119 tests passed

## 2026-06-10 - follow-up: 차트 툴팁 위치 개선 및 소요시간 툴팁 버그 수정

### Scope

- 바 차트 툴팁 스타일 통일: 검정 배경 → 소요시간 추이와 동일한 흰 배경 + 테두리 + 그림자, 날짜·시간 같은 줄 표시
- 바 차트 툴팁 위치: 열 컨테이너 상단이 아닌 바 element(`relative`) 기준 `bottom-full`로 바 바로 위에 밀착
- 소요시간 추이 툴팁 버그 수정: `transition-opacity duration-150` 페이드아웃 중 `hoveredDurationPoint`가 null이 되면 컨텐츠가 비어 "평균 N초"만 보이던 문제 → `displayedDurationPoint` ref(마지막 non-null 값 캐시)로 해결
- 소요시간 추이 툴팁 위치: 헤더 우측 고정 → dot 위로 복귀, 차트 div 내부 absolute로 dot xPercent/yPercent 기준 배치, `transition-[left,top,opacity]`로 dot 간 이동 시 부드럽게 슬라이드

### Changed Files

- `src/pages/AdminEntryPage.vue`: `displayedDurationPoint` ref + watch 추가, 소요시간 툴팁 위치/컨텐츠 개선, 바 차트 툴팁 스타일·위치 개선

### Commands

- `npm test`

### Results

- 전체 테스트: passed, 14 files / 119 tests passed

## 2026-06-10 - feature15: Admin 대시보드 구현 (SCR-810)

### Scope

- `frontend/docs/frames/[SCR-810] 관리자 추이 확인 대시보드.pdf` 기준 대시보드 탭 컨텐츠 구현
- `/admin/dashboard` route 추가, Admin shell nav의 대시보드 탭에서 `AdminDashboardSection` 표시
- `GET /api/admin/stats` 연결: 일간 질의 수, 평균 응답시간, 전체 대화 수 KPI 카드 + 시간대별 접속 추이 SVG 라인 차트
- `GET /api/admin/users` 연결: 전체/일일 활성 사용자 KPI 카드 + 사용자별 스페이스/페이지/첨부 수, 대화 수, 마지막 접속 테이블
- 사용자 테이블 pagination: `adminTabPagination` inject(탭별 독립 상태) 기반, page/size 0-based 전송(`currentPage - 1`)
- 기간 탭(오늘/7일/30일): `docs/api-spec.md`의 공통 query parameter가 제안 상태(미확정)이므로 API 재호출 없이 UI 상태만 관리하도록 격리
- Loading(BaseSpinner) / Error(ErrorRetryState + 재시도) / Empty(EmptyState) 상태 처리
- 스펙에 없는 필드(email 등)는 렌더링하지 않음 — API 응답 범위만 표시
- `AdminStats`, `AdminUserItem`, `AdminUsersResponse`, `HourlyAccessTrendItem` 타입 정의 및 `getAdminStats()`/`getAdminUsers()` API 함수 추가
- `GET /api/admin/stats`, `GET /api/admin/users` MSW mock handler 및 seed 데이터 추가 (`TODO(MOCK)` 마커 포함)

### Changed Files

- `src/__tests__/feature15.admin-dashboard.test.ts`: 테스트 10개 신규 작성 (route 연결, stats/users 호출, KPI 카드 값, 기간 탭 UI 상태, 차트 렌더, 테이블 행, empty/error/retry, pagination)
- `src/types/api.ts`: AdminStats·AdminUserItem·AdminUsersResponse·HourlyAccessTrendItem 타입 추가
- `src/api/index.ts`: getAdminStats, getAdminUsers 함수 추가
- `src/mocks/data.ts`: mockAdminStats, mockAdminUsersData 추가
- `src/mocks/handlers.ts`: /api/admin/stats, /api/admin/users handler 추가 (users는 page/size slice)
- `src/features/admin/AdminDashboardSection.vue`: 신규 생성
- `src/pages/AdminEntryPage.vue`: 대시보드 탭 placeholder를 AdminDashboardSection으로 교체
- `src/router/index.ts`: /admin/dashboard route 추가
- `docs/ai/current-plan.md`: feature15 전 항목 체크 처리

### Commands

- `npx vitest run` (TDD: 작성 직후 10개 실패 확인 → 구현 후 통과)
- `./scripts/lint.sh`
- `./scripts/format.sh`
- `npm run typecheck`

### Results

- feature15 테스트 10개 통과, 전체 16 files / 137 tests passed
- lint 경고 0, format 변경 없음
- typecheck: feature15 범위 에러 없음 (feature12 테스트의 기존 `DOMWrapper.exists` 타입 에러는 pre-existing 이슈로 미수정)
- 기간 탭 query parameter(`period`/`from`/`to`)는 스펙 확정 후 연결 필요 — 후속 작업으로 남김

## 2026-06-10 - follow-up: 대시보드 Playwright 시각 검토 및 토큰 정합성 수정

### Scope

- Playwright(headless chromium)로 `/admin/dashboard` 실화면을 SCR-810 PDF와 대조 검토 후 개선
- 차트 Y축 눈금·점선 그리드라인 추가: 최대값을 자릿수 기반 올림으로 보정해 깔끔한 5개 눈금 생성
- 차트 viewBox 640×160 → 1100×280: 실제 렌더 폭(~1100px)과 1:1 스케일로 맞춰 라벨·점 과대 확대 문제 해결
- KPI 카드 4개에 아이콘 추가(MessageSquare/Clock/Users/BarChart3), 반복 마크업을 `kpiCards` computed로 통합
- 디자인 토큰 정합성 버그 수정: SVG fill의 미존재 변수 `var(--color-overlay-dark-40)` → `var(--color-dark-40)`, Tailwind config에 없는 `text-overlay-dark-60/30` 클래스(no-op) → 정의된 `text-overlay-dark-80/40`으로 교체
- mock 정합성 수정: `totalUsers: 58`인데 mock 사용자 3명뿐이라 2페이지부터 빈 상태가 뜨던 모순 → 58명을 index 기반 결정적 공식 + KST timestamp로 생성
- 빈 상태 조건을 `users.length === 0` → `totalUsers === 0`으로 수정하고, 페이지에 행이 없는 경우는 별도 안내문으로 분리
- 페이지네이션의 "(전체 N명)" 중복 문구 제거(테이블 헤더와 겹침), 직접 만든 스피너를 공용 BaseSpinner로 교체
- API 정합성 점검: stats/users 응답 필드 스펙 일치, page 0-based 전송, 스펙에 없는 email 미렌더 확인
- 사용자 피드백 반영: 페이지 제목 "대시보드" → "사용자 현황"(nav 중복 제거), 테이블 제목 "사용자 현황" → "사용자별 활동", 사이드바 nav 라벨 "대시보드" → "사용자 현황"
- 2페이지 이동·이전/다음 버튼 활성화를 Playwright 스크린샷으로 검증, 브라우저 콘솔 에러 0 확인

### Changed Files

- `src/features/admin/AdminDashboardSection.vue`: 차트 재설계(Y축/viewBox), kpiCards 통합, 토큰 수정, 빈 상태 조건 분리, 제목 변경
- `src/features/admin/AdminShellLayout.vue`: nav 라벨 대시보드 → 사용자 현황
- `src/mocks/data.ts`: mockAdminUsersData 58명 결정적 생성으로 교체
- `src/__tests__/feature15.admin-dashboard.test.ts`: pagination 표시 변경·nav 라벨 변경에 맞춰 단언 갱신
- `src/__tests__/feature14.admin-operations-board.test.ts`: nav 라벨 단언 갱신

### Commands

- `VITE_USE_MOCK=true npm run dev` + Playwright 스크린샷 (before/after, 2페이지 동작)
- `npx vitest run`
- `./scripts/lint.sh`
- `./scripts/format.sh`
- `npm run typecheck`

### Results

- 전체 테스트: passed, 16 files / 137 tests passed
- lint 경고 0, typecheck feature15 범위 에러 없음, 브라우저 콘솔 에러 0

## 2026-06-11 - follow-up: 사용자별 활동 테이블 컬럼 정렬 추가

### Scope

- 사용자 현황 탭의 사용자별 활동 테이블 4개 컬럼(이름/스페이스·페이지·첨부/대화 수/마지막 접속)에 오름차순·내림차순 토글 정렬 추가
- `GET /api/admin/users` 스펙에 sort query parameter가 없어 API 파라미터를 임의로 만들지 않고 현재 페이지 데이터를 클라이언트에서 정렬
- 헤더 클릭 1회 = 오름차순, 2회 = 내림차순, 다른 컬럼 클릭 시 해당 컬럼 오름차순으로 전환
- 정렬 기준: 이름 = `localeCompare(ko)`, 스페이스/페이지/첨부 = 튜플 비교(스페이스 → 페이지 → 첨부), 대화 수 = 숫자, 마지막 접속 = timestamp
- 활성 컬럼에 `aria-sort`(ascending/descending) 노출, 아이콘은 활성 시 ArrowUp/ArrowDown(주황), 비활성 시 ChevronsUpDown(회색)
- TDD: 정렬 테스트 2개 작성 → 실패 확인 → 구현 → 통과

### Changed Files

- `src/features/admin/AdminDashboardSection.vue`: 정렬 상태(sortKey/sortDirection)·comparator·sortedUsers computed 추가, 테이블 헤더를 정렬 버튼으로 교체
- `src/__tests__/feature15.admin-dashboard.test.ts`: 대화 수 오름/내림차순 토글, 이름 정렬 + aria-sort 테스트 추가

### Commands

- `npx vitest run`
- `./scripts/lint.sh`
- `./scripts/format.sh`
- `npm run typecheck`
- `VITE_USE_MOCK=true npm run dev` + Playwright 스크린샷 (대화 수 내림차순 동작 확인)

### Results

- 전체 테스트: passed, 16 files / 139 tests passed
- lint 경고 0, typecheck feature15 범위 에러 없음, 브라우저 콘솔 에러 0

## 2026-06-11 - follow-up: 접속 추이 24시간 확장, 기간 탭 segmented control, mock 응답시간 수정

### Scope

- 시간대별 접속 추이 mock 데이터를 0~14시(SCR-810 PDF 샘플 범위 그대로)에서 0~23시 전체로 확장 — 오전 피크(11시) 이후 오후 보조 피크(16시)를 거쳐 심야로 감소하는 곡선
- 기간 탭(오늘/7일/30일)을 segmented control 스타일로 변경: 테두리+연회색 배경 컨테이너 안에 버튼 배치, 활성 버튼은 흰 배경+그림자+semibold로 강조 (사용자 제공 레퍼런스 이미지 기준)
- mock 평균 응답시간 2.3초 → 3.4초로 수정 (사용자 요청)

### Changed Files

- `src/mocks/data.ts`: hourlyAccessTrend 15~23시 추가, avgResponseTime 3.4로 변경
- `src/features/admin/AdminDashboardSection.vue`: 기간 탭 segmented control 스타일 적용

### Commands

- `npx vitest run`
- `./scripts/lint.sh`
- `./scripts/format.sh`
- `VITE_USE_MOCK=true npm run dev` + Playwright 스크린샷

### Results

- 전체 테스트: passed, 16 files / 139 tests passed
- lint 경고 0, 브라우저 콘솔 에러 0
- X축 라벨은 기존 최대 8개 제한 로직에 따라 0/3/6/9/12/15/18/21/23시로 자동 조정됨

## 2026-06-11 - design: 사용자 현황 탭 리디자인 시안 4종 작성

### Scope

- "상단 KPI 카드 4개가 필요한가?"라는 사용자 질문에서 출발한 디자인 대안 탐색 — 코드 변경 없이 standalone HTML 시안만 작성
- 모든 시안은 `GET /api/admin/stats`, `GET /api/admin/users` 현재 응답 필드만으로 구현 가능하도록 제약, 각 수치 요소에 데이터 출처(API 필드/파생값) 표기
- 시안 A 통합 패널: KPI 카드 제거, 차트 카드 상단 스탯 스트립으로 통합 (변경 비용 최소)
- 시안 B 테이블 퍼스트: 사용자 테이블 메인 + 우측 레일(활성률 도넛/스파크라인/핵심 수치), 행에 대화 수 인라인 바·최근성 dot 추가
- 시안 C 히어로 지표: 일일 활성률(파생값) 링을 히어로로 승격, 보고/데모용
- 시안 D 콤팩트 벤토: 차트 메인 셀 + 우측 KPI 세로 스택, 기존 구조와 가장 가까운 보수안
- Playwright로 4개 시안 렌더링 검증

### Changed Files

- `docs/design/user-status-concepts.html`: 신규 생성 (LINA 디자인 토큰 기반, 자체 포함 HTML)

### Results

- 추천: 운영 도구 일상 사용 기준 B, 변경 비용 최소 기준 A — 사용자 선택 대기

## 2026-06-11 - feature15 리디자인: 사용자 현황 탭 테이블 퍼스트 레이아웃(시안 B) 적용

### Scope

- `docs/design/user-status-concepts.html` 시안 B 채택에 따라 `AdminDashboardSection.vue` 레이아웃 재구성
- KPI 카드 4개 그리드 + 대형 차트 → 사용자별 활동 테이블(메인) + 우측 264px 레일(일일 활성률 도넛 / 오늘 접속 추이 스파크라인 / 핵심 지표 3개)
- 최근성 dot: "접속 중" presence로 오독될 우려(사용자 피드백)에 따라 이름 옆이 아닌 마지막 접속 시각 앞에 배치하고 헤더에 범례(24시간 이내=초록 / 7일 이내=노랑 / 그 이상=회색) 명시 — lastAccessAt 경과시간 파생값
- 대화 수 인라인 바 기준 확정: 막대 길이 = 현재 페이지 내 최대 대화 수 대비 비율, 페이지 평균 2배 이상이면 튀는 값으로 진한 주황(primary), 평상시 연한 주황(primary-light) — title 툴팁에 페이지 평균 병기
- 스파크라인 카드 클릭 시 중앙 모달로 대형 차트 표시: 기간 탭(오늘/7일/30일, UI 상태만)·X 버튼·ESC·백드롭 클릭 닫기, 열림 시 닫기 버튼 포커스, FeedbackModal 패턴 준수
- 차트 X축을 데이터 범위 기반에서 0~24시 고정 도메인(3시간 간격 눈금)으로 변경
- 기존 testid(admin-stats-card-\*, admin-access-trend-chart, 테이블/정렬/페이지네이션) 유지로 기존 테스트 영향 최소화
- TDD: 모달 열기/닫기, 0~24시 축, 인라인 바 outlier 강조, 최근성 dot 테스트 4개 작성 → 실패 확인 → 구현 → 통과

### Changed Files

- `src/features/admin/AdminDashboardSection.vue`: 시안 B 레이아웃으로 재작성 (도넛/스파크라인/모달/인라인 바/최근성 dot)
- `src/__tests__/feature15.admin-dashboard.test.ts`: 기간 탭 테스트를 모달 컨텍스트로 교체, 신규 테스트 4개 추가 (총 15개)

### Commands

- `npx vitest run`
- `./scripts/lint.sh`
- `./scripts/format.sh`
- `npm run typecheck`
- `VITE_USE_MOCK=true npm run dev` + Playwright 스크린샷 (레이아웃·모달)

### Results

- 전체 테스트: passed, 16 files / 142 tests passed
- lint 경고 0, typecheck feature15 범위 에러 없음, 브라우저 콘솔 에러 0

## 2026-06-11 - follow-up: 사용자 현황 탭 4건 보정 (최근성 기준·인라인 바 기준·모달 인터랙션·지표 순서)

### Scope

- 최근성 dot 기준을 24시간/7일에서 7일 이내(초록)/30일 이내(노랑)/그 이상(회색)으로 변경, 범례 갱신
- 마지막 접속 시각에 연도 표시 추가 (`2026. 06. 01. 오전 10:16` 형식)
- 인라인 바 기준 변경: 만점(100%) = 페이지 최대 → 페이지 평균의 2배(outlier 임계값) — "바가 꽉 참 = 평균 2배 도달"로 시각과 의미 일치, 페이지 최댓값 사용자가 항상 만점으로 보이던 문제 해결. 바 중앙(50%)에 평균 위치 마커 추가
- 동작하지 않던 native title 툴팁을 BaseTooltip으로 교체 (`N건 · 페이지 평균 M건 · 만점=평균 2배`)
- 스파크라인 카드 확대 아이콘에 BaseTooltip("크게 보기") 추가
- 확대 모달 pop-in 애니메이션: 클릭 시 스파크라인 카드 중심 좌표를 CSS 변수로 전달해 카드 위치에서 화면 중앙으로 확대되는 keyframe 적용 (Transition 컴포넌트 대신 mount-시 animation이라 jsdom 테스트 영향 없음)
- 스파크라인 피크 dot에 흰 테두리 + 바깥으로 퍼지는 pulse halo 애니메이션 추가
- 레일 지표 순서 변경: 일간 질의 수 → 전체 대화 수 → 평균 응답시간 (사용량 지표 인접 배치, 성격이 다른 지연 지표는 마지막)

### Changed Files

- `src/features/admin/AdminDashboardSection.vue`: 위 항목 전체, scoped style(keyframes) 추가
- `src/__tests__/feature15.admin-dashboard.test.ts`: 최근성 기준·범례 단언 변경, 연도 표시·바 만점 기준 단언 추가

### Commands

- `npx vitest run`
- `./scripts/lint.sh`
- `./scripts/format.sh`
- `npm run typecheck`
- `VITE_USE_MOCK=true npm run dev` + Playwright (툴팁 hover·모달 애니메이션 프레임 캡처)

### Results

- 전체 테스트: passed, 16 files / 142 tests passed
- lint 경고 0, typecheck feature15 범위 에러 없음, 브라우저 콘솔 에러 0

## 2026-06-11 - follow-up: mock 최근성 분포 개선 및 인라인 바 세그먼트 스타일

### Scope

- mock 사용자 `lastAccessAt`을 고정 기준일 - 5시간×index에서 현재 시각 기준 경과시간 6패턴(2h/50h/200h/400h/800h/1500h + index 오프셋) 순환으로 변경 — 최근성 dot(7일 이내/30일 이내/그 이상)이 한 페이지 안에서 초록·노랑·회색 골고루 보이도록
- 대화 수 인라인 바의 평균 위치 마커(세로 작대기) 제거, 대신 레퍼런스 이미지처럼 세그먼트 흰 구분선 오버레이(repeating-linear-gradient) 적용. 최초 10칸은 너무 촘촘하다는 피드백으로 4칸으로 조정 — 1칸 = 만점의 25%, 2칸 = 페이지 평균이라 평균 위치도 칸으로 읽힘

### Changed Files

- `src/mocks/data.ts`: lastAccessAt 생성 로직을 Date.now() 기준 순환 패턴으로 변경
- `src/features/admin/AdminDashboardSection.vue`: 평균 마커 제거, conv-bar-segments 오버레이 + scoped CSS 추가

### Commands

- `npx vitest run`
- `./scripts/lint.sh`
- `./scripts/format.sh`
- `VITE_USE_MOCK=true npm run dev` + Playwright 스크린샷

### Results

- 전체 테스트: passed, 16 files / 142 tests passed
- lint 경고 0, 브라우저 콘솔 에러 0

## 2026-06-11 - follow-up: 일일 활성률 도넛 그라데이션 적용

### Scope

- 일일 활성률 도넛의 채움 색을 단색 primary에서 `BaseGradientButton`과 동일한 브랜드 그라데이션(#F79140 → #FF4A19)으로 변경 — SVG linearGradient def + stroke url 참조. 시작점(12시)이 붉게 보인다는 피드백으로 그라데이션을 위(주황)→아래(빨강) 수직 방향으로 조정 (선형 그라데이션 특성상 75% 초과 호에서는 끝부분이 다시 옅어지는 한계 있음 — 필요 시 conic-gradient+마스크로 후속 개선)

### Changed Files

- `src/features/admin/AdminDashboardSection.vue`: 도넛 SVG에 linearGradient 추가

### Results

- 전체 테스트: passed, 16 files / 142 tests passed, lint 경고 0

## 2026-06-11 - follow-up: 대화 수 툴팁을 outlier 행 전용 비교 메시지로 변경

### Scope

- 모든 행에 반복되던 대화 수 툴팁("N건 · 페이지 평균 M건")을 제거 — 숫자가 바로 옆에 보여 정보 가치가 낮은 노이즈였음
- 기준 초과(페이지 평균 2배 이상) 행에만 비교 툴팁 노출: "페이지 평균 N건의 X.X배 — 다른 사용자보다 대화가 많습니다" (사용자 제안 채택). 후속 요청으로 트리거를 인라인 바 hover에서 행 전체 hover로 확장 — tr은 span 래퍼로 감쌀 수 없어 BaseTooltip 대신 행 mouseenter + Teleport 툴팁(동일 시각 스타일)으로 구현, 위치는 대화 수 셀 기준 앵커
- 세그먼트 오버레이가 hover 포인터를 가로채지 않도록 pointer-events-none 추가
- mock conversationCount가 균등 분포라 어떤 페이지에도 outlier가 생기지 않던 문제 수정 — 페이지(12명)당 1명에 +120 가산해 강조 UI를 데모에서 확인 가능하게 함
- 외부 수정(레이아웃 보정)으로 stale해진 pagination 테스트의 '전체 58명' 단언을 도넛 카드 '23 / 58명' 기준으로 갱신

### Changed Files

- `src/features/admin/AdminDashboardSection.vue`: convOutlierTooltip 도입, outlier 조건부 BaseTooltip 래핑, pointer-events-none
- `src/mocks/data.ts`: conversationCount outlier 가산
- `src/__tests__/feature15.admin-dashboard.test.ts`: outlier 전용 툴팁 테스트 추가, stale 단언 갱신

### Results

- 전체 테스트: passed, 16 files / 145 tests passed, lint 경고 0
- Playwright 확인: outlier 행(233건) 진한 주황 풀바 + "페이지 평균 69건의 3.4배" 툴팁, 일반 행 툴팁 0건

## 2026-06-11 - api-spec 정합성 보정: OAuth returnTo 및 admin ingest 시작 흐름

### Scope

- `docs/api-spec.md` 기준 점검에서 확인한 프론트 정합성 이슈 중 즉시 반영 가능한 2건만 수정
- 로그인 역할 선택 링크에 `returnTo` 쿼리 포함: 일반 사용자 `/chat`, 관리자 `/admin`
- admin 데이터 수집 시작 시 명시적 `POST /api/admin/key/activate` 선행 호출 제거 — 최신 명세대로 `POST /api/admin/ingest`가 key activate를 내부 처리하는 기본 동선 사용
- 수동/테스트용 Admin Key 활성화 함수와 store 액션은 유지
- 인증 Bearer 토큰 자동 첨부는 아직 MSW 기반 프론트 단독 개발 단계라 후속 인증 통합 시점으로 보류

### Changed Files

- `src/features/auth/authIntent.ts`: OAuth 시작 URL에 `returnTo` 쿼리 추가
- `src/stores/adminIngest.ts`: `startIngest()`에서 중복 key activation 선행 호출 제거
- `src/features/admin/AdminOperationsSection.vue`: 수집 시작 안내 문구를 `/api/admin/ingest` 단일 흐름에 맞춰 조정
- `src/__tests__/feature12.auth-login-role-selection.test.ts`: 로그인 URL 기대값 갱신
- `src/__tests__/feature14.admin-operations-board.test.ts`: `/api/admin/ingest` 단일 호출 흐름 기대값 갱신

### Commands

- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 16 files / 145 tests passed
- `./scripts/verify.sh`: passed, 16 files / 145 tests passed

## 2026-06-11 - feature16: Admin 피드백 확인 구현 (SCR-820)

### Scope

- `[SCR-820] 관리자 피드백 확인.pdf` 기준 피드백 탭 화면 구현: 긍정/부정 비율 도넛 카드, 일자별 피드백 추이 바 차트, 부정 피드백 원문 카드 목록
- `/admin/feedback` route 추가 (AdminEntryPage 연결), Admin shell nav '피드백' 탭의 준비 중 placeholder를 `AdminFeedbackSection`으로 교체
- `GET /api/admin/feedback` 계약(`docs/api-spec.md` §4-2) 기준 `AdminFeedbackResponse` 타입, `getAdminFeedback` API 함수, MSW mock handler/data 추가
- 부정 피드백 카드에는 질문/답변/comment/createdAt만 렌더링 (feedbackId/messageId 등 내부 식별자 비노출 — 회귀 테스트 포함)
- 기간 탭(7일/14일/30일): `from`/`to` query parameter가 api-spec에서 아직 **제안** 상태이므로 feature15와 동일하게 UI 상태만 관리하고 API 재호출 없이 mock 격리. 기본 선택은 API 기본값(최근 7일)에 맞춰 7일
- 부정 피드백 원문 pagination: `adminTabPagination` inject(feedback 키) 사용, page size 5, 총 페이지 기준은 `dislikeCount`. 페이지 전환 시 전체 로딩 스피너 없이 데이터만 교체 (dashboard와 동일 패턴)

### Test Cases

- `/admin/feedback` route → AdminEntryPage 연결
- 피드백 탭 활성화 시 `getAdminFeedback` 1회 호출
- 긍정/부정 비율 카드에 likeCount/dislikeCount/positiveRatio(87%/13%) 표시
- 피드백 추이 차트가 trend 날짜 수만큼 바 렌더링 + 날짜 라벨
- 기간 탭 전환 시 aria-selected만 변경, API 재호출 없음
- 부정 피드백 카드의 질문/답변/comment/createdAt 표시 + 총 건수(dislikeCount) 표시
- 카드에 feedbackId/messageId 미노출
- 부정 피드백 0건 empty state
- API 실패 error state + 재시도 동작
- pagination 페이지 정보(1 / 10 페이지), 다음 페이지 `{ page: 1, size: 5 }` 재호출, 첫 페이지 prev 비활성

### Changed Files

- `src/types/api.ts`: `AdminFeedbackTrendItem`·`AdminNegativeFeedbackItem`·`AdminFeedbackResponse` 타입 추가
- `src/api/index.ts`: `getAdminFeedback(params)` 추가
- `src/mocks/data.ts`: `mockAdminFeedbackData` 추가 (부정 원문 47건 생성, dislikeCount와 일치)
- `src/mocks/handlers.ts`: `GET /api/admin/feedback` mock handler 추가 (`TODO(MOCK)` 마커, page/size 슬라이싱)
- `src/router/index.ts`: `/admin/feedback` route 추가
- `src/pages/AdminEntryPage.vue`: feedback 섹션을 `AdminFeedbackSection`으로 연결, placeholder는 동기화 이력만 유지
- `src/features/admin/AdminFeedbackSection.vue`: 신규 (SCR-820 탭 컨텐츠)
- `src/__tests__/feature16.admin-feedback.test.ts`: 신규 (11 tests)
- `src/__tests__/feature14.admin-operations-board.test.ts`: stale 단언 1건 수정 — `admin-profile-email`은 커밋 74bb923 UI 변경(이메일 → Admin Mode 라벨)에서 렌더링이 제거됐는데 테스트가 갱신되지 않아 HEAD부터 실패하던 것을 현재 UI 기준으로 갱신 (feature16 변경과 무관한 기존 실패)
- `src/features/admin/AdminShellLayout.vue`: 코드 변경 없음 — `./scripts/format.sh`(prettier) 정리만 반영
- `docs/ai/current-plan.md`: feature16 항목 체크 처리

### Commands

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts` (red 확인: 11 failed → 구현 후 11 passed)
- `./scripts/verify.sh` (format → lint → test)
- `npm run typecheck`

### Results

- 전체 테스트: passed, 17 files / 156 tests
- lint 경고 0 (`--max-warnings 0`), format 적용 완료
- typecheck: feature16 범위 에러 0. 기존 에러 12건은 미수정 파일(`feature12`·`feature15` 테스트의 `wrapper.get().exists()` 패턴, TS2339)로 feature16 이전부터 존재 — 해당 feature 담당 범위라 이번 세션에서 수정하지 않음

### Notes / Remaining Issues

- 기간 탭은 `period`/`from`/`to` query parameter가 BFF에서 확정되면 실제 조회 연결 필요 (현재 UI 상태만)
- 디자인 PDF의 donut(312/47건)과 부정 원문 "총 12건" 표기가 상호 불일치하여, mock은 spec 관계식(`negativeFeedbacks` 총량 = `dislikeCount`)에 맞춰 47건으로 생성
- 피드백 추이 바는 일자별 `likeCount + dislikeCount` 합산 높이로 렌더링하고 분해값은 바 tooltip(`<title>`)으로 제공
- 기존 typecheck 에러 12건(feature12/15 테스트)은 후속 정리 필요

## 2026-06-11 - feature16 follow-up: 피드백 추이 차트 톤다운 및 화면 구조 시안

### Scope

- 피드백 추이 차트가 화면에서 과하게 크게 보이던 문제를 사용자 현황 탭의 시간대별 접속 추이 톤에 맞춰 보정
- 차트 높이 축소, Y축/X축 font-size 9px로 축소, 점선 간격을 `2 6`으로 변경, grid stroke를 0.75로 낮춤
- `GET /api/admin/feedback`의 `trend[].likeCount` / `trend[].dislikeCount`를 합산 단일 바로 숨기지 않고, 긍정/부정 스택 바와 범례로 표시
- `docs/api-spec.md`의 응답 구조(`totalCount`, `likeCount`, `dislikeCount`, `positiveRatio`, `trend`, `negativeFeedbacks`, `page`, `size`) 기준으로 mock/API 타입/화면 매핑 유지 확인
- 피드백 페이지를 상업적으로 더 보기 좋게 바꿀 수 있는 HTML 시안 3종 작성

### Changed Files

- `src/features/admin/AdminFeedbackSection.vue`: 피드백 추이 차트 compact 스타일 및 긍정/부정 스택 바 반영
- `src/__tests__/feature16.admin-feedback.test.ts`: trend의 like/dislike 스택 바 렌더링 단언 갱신
- `docs/design/feedback-page-concepts.html`: 신규 HTML 시안 3종(A Executive Summary, B Operations First, C Insight Board)
- `docs/ai/current-plan.md`: feature16 후속 보정 체크 추가
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`: passed, 1 file / 11 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 17 files / 156 tests passed
- `./scripts/verify.sh`: passed, 17 files / 156 tests passed

## 2026-06-11 - feature16 follow-up: 말풍선 SVG 및 피드백 색상 토큰 정리

### Scope

- 부정 피드백 원문 comment 영역의 lucide message icon 제거
- SVG 말풍선 배경 안에 실제 comment 원문이 보이도록 구조 변경
- 긍정/부정 차트 색상을 `success`/`primary`에서 `graph-blue`/`graph-purple` 토큰으로 변경
- 도넛, 범례, 추이 스택 바 색상을 동일 토큰 기준으로 통일

### Changed Files

- `src/features/admin/AdminFeedbackSection.vue`: SVG 말풍선 배경, comment 텍스트 배치, 긍정/부정 그래프 색상 토큰 변경
- `src/__tests__/feature16.admin-feedback.test.ts`: SVG 말풍선 존재 및 그래프 색상 토큰 단언 추가
- `docs/ai/current-plan.md`: feature16 후속 보정 체크 추가
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`: passed, 1 file / 11 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 17 files / 156 tests passed
- `./scripts/verify.sh`: passed, 17 files / 156 tests passed

## 2026-06-11 - feature16 follow-up: 피드백 추이 연결부 및 원문 필터 보정

### Scope

- 피드백 추이의 긍정/부정 스택 바 연결부가 어색하게 보이던 문제 수정
- 전체 바 외곽을 `clipPath`로 둥글게 자르고 내부 긍정/부정 구간은 직선 연결되도록 변경
- 추이 차트 축 글자 크기 8px, grid 점선 `2 7`, stroke 0.65로 추가 톤다운
- `부정 피드백 원문` 섹션명을 `피드백 원문`으로 변경
- 원문 목록에 긍정/부정 segmented filter 추가, 기본값은 부정
- `docs/api-spec.md`는 현재 `negativeFeedbacks`만 제공하므로, 긍정 선택 시 API 미제공 빈 상태를 표시하고 추가 API 호출은 하지 않음

### Changed Files

- `src/features/admin/AdminFeedbackSection.vue`: 차트 clipPath, 축/점선 스타일, 원문 필터 UI 추가
- `src/__tests__/feature16.admin-feedback.test.ts`: 차트 축 스타일 및 원문 필터 동작 테스트 추가
- `docs/ai/current-plan.md`: feature16 후속 보정 체크 추가
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`: passed, 1 file / 12 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 17 files / 157 tests passed
- `./scripts/verify.sh`: passed, 17 files / 157 tests passed

## 2026-06-11 - feature16 follow-up: 원문 목록을 부정 피드백 전용으로 복원

### Scope

- 사용자 확인에 따라 피드백 원문 긍정/부정 필터 UI 제거
- `docs/api-spec.md`의 현재 계약이 `negativeFeedbacks`만 제공하므로 원문 목록은 부정 피드백 전용으로 유지
- 피드백 추이 차트의 clipPath 연결부 및 축/점선 톤다운은 유지

### Changed Files

- `src/features/admin/AdminFeedbackSection.vue`: 원문 필터 상태/UI 제거, `negativeFeedbacks` 전용 렌더링 복원
- `src/__tests__/feature16.admin-feedback.test.ts`: 필터 테스트 제거, 부정 원문 전용 단언 복원
- `docs/ai/current-plan.md`: feature16 원문 표시 기준 갱신
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`: passed, 1 file / 11 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 17 files / 156 tests passed
- `./scripts/verify.sh`: passed, 17 files / 156 tests passed

## 2026-06-11 - feature16 follow-up: 부정 피드백 원문 카드 구조 보정

### Scope

- 부정 피드백 원문 카드에서 comment를 카드 최상단 말풍선 형태로 강조
- 말풍선 아래에 질문/답변이 이어지도록 정보 배치 순서 변경
- api-spec 기준 원문 목록은 계속 `negativeFeedbacks`만 사용

### Changed Files

- `src/features/admin/AdminFeedbackSection.vue`: comment 말풍선 상단 배치, 질문/답변 하단 배치
- `src/__tests__/feature16.admin-feedback.test.ts`: comment 말풍선 존재 및 질문 본문보다 먼저 렌더링되는지 단언 추가
- `docs/ai/current-plan.md`: feature16 원문 카드 구조 보정 체크 추가
- `docs/ai/working-log.md`: 작업 기록 추가

### Commands

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`: passed, 1 file / 11 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 17 files / 156 tests passed
- `./scripts/verify.sh`: passed, 17 files / 156 tests passed

## 2026-06-11 - feature16 follow-up: 클라우드 버블 및 의미색 보정

### Scope

- 피드백 긍정/부정 색상을 의미가 더 분명한 `status-success`/`status-error` 조합으로 변경
- comment 메시지 박스를 `bg-200` 기반 반투명 클라우드 버블 톤으로 조정
- comment 텍스트가 말풍선 y축 중앙에 더 가깝게 보이도록 상단 padding을 늘리고 하단 padding을 줄임
- SVG 안에 path 텍스트를 넣지 않고 실제 API comment 원문을 DOM 텍스트로 렌더링
- api-spec 기준 원문 목록은 계속 `negativeFeedbacks`만 사용

### Changed Files

- `src/features/admin/AdminFeedbackSection.vue`: 피드백 차트 의미색 토큰 변경, comment SVG 클라우드 버블 및 텍스트 위치 보정
- `src/__tests__/feature16.admin-feedback.test.ts`: 새 의미색 토큰 및 SVG 클라우드 버블 fill/opacity 단언 갱신
- `docs/ai/current-plan.md`: feature16 후속 보정 체크 추가
- `docs/ai/working-log.md`: EOF 기준 작업 기록 추가

### Commands

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`: passed, 1 file / 11 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 17 files / 156 tests passed
- `./scripts/verify.sh`: passed, 17 files / 156 tests passed

## 2026-06-11 - feature16 follow-up: 피드백 색상·mock·추이 툴팁·채팅형 원문 보정

### Scope

- 긍정/부정 의미색은 유지하되 `fill-opacity`/아이콘 opacity로 채도를 낮춰 덜 쨍하게 조정
- 긍정/부정 비율 도넛을 중립 track + 긍정/부정 arc로 분리해 피드백 추이 색상과 일치시킴
- 피드백 추이 바 hover 시 문서 데이터 관리 바차트와 동일한 흰 배경/테두리/그림자 스타일의 툴팁 표시
- 툴팁에는 해당 날짜의 긍정/부정 피드백 건수를 표시
- mock 부정 피드백 질문/답변에서 `예시 질문 N:`/`답변 N:` 접두어 제거 및 실제형 장문 데이터로 변경
- 부정 피드백 원문 질문/답변 영역을 채팅형 UI로 변경
- 질문은 우측 메시지 버블, 답변은 좌측 `mascot-face.png` 원형 아바타 + 답변 버블로 표시
- 피드백 원문 comment 버블은 연한 주황(`primary-light`)으로, 사용자 질문 버블은 회색 cloud(`bg-200`)로 조정
- 피드백 원문 comment 버블은 기존 가로형 SVG 형태를 유지하고 주황 그라데이션/inner shadow 색감만 적용
- comment SVG를 단일 path로 정리해 우측 조각 경계가 보이는 문제를 줄이고 원문 텍스트 padding-left를 늘림
- api-spec 기준 원문 목록은 계속 `negativeFeedbacks`만 사용

### Changed Files

- `src/features/admin/AdminFeedbackSection.vue`: 피드백 차트 opacity 조정, 도넛 arc 분리, 추이 hover tooltip 추가, 채팅형 질문/답변 카드 구조 및 comment 그라데이션 버블 shape/색상 변경
- `src/mocks/data.ts`: 부정 피드백 mock 질문/답변을 실제형 장문 데이터로 변경
- `src/shared/assets.ts`: `mascotFaceImageUrl` export 추가
- `src/__tests__/feature16.admin-feedback.test.ts`: 장문 fixture, 도넛/추이 색상 opacity, 추이 hover tooltip, 채팅형 질문/답변 구조 및 comment 단일 path 그라데이션 버블 단언 갱신
- `docs/ai/current-plan.md`: feature16 후속 보정 체크 추가
- `docs/ai/working-log.md`: EOF 기준 작업 기록 추가

### Commands

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npx vitest run src/__tests__/feature16.admin-feedback.test.ts`: passed, 1 file / 12 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 17 files / 157 tests passed
- `./scripts/verify.sh`: passed, 17 files / 157 tests passed

## 2026-06-12 - feature16 follow-up: 피드백 상단 블럭 리디자인 (반원 게이지 + 라운드 그룹 바)

### Scope

- 차트 축 라벨 글자 크기를 8 → 6.5로 줄이고 그리드 점선을 `2 7` → `1.5 5`, 두께 0.65 → 0.55로 잘게 조정
- 디자인 컨셉 비교용 프로토타입(`docs/ai/feedback-block-concepts.html`) 작성 — A(라인+게이지)/B(그룹 바)/C(미러 바) 3안 제안
- 긍정/부정 비율 카드를 도넛에서 컨셉 C 기반 반원 게이지(브랜드 오렌지 그라데이션 arc + 중앙 % 숫자)로 전환
- 피드백 추이를 스택 바에서 컨셉 B 기반 긍정/부정 라운드 그룹 바로 전환 — 긍정은 오렌지 그라데이션, 부정은 슬레이트(#8d99ae)
- 의미색(success/error) 조합을 버리고 브랜드 오렌지=긍정 / 슬레이트=부정으로 색상 체계 통일 (범례·툴팁 포함)
- 비율 칩을 텍스트 라벨 대신 엄지 아이콘(20px) + 건수 표기로 변경, sr-only로 긍정/부정 라벨 유지
- 칩 줄바꿈 문제 수정 후 공간 배분 개선 — 게이지 190×110 → 230×133 확대, 중앙 % 글자 2rem로 확대
- 칩의 (87%)/(13%) 표기는 게이지 중앙 %와 중복이라 제거하고 건수 글자를 0.9rem로 복원
- 추이 바 폭 상한 9 → 13, 간격 상한 4 → 5로 올려 넓은 화면에서 바가 점처럼 보이는 문제 보정
- 바 폭/간격은 슬롯 너비 기준 자동 보정이라 30일치 데이터에서도 그룹이 슬롯 안에 들어감
- 값이 0인 날은 바를 그리지 않아 둥근 캡이 작은 바처럼 보이는 문제 방지

### Changed Files

- `src/features/admin/AdminFeedbackSection.vue`: 반원 게이지 전환, 라운드 그룹 바 전환, 오렌지/슬레이트 색상 통일, 비율 칩 아이콘화 및 공간 배분 개선
- `src/__tests__/feature16.admin-feedback.test.ts`: 게이지 arc/그라데이션, 그룹 바 fill, 축 라벨 글자 크기, 칩 퍼센트 중복 제거 단언 갱신
- `docs/ai/feedback-block-concepts.html`: 디자인 컨셉 3안 비교 프로토타입 신규 작성
- `docs/ai/working-log.md`: EOF 기준 작업 기록 추가

### Commands

- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 17 files / 157 tests passed
- `./scripts/verify.sh`: passed, 17 files / 157 tests passed

## 2026-06-12 - feature17: Admin 동기화 이력 구현 (SCR-830)

### Scope

- `/admin/sync` route를 추가하고 AdminEntryPage에서 route path 기준으로 Admin 섹션을 동기화
- Admin shell nav에서 동기화 이력을 최상위 탭에서 제거하고 문서 데이터 관리 하위 탭으로 배치
- 기존 SCR-800 문서 데이터 관리 컨텐츠에 하위 탭 명칭 `운영 대시보드` 소제목 추가
- `GET /api/admin/sync`의 `syncHistory`를 상태, 업데이트 수, 삭제 수, 소요 시간, 완료 시각 테이블로 표시
- API enum(`STARTED` / `IN_PROGRESS` / `COMPLETED` / `FAILED`)만 사용하고 화면 라벨과 상태별 배지만 매핑
- 전체 동기화 이력의 loading, empty, error, retry, pagination 상태 구현

### Changed Files

- `src/features/admin/AdminSyncHistorySection.vue`: SCR-830 동기화 이력 섹션 신규 구현
- `src/features/admin/AdminShellLayout.vue`: 동기화 이력을 문서 데이터 관리 하위 탭으로 이동
- `src/features/admin/AdminOperationsSection.vue`: SCR-800 컨텐츠 하위 소제목 `운영 대시보드` 추가
- `src/pages/AdminEntryPage.vue`: `/admin/sync` route와 active section 동기화, sync 섹션 렌더링 연결
- `src/router/index.ts`: `/admin/sync` route 추가
- `src/__tests__/feature17.admin-sync-history.test.ts`: feature17 실패 테스트 작성 후 구현 검증
- `docs/ai/current-plan.md`: feature17 완료 항목 체크
- `docs/ai/working-log.md`: 작업 결과 기록

### Commands

- `npm test -- src/__tests__/feature17.admin-sync-history.test.ts`
- `npm test -- src/__tests__/feature14.admin-operations-board.test.ts src/__tests__/feature14-refactor.tab-pagination.test.ts src/__tests__/feature15.admin-dashboard.test.ts src/__tests__/feature16.admin-feedback.test.ts src/__tests__/feature17.admin-sync-history.test.ts`
- `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- `npm test -- src/__tests__/feature17.admin-sync-history.test.ts`: passed, 1 file / 8 tests passed
- Admin 회귀 테스트: passed, 5 files / 56 tests passed
- `npm run typecheck`: failed on pre-existing test typing issues in feature12/15/16 tests that call `get(...).exists()`; feature17 신규 test의 동일 패턴은 `find(...).exists()`로 수정 완료
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 18 files / 165 tests passed
- `./scripts/verify.sh`: passed, 18 files / 165 tests passed

## 2026-06-12 - feature18: Settings 모달 구현 (SCR-700~720 - 계정 탭)

### Scope

- 좌하단 `설정 및 도움말` 버튼 클릭 시 중앙 Settings 모달을 표시
- SCR-710 기준 계정 탭을 기본 활성 탭으로 렌더링
- 계정 관리 UI에 `Client_id`, 인증 갱신 날짜, 90일 갱신 안내, Confluence 이동 링크, 로그아웃 행 표시
- ESC, 백드롭, X 버튼 닫기와 모달 내부 포커스 트랩 구현
- 모달 오픈 중 `document.body` 스크롤 잠금 처리
- API/DB/인증 흐름 변경 없음

### Changed Files

- `src/features/settings/SettingsModal.vue`: Settings 중앙 모달 shell과 계정 탭 UI 신규 구현
- `src/features/chat/ChatSidebar.vue`: Settings entry 클릭 이벤트 emit 연결
- `src/pages/ChatPage.vue`: Settings 모달 open/close 상태와 current user 이름 전달 연결
- `src/__tests__/feature18.settings-modal.test.ts`: feature18 실패 테스트 작성 후 구현 검증
- `docs/ai/current-plan.md`: feature18 완료 항목 체크
- `docs/ai/working-log.md`: 작업 결과 기록

### Commands

- `npm test -- --run src/__tests__/feature18.settings-modal.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 최초 `npm test -- --run src/__tests__/feature18.settings-modal.test.ts`: failed, `SettingsModal.vue` import 미존재로 실패 확인
- 구현 후 `npm test -- --run src/__tests__/feature18.settings-modal.test.ts`: passed, 1 file / 4 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 19 files / 170 tests passed
- `./scripts/verify.sh`: passed, 19 files / 170 tests passed

## 2026-06-12 - feature18 follow-up: 계정 관리 단일화 및 갱신일 계산 보정

### Scope

- Settings 모달 좌측 섹션에서 일반 설정 / 데이터 관리 항목 제거
- 계정 관리만 단일 섹션으로 노출
- 계정 카드의 주황색 `C` 텍스트 아이콘을 Confluence 아이콘 asset으로 교체
- 인증 갱신 날짜를 `GET /api/users/me`의 `lastLoginAt` 기준 90일 후 날짜로 계산해 표시

### Changed Files

- `src/features/settings/SettingsModal.vue`: 단일 계정 관리 UI, Confluence 아이콘, `lastLoginAt + 90일` 갱신일 계산 적용
- `src/pages/ChatPage.vue`: current user의 `lastLoginAt`을 Settings 모달로 전달
- `src/__tests__/feature18.settings-modal.test.ts`: 일반/데이터 탭 제거, Confluence 아이콘, 계산된 갱신일 회귀 테스트 갱신
- `docs/ai/working-log.md`: 후속 보정 결과 기록

### Commands

- `npm test -- --run src/__tests__/feature18.settings-modal.test.ts`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 변경 전 `npm test -- --run src/__tests__/feature18.settings-modal.test.ts`: failed, 일반 설정 탭 잔존 및 `currentUserLastLoginAt` prop 미구현 확인
- 구현 후 `npm test -- --run src/__tests__/feature18.settings-modal.test.ts`: passed, 1 file / 4 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 19 files / 170 tests passed
- `./scripts/verify.sh`: passed, 19 files / 170 tests passed

## 2026-06-12 - feature18 follow-up: 도움말 모달 추가 (Ask|Search|Verify 사용 가이드)

### Scope

- Settings 모달 좌측 nav의 계정 관리 아래에 도움말 항목 추가
- 도움말 클릭 시 Settings 모달 위에 더 큰 도움말 오버레이 모달(z-60, max-w 1240px) 표시
- Ask / Search / Verify 사용 가이드 3개 섹션을 01|02|03 단계 번호와 함께 가로 3단으로 동시 노출
- 홈 화면보다 도움말 톤으로 작성: Enter/Shift+Enter, 사이드바 검색(2~50자), 대화 고정 기능, 출처 확인 방법 등 실제 사용법 안내
- 각 섹션에 lina 캐릭터 이미지와 목업 비주얼(질문 입력 박스, 브라우저 채팅 목업, 지식 연결 그래프 SVG) 포함
- 도움말 모달은 X/백드롭/ESC로 닫히며 Settings 모달은 유지, 자체 포커스 트랩과 닫힘 후 도움말 버튼 포커스 복귀 처리
- Settings 모달 재오픈 시 도움말 모달 닫힘 상태로 초기화
- 커밋되지 않은 로그아웃 한글 문구 변경('이 기기에서 로그아웃 하기')에 맞춰 기존 테스트 기대값 보정

### Changed Files

- `src/features/settings/SettingsModal.vue`: 도움말 nav 버튼 추가, 클릭 시 SettingsHelpModal 오픈, 재오픈 시 닫힘 초기화, 닫힘 후 포커스 복귀
- `src/features/settings/SettingsHelpModal.vue`: 신규 — 대형 도움말 모달, 3단 가이드 섹션(단계 번호+불릿+캐릭터 이미지+목업 비주얼), ESC/백드롭/X 닫기와 포커스 트랩
- `src/__tests__/feature18.settings-modal.test.ts`: 도움말 nav 렌더링/도움말 모달 오픈과 3단 동시 표시·고정 기능 언급/이미지·SVG 비주얼/닫기 3종과 Settings 유지/재오픈 초기화 테스트 5건 추가, 로그아웃 문구 기대값 한글로 보정
- `docs/ai/current-plan.md`: feature18 도움말 항목 체크 처리
- `docs/ai/working-log.md`: 작업 결과 기록

### Commands

- `npx vitest run src/__tests__/feature18.settings-modal.test.ts`
- `npm test` / `npm run lint` / `npm run typecheck`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

### Results

- 변경 전 `npx vitest run src/__tests__/feature18.settings-modal.test.ts`: failed, 신규 테스트 실패 확인(TDD) + 기존 로그아웃 문구 테스트가 커밋되지 않은 한글 문구 변경으로 사전 실패 상태였음을 확인
- 구현 후 `npx vitest run src/__tests__/feature18.settings-modal.test.ts`: passed, 1 file / 9 tests passed
- `./scripts/format.sh`: passed
- `./scripts/lint.sh`: passed
- `./scripts/test.sh`: passed, 19 files / 175 tests passed
- `./scripts/verify.sh`: passed
- `npm run typecheck`: failed — feature12/15/16 테스트 파일의 기존 `DOMWrapper.exists` 타입 오류 13건(이번 변경 파일과 무관, 담당 범위 밖이라 미수정, 별도 보정 필요)

## 2026-06-12 - feature18 follow-up: Settings 타이포 축소, 로그아웃 버튼 강조, 도움말/계정 진입 연결

### Scope

- Settings 모달 타이포 한 단계 축소: 타이틀 22→18px, nav/본문 16→14px, 보조 텍스트 13→12px (도움말 모달 헤더 동일 적용)
- 로그아웃 버튼을 진한 색으로 변경: 테두리형 → 다크 배경(bg-overlay-dark-80) + 흰 글자(text-primary-white)
- Chat main 우하단의 기존 floating ? 도움말 버튼(클릭 동작 없음)을 도움말 모달(SettingsHelpModal)과 연결
- Chat 헤더 계정 이미지: hover 툴팁을 '계정 관리로 이동'으로 변경하고 클릭 시 Settings 모달(계정 관리) 오픈

### Changed Files

- `src/features/settings/SettingsModal.vue`: 타이포 축소, 로그아웃 버튼 다크 스타일
- `src/features/settings/SettingsHelpModal.vue`: 헤더 타이포 축소
- `src/features/chat/ChatHeader.vue`: 프로필 버튼 openSettings emit 추가(additive), 툴팁/aria-label '계정 관리로 이동'으로 변경
- `src/pages/ChatPage.vue`: floating-help-button 클릭 → SettingsHelpModal 오픈, ChatHeader open-settings → Settings 모달 오픈 배선
- `src/__tests__/feature18.settings-modal.test.ts`: 타이포/로그아웃 버튼 스타일, 프로필 진입+툴팁, floating 도움말 버튼 진입 테스트 3건 추가
- `src/__tests__/feature8.chat-main.test.ts`: 프로필 툴팁 라벨 기대값을 의도된 변경('계정 관리로 이동')에 맞게 갱신 2곳
- `docs/ai/current-plan.md`: feature18 항목 체크 처리
- `docs/ai/working-log.md`: 작업 결과 기록

### Commands

- `npx vitest run src/__tests__/feature18.settings-modal.test.ts`
- `./scripts/format.sh` / `./scripts/lint.sh` / `./scripts/test.sh` / `./scripts/verify.sh`
- `npm run typecheck`

### Results

- 변경 전 신규 테스트 3건 실패 확인(TDD) 후 구현
- 도중 ChatHeader에 도움말 버튼을 추가했다가, chat main에 이미 존재하던 floating ? 버튼(BaseFloatingIconButton)이 동일 역할임을 확인하고 중복 제거 후 기존 버튼에 연결
- `./scripts/test.sh`: passed, 19 files / 178 tests passed
- `./scripts/format.sh` / `./scripts/lint.sh` / `./scripts/verify.sh`: passed
- `npm run typecheck`: failed — feature12/15/16 테스트 파일의 기존 `DOMWrapper.exists` 타입 오류 13건(이번 변경과 무관, 기존 이슈)

## 2026-06-12 - feature18 follow-up: floating 도움말 버튼 가시성/노출 조건 보정 및 새 대화 스크롤 제거

### Scope

- floating ? 도움말 버튼이 화면에 보이지 않던 문제 수정: wrapper가 `absolute`(z-index 없음)여서 `fixed z-20` 입력 영역에 가려짐 → `fixed bottom-10 right-6 z-30`으로 변경
- 도움말 버튼을 새 대화 화면에서만 노출하고 대화 화면에서는 숨김(`v-if="!hasActiveConversation"`)
- 새 대화 화면 스크롤 문제 정의와 해결: scroll-region의 상시 `pb-[220px]`(고정 입력창 자리 확보) 때문에 최소 문서 높이가 872px이 되어 그보다 작은 창에서 스크롤 발생 → 빈 화면에서는 `pb-[220px]` 대신 `h-[calc(100vh-76px)]`로 viewport에 맞춰 ChatEmptyState가 내부 중앙 정렬되도록 변경(대화 화면은 기존 pb 유지)
- Playwright로 실제 브라우저 검증: 760px/900px viewport에서 스크롤 없음, 버튼 표시·클릭 시 도움말 모달 오픈, 대화 라우트에서 버튼 미표시 확인

### Changed Files

- `src/pages/ChatPage.vue`: floating wrapper fixed/z-30/bottom-10 + 빈 화면 전용 노출, scroll-region 상태별 클래스 분기
- `src/__tests__/feature8.chat-main.test.ts`: wrapper 클래스(fixed/bottom-10/z-30), 빈 화면 scroll-region 클래스 회귀 테스트 갱신
- `src/__tests__/feature9.chat-conversation.test.ts`: 대화 화면에서 floating wrapper 미표시 회귀 테스트 추가
- `docs/ai/current-plan.md`, `docs/ai/working-log.md`: 기록

### Commands

- `npx vitest run` (feature8/9/18)
- `./scripts/format.sh` / `./scripts/lint.sh` / `./scripts/test.sh` / `./scripts/verify.sh`
- `VITE_USE_MOCK=true npm run dev` + Playwright 스크립트(/tmp/lina-verify)로 브라우저 검증

### Results

- `./scripts/test.sh`: passed, 19 files / 178 tests passed
- format/lint/verify: passed
- 브라우저 검증: 760px viewport에서 docScrollHeight 760 == innerHeight 760(스크롤 없음), 버튼 클릭 → 도움말 모달 정상 오픈, `/chat/conv-mock-001`에서 floating wrapper 0개 확인

## 2026-06-12 - feature18 follow-up 정정: 새 대화 화면 상단 정렬 복원

### Scope

- 직전 스크롤 제거에서 scroll-region을 `flex h-[calc(100vh-76px)] flex-col`로 바꾼 결과, ChatEmptyState(`flex-1`)가 화면 전체 높이로 늘어나 `justify-center`로 환영 문구·카드가 중앙으로 내려가고 `absolute top-12`인 ASK LINA와의 간격이 비정상적으로 벌어지는 회귀 발생
- 빈 화면 scroll-region을 `h-[calc(100vh-76px)] overflow-y-hidden`(block)으로 변경해 flex 스트레치를 제거 — 원래의 상단 정렬 레이아웃을 복원하면서 스크롤 없음 유지
- 환영 문구 간격은 검토(mt-36, mt-[100px]) 후 사용자 결정으로 기존 `mt-20` 유지. 참고: `mt-25`는 Tailwind 기본 스케일과 프로젝트 spacing 설정에 없는 값이라 클래스가 생성되지 않아 마진 0으로 렌더링됨
- ChatEmptyState 주석의 잘못된 변경 이력(mt-36) 한 줄 제거 — 코드 변경 없음

### Changed Files

- `src/pages/ChatPage.vue`: 빈 화면 scroll-region 클래스 `flex ... flex-col` → `overflow-y-hidden` (직전 커밋에 포함)
- `src/__tests__/feature8.chat-main.test.ts`: 빈 화면 scroll-region이 flex가 아니고 overflow-y-hidden인지 회귀 검증 (직전 커밋에 포함)
- `src/features/chat/ChatEmptyState.vue`: 코드와 불일치하는 주석 이력 제거

### Results

- `./scripts/test.sh`: passed, 19 files / 178 tests passed / lint·format passed
- Playwright 검증: 1600×900·1280×760 모두 스크롤 0px, ASK LINA 상단 정렬 복원, 대화 라우트에서 floating 버튼 미표시 유지
