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
