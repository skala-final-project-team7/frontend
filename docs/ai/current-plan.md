# Frontend 기본 골격 구축 Plan

## Summary

- 목표: 현재 작업 루트에 Vue 3 + Vite + TypeScript 기반 LINA frontend 기본 골격을 구축한다.
- 우선순위: `frontend/AGENTS.md` 기준으로 Chat(SCR-400~600)을 먼저 구현할 수 있는 구조를 준비한다.
- 이번 범위: 앱 초기 설정, 폴더 구조, 라우팅, 상태관리, Tailwind 토큰, mock API 기반만 구성한다.
- 제외 범위: 실제 Chat 상세 UI 완성, Auth/Onboarding, Settings 상세 구현, 실제 API 연동, API/DB/인증 문서 변경.

## Feature Implementation Checklist

## Feature Execution Rule

- `feature1`부터 순서대로 하나의 feature만 작업한다.
- 각 feature는 별도 세션 또는 `/clear` 이후 새 작업 단위로 진행한다.
- feature 작업 시작 시 `docs/ai/current-plan.md`에서 해당 feature 요구사항을 읽고 구현 범위를 먼저 요약한다.
- feature별로 테스트 케이스 목록을 먼저 작성한다.
- 구현 전에 테스트 코드를 먼저 작성하고 실패를 확인한다.
- 최소한의 코드 변경으로 해당 feature만 구현한다.
- feature 완료 후 테스트 통과를 확인한다.
- `feature2` 이후 항목은 해당 feature 작업 범위가 아닐 때 수정하지 않는다.
- 기존 Public API, 함수 시그니처, 인증/인가 흐름은 임의로 변경하지 않는다.
- 완료된 항목은 `docs/ai/current-plan.md`에서 체크 처리한다.
- 작업 결과는 `docs/ai/working-log.md`에 기록한다.
- 모든 검증과 `git diff` 확인 후 commit한다.

## Per-Feature Completion Flow

1. `docs/ai/current-plan.md`에서 현재 feature 요구사항을 읽고 구현 범위를 요약
2. 현재 feature의 테스트 케이스 목록 작성
3. 테스트 코드 먼저 작성
4. 테스트 실패 확인
5. 최소한의 코드 변경으로 현재 feature 구현
6. 테스트 통과 확인
7. `./scripts/test.sh` 실행
8. `./scripts/lint.sh` 실행
9. `./scripts/format.sh` 실행
10. `git diff`로 변경 범위 확인
11. 완료 항목을 `docs/ai/current-plan.md`에서 체크 처리
12. `docs/ai/working-log.md`에 작업 내용, 변경 파일, 테스트 결과, 남은 이슈 기록
13. commit 생성

# feature1: 프로젝트 초기 설정

[] `package.json` 생성 및 Vue 3, Vite, TypeScript 기반 스크립트 구성
[] Pinia, Vue Router, Tailwind CSS, Vitest, Vue Test Utils, MSW 의존성 구성
[] Vite, TypeScript, Tailwind, PostCSS 설정 파일 생성
[] `src/main.ts`, `src/App.vue`, 전역 스타일 진입점 구성

# feature2: 폴더 구조 및 아키텍처 골격

[] `src/pages`, `src/features`, `src/shared` 3계층 컴포넌트 구조 생성
[] `src/api`, `src/types`, `src/mocks`, `src/stores`, `src/composables`, `src/router` 생성
[] 컴포넌트가 직접 `fetch`를 호출하지 않도록 API 레이어 경계 정의
[] 서버 상태는 Pinia, UI 상태는 컴포넌트 또는 composable에서 관리하는 기준 적용

# feature3: 라우팅 및 Chat 중심 Shell

[] Vue Router 기본 설정 생성
[] 기본 진입 라우트를 Chat 페이지로 연결
[] Chat 페이지에 Sidebar, ChatMain, MessageInput, ReferencePanel을 배치할 수 있는 shell 구성
[] SCR-400~600 상세 구현 전용 placeholder 상태를 구분해 둠

# feature4: 디자인 토큰 및 기본 스타일

