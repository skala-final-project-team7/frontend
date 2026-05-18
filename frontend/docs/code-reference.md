## Coding guidelines for Frontend

### Component Structure
- 컴포넌트는 `pages / features / shared` 3계층으로 분리한다.
  - `pages`: 라우트 단위 (`SearchPage.vue`, `ResultPage.vue`)
  - `features`: 도메인 단위 (`SearchBar.vue`, `ResultCard.vue`, `SourceBadge.vue`, `FilterPanel.vue`)
  - `shared`: 범용 UI (`BaseButton.vue`, `BaseSpinner.vue`, `EmptyState.vue`)
- Composition API를 기본으로 사용한다.
- 컴포넌트당 하나의 역할만 담당한다. 비즈니스 로직은 `composables/`로 분리한다.

### State Management
- UI 상태(필터 열림, 포커스)와 서버 상태(검색 결과, 문서 메타)를 혼동하지 않는다.
- 서버 상태는 Pinia store로 관리한다.
- SSE 스트리밍 연결/해제는 composable(`useSSE`)로 분리하고, 누적 결과만 Pinia에 저장한다.
- UI 상태(로딩, 포커스 등)는 컴포넌트 내 ref로 관리한다.
- `v-model`의 양방향 바인딩 범위를 컴포넌트 경계 밖으로 누출하지 않는다.

### Styling (Tailwind CSS)
- Tailwind CSS를 기본 스타일링 도구로 사용한다.
- 색상·radius·spacing 등은 `/frontend/docs/design-reference.css`의 CSS 변수를 `tailwind.config.js`에 등록해 사용한다.
- 임의값(`bg-[#F48122]`)이나 Tailwind 기본 팔레트(`bg-orange-500`) 직접 사용 금지 — 항상 토큰 이름으로(`bg-primary`).
- 새 UI 컴포넌트 라이브러리는 `package.json`에 이미 있지 않는 한 도입 금지.

### API 연동
- API response 타입을 임의로 추정하지 않는다. `/docs/api-spec.md`를 먼저 확인한다.
- API 응답 타입은 `src/types/api.ts`에 먼저 정의 (`/docs/api-spec.md` 기준).
- 검색 결과에는 `source`, `updated_at`, `relevanceScore` 필드가 포함되어야 하며, 없을 경우 fallback 처리한다.
- API 변경이 필요한 경우 코드보다 spec 문서를 먼저 수정한다.
- API 명세가 없거나 불명확하면 mock data로 구현하고 `// TODO: API_SPEC_REQUIRED`를 남긴다.

### Mock Data Layer

Phase 1은 mock 데이터로 구현하며, 실제 API 연동 시 **컴포넌트 코드 수정 없이** 전환되어야 한다.

#### Layer 격리
- 모든 API 호출은 `src/api/` 레이어를 거친다.
- 컴포넌트와 Pinia store는 `fetch` / `axios`를 직접 호출 금지.
- mock 데이터는 `src/mocks/`에 격리, 실제 응답과 동일한 Wrapper 구조(`isSuccess`/`code`/`message`/`data`)를 유지한다.

#### Type 우선 정의
- API 응답 타입은 `src/types/api.ts`에 먼저 정의 (`/docs/api-spec.md` 기준).
- mock 데이터도 동일 타입을 따른다 — 타입 불일치 시 컴파일 에러로 발견.

#### Mock 처리 방식
- **MSW**(Mock Service Worker)로 fetch를 가로채는 방식 사용.
- 컴포넌트는 실제 endpoint(`/api/conversations`)를 호출하고, mock인지 알지 못한다.
- 환경변수로 토글: `VITE_USE_MOCK=true/false`.

#### 추적 가능성
- mock 핸들러 위치에 `// TODO(MOCK): {endpoint}` 코멘트 필수.
- API 명세가 없거나 불명확하면 `// TODO: API_SPEC_REQUIRED` 코멘트 추가.
- `grep "TODO(MOCK)"` / `grep "API_SPEC_REQUIRED"`로 일괄 추적 가능해야 함.

#### Confluence 원본 응답 참고
`/mock-data/confluence-sample.json`은 BFF가 Confluence API로부터 받아오는 **원본 응답 샘플**이다. Frontend mock의 형태가 아니다.
- Frontend mock은 **BFF가 가공한 응답**(`/docs/api-spec.md`의 Response 형식)을 따라야 한다.
- 이 파일은 BFF가 어떤 가공을 거치는지 추적하거나, 새 필드 필요 시 원본에 있는지 확인할 때만 참고.
- mock 작성 시 이 파일을 직접 참조하지 말 것 — 항상 `api-spec.md` 기준.

#### 폴더 구조
src/
├── api/              # API 호출 레이어 (격리)
│   ├── client.ts     # fetch wrapper, Wrapper 응답 처리
│   ├── conversations.ts
│   ├── messages.ts
│   └── admin.ts
├── types/
│   └── api.ts        # api-spec.md 기준 응답 타입
├── mocks/            # MSW handlers
│   ├── handlers.ts
│   └── data/
├── stores/           # Pinia (서버 상태 누적)
├── composables/      # useSSE, useToast 등
├── pages/            # 라우트 단위
├── features/         # 도메인 단위 컴포넌트
└── shared/           # 범용 UI

### 필수 UI 상태 처리
모든 비동기 UI는 아래 4가지 상태를 명시적으로 처리한다.

| 상태 | 처리 방식 |
|------|-----------|
| Loading | `BaseSpinner` 또는 스켈레톤 |
| Error | 에러 메시지 + 재시도 버튼 |
| Empty | "검색 결과가 없습니다" 안내 (`EmptyState`) |
| Success | 결과 목록 + 출처/날짜 표시 |

### 접근성
- 검색창: `<label>` 또는 `aria-label` 필수, `Enter` 키 제출 지원.
- 결과 카드: 키보드 포커스 가능, `role="article"` 적용.
- 아이콘 전용 버튼: `aria-label` 필수.

---

## Test Rules

- 핵심 플로우(검색어 입력 → 결과 표시 → 출처 클릭)는 Cypress e2e 또는 Vitest integration test로 커버한다.
- 에러/빈 상태 분기는 Vitest + Vue Test Utils로 unit test 작성한다.
- 단순 스타일 변경에 snapshot test를 남발하지 않는다.
- `OutdatedBadge`, `SourceBadge` 등 판단 로직이 있는 shared 컴포넌트는 unit test 필수.