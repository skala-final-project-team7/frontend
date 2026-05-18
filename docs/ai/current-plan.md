# Frontend Feature Implementation Plan

## Summary

- 목표: LINA Frontend를 Vue 3 + Vite + TypeScript 기반으로 feature 단위 구현한다.
- 기준 문서: `AGENTS.md`, `frontend/AGENTS.md`, `docs/ai/workflow.md`, `docs/conventions.md`, `docs/architecture.md`, `docs/api-spec.md`
- 구현 순서: Chat(SCR-400~600) mock 구현 → Chat 백엔드 연결 → Auth/Onboarding(SCR-100~310) → Settings(SCR-700~720)
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

[ ] `VITE_USE_MOCK=true/false` 환경 토글 기준 정의
[ ] MSW browser worker와 test server 구성
[ ] `/api/conversations` mock handler 생성
[ ] `/api/conversations/{conversationId}/messages` mock handler 생성
[ ] `/api/conversations/{conversationId}/chat` SSE mock 방식을 구현 가능한 수준으로 준비
[ ] mock handler마다 `TODO(MOCK): {endpoint}` 주석 추가

# feature7: Shared UI 상태 컴포넌트

[ ] `BaseSpinner` 생성
[ ] `EmptyState` 생성
[ ] `BaseButton` 생성
[ ] `BaseIconButton` 생성
[ ] Error + Retry 상태를 표현할 수 있는 shared 컴포넌트 또는 패턴 생성
[ ] 아이콘 전용 버튼에는 `aria-label`을 필수로 적용

# feature8: Chat 기본 화면 구현 (SCR-400)

[ ] `frontend/docs/components.md`의 SCR-400 요구사항 확인
[ ] `frontend/docs/frames/[SCR-400]main chatbot.png` 기준 레이아웃 구현
[ ] Sidebar 닫힘/열림 기본 상태와 SettingsEntry 위치 구현
[ ] ChatEmptyState에 ASK LINA, SKP symbol, 환영 문구, mascot, PreviewPageStack 배치
[ ] MessageInput 기본 입력/비활성 상태 구현

# feature9: Chat 대화 화면 구현 (SCR-410, SCR-420, SCR-600)

[ ] 메시지 목록과 사용자(테두리 존재o)/LINA(테두리 존재x) MessageBubble 시각 구분 구현
[ ] SSE 청크 누적 표시와 RAG 단계 라벨 placeholder 구현
[ ] 답변 하단 출처 / Check Reference 버튼 구현
[ ] 사용자 메시지 인라인 수정 모드 구현
[ ] FollowUpSuggestions 추천 칩 UI 구현

# feature10: 출처 패널 구현 (SCR-500, SCR-510)

[ ] Check Reference 클릭 시 우측 슬라이드 패널 표시
[ ] ReferenceCard에 Title / Path / 작성자 / 작성일자 / 출처 URL 액션 표시
[ ] 오래된 문서 badge와 키워드 하이라이트 기준 구현
[ ] Graph view placeholder와 List/Graph 토글 구현

# feature11: Chat 백엔드 연결 전환

[ ] `docs/api-spec.md`와 실제 BFF 응답을 대조해 `src/types/api.ts` 수정 필요 여부 확인
[ ] `VITE_USE_MOCK=false` 환경에서 `/api/conversations` 대화 목록 조회 연결
[ ] `VITE_USE_MOCK=false` 환경에서 `/api/conversations/{conversationId}/messages` 메시지 이력 조회 연결
[ ] `VITE_USE_MOCK=false` 환경에서 `/api/conversations/{conversationId}/chat` SSE 스트리밍 연결
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

# feature12: Auth / Onboarding 화면 구현 (SCR-100~310)

[ ] LandingPage 기본 화면 구현
[ ] LoginPage Confluence OAuth CTA 화면 구현
[ ] OnboardingPage 4-step 진행 화면 구현
[ ] OnboardingDone 완료 화면 구현
[ ] 인증 API가 불명확한 항목은 mock 또는 placeholder로 격리

# feature13: Auth 백엔드 연결 전환

[ ] `docs/api-spec.md`의 인증 API 예정 항목과 실제 BFF 인증 흐름 대조
[ ] `GET /api/auth/login` 또는 합의된 Confluence OAuth 시작 endpoint 연결
[ ] OAuth callback 이후 사용자 상태 복원 방식 확인
[ ] `GET /api/users/me` 연결 후 사용자 이름/프로필 표시 데이터 흐름 연결
[ ] 인증 실패 / 세션 만료 / 로그아웃 상태 처리
[ ] 인증/인가 흐름 변경 시 관련 문서 갱신

# feature14: Settings 모달 구현 (SCR-700~720)

[ ] Settings 중앙 모달 shell 구현
[ ] 일반 / 계정 / 데이터 탭 구현
[ ] ESC / 백드롭 / X 닫기와 포커스 트랩 구현
[ ] 일반 설정의 히스토리 관리 UI 구현
[ ] 계정 관리와 데이터 관리 UI 구현

# feature15: 테스트 및 검증 기반 확장

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

## Assumptions

- `frontend/docs/components.md`는 현재 없고 `frontend/docs/componets.md`가 존재하므로 기존 파일명을 변경하지 않고 해당 문서를 참조한다.
- API/DB/인증 문서는 실제 변경이 필요한 feature에서만 수정한다.
- 현재 구현 상태는 feature1까지만 유지하고, feature2 이후는 이 plan에 따라 새 세션 또는 `/clear` 이후 순차 구현한다.