[] `frontend/docs/design-reference.css`의 CSS 변수를 Tailwind theme token으로 등록
[] 임의 색상 사용 없이 `primary`, `bg`, `status`, `overlay` 계열 토큰으로 스타일 기준 구성
[] 기본 layout, typography, button, panel에 사용할 최소 CSS/Tailwind 기준 작성
[] 기존 `frontend/assets` 이미지를 참조할 수 있는 import 경로 확인

# feature5: API 타입 및 클라이언트 골격

[] `docs/api-spec.md` 기준 Common Response wrapper 타입 정의
[] Conversation, Message, Source, Feedback, SSE event 타입 정의
[] `src/api/client.ts` fetch wrapper 생성
[] conversations/messages/chat API 함수 골격 생성
[] SSE `/api/conversations/{conversationId}/chat`는 wrapper 미적용 이벤트 스트림으로 분리

# feature6: Mock API 기반

[] `VITE_USE_MOCK=true/false` 환경 토글 기준 정의
[] MSW browser worker와 handlers 구성
[] `/api/conversations` mock handler 생성
[] `/api/conversations/{conversationId}/messages` mock handler 생성
[] `/api/conversations/{conversationId}/chat` SSE mock 방식을 구현 가능한 수준으로 준비
[] mock handler마다 `TODO(MOCK): {endpoint}` 주석 추가

# feature7: Shared UI 상태 컴포넌트

[] `BaseSpinner` 생성
[] `EmptyState` 생성
[] `BaseButton` 생성
[] `BaseIconButton` 생성
[] Error + Retry 상태를 표현할 수 있는 shared 컴포넌트 또는 패턴 생성
[] 아이콘 전용 버튼에는 `aria-label`을 필수로 적용

# feature8: 테스트 및 검증 기반

[] App 기본 렌더링 테스트 작성
[] Chat shell Empty 상태 테스트 작성
[] API client wrapper 성공/실패 처리 테스트 작성
[] mock conversation list 응답 테스트 작성
[] `npm run typecheck`, `npm run lint`, `npm run test` 실행 가능하게 구성
[] 루트 검증 명령 `./scripts/format.sh`, `./scripts/lint.sh`, `./scripts/test.sh`, `./scripts/verify.sh`와 호환되는지 확인

# feature9: 작업 문서화

[] `docs/ai/current-plan.md`에 이 plan 저장
[] `docs/ai/working-log.md` 생성 및 feature별 작업 로그 템플릿 작성
[] 구현 후 변경 파일, 실행 명령, 테스트 결과를 작업 결과에 기록
[] API 변경이 없으므로 `docs/api-spec.md`는 수정하지 않음
[] DB 변경이 없으므로 `docs/db-schema.md`는 수정하지 않음
[] 아키텍처 변경이 없으므로 `docs/architecture.md`는 수정하지 않음

## Files To Modify

- `docs/ai/current-plan.md`
- `docs/ai/working-log.md`
- `package.json`
- Vite/TypeScript/Tailwind/PostCSS 설정 파일
- `src/**`

## Files Not To Modify

- `docs/api-spec.md`
- `docs/db-schema.md`
- `docs/architecture.md`
- `docs/conventions.md`
- `frontend/docs/**`
- `frontend/assets/**`
- `mock-data/**`
- Backend, RAG Pipeline, DB 관련 파일

## Test Plan

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `./scripts/format.sh`
- `./scripts/lint.sh`
- `./scripts/test.sh`
- `./scripts/verify.sh`

## Acceptance Criteria

- 현재 작업 루트에서 frontend 앱이 설치 및 실행 가능한 상태가 된다.
- Vue Router, Pinia, Tailwind, MSW가 앱 부팅 경로에 연결된다.
- Chat 우선 구현을 위한 폴더 구조와 shell이 준비된다.
- API 호출은 `src/api/` 레이어로 격리된다.
- mock 데이터는 실제 API wrapper 구조와 같은 타입을 따른다.
- 요청 범위를 넘어 실제 화면 상세 구현이나 API/DB/인증 변경을 하지 않는다.

## Assumptions

- 앱 골격은 현재 작업 루트에 생성한다.
- `frontend/docs/components.md`는 없고 `frontend/docs/componets.md`가 존재하므로, 기존 파일명을 변경하지 않고 해당 문서를 참조한다.
- 이번 change-set은 “기본 골격”까지만 포함하고, Chat 상세 UI는 다음 feature 작업에서 진행한다.
