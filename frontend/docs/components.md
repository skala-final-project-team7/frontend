# Frontend Components Spec

Design: `frontend/docs/frames/`
순서: **1) Chat → 2) Auth/Onboarding → 3) Settings 모달**

---

## Phase 1. Chat (SCR-400 ~ 600)
레이아웃: 좌 Sidebar + 우 ChatMain + 좌하단 SettingsEntry

### Sidebar
- **닫힘**: 검색·채팅목록 아이콘 → 중앙 **모달**
- **열림**: 같은 기능을 사이드바 **인라인**으로
- 토글 hover 시 "사이드바 열기/닫기" 툴팁

### ChatSearchBar
placeholder "채팅 검색". 실시간 필터링 + 키워드 하이라이팅, 입력 디바운스, 빈 상태 처리. 모달일 땐 ESC/백드롭/X 닫기.

### ChatList / ChatListItem
섹션: **고정 채팅** / **최근 채팅**. hover 시 케찹(⋮) → `고정`/`이름 변경`/`삭제` (고정된 건 `고정 해제`). 이름 변경은 인라인 편집. 활성 채팅 시각 구분. 고정·삭제 후 토스트, 삭제는 `되돌리기` 액션 포함.

### ChatEmptyState (SCR-400)
ASK LINA 로고 + "skp_symbol-nobg.png" + "환영합니다. {이름}님" +`mascot-realize-nobg.png` + `PreviewPageStack`(PreviewPageCard 2개)

### MessageInput
placeholder "무엇이든 물어보세요...". Enter 전송 / Shift+Enter 줄바꿈, 멀티라인 자동 높이. Send 버튼: default(주황)/hover(짙은 주황)/disabled(회색, 스트리밍 중). 스트리밍 중 우측 `취소` 버튼. 하단 고지: 첫 진입 Terms / 대화 중 "LINA는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.".

### MessageBubble (SCR-410)
사용자/LINA 시각 구분. LINA 답변은 **SSE 청크 누적**, RAG 단계 라벨 노출. 답변 하단 `출처`·`Check Reference` 버튼. 마크다운 렌더링, 스트리밍 중 스크롤 하단 고정.

### ChatAsyncState (SCR-400 / SCR-410)

#### Initial Loading

- 페이지 최초 진입 시 사용자 정보와 대화 목록을 조회하는 동안 `BaseSpinner` 기반 원형 로딩 표시를 Chat 영역 상단 가운데에 노출한다.
- 대화 route 진입 후 메시지 이력을 불러오는 동안에도 동일한 상단 중앙 loading 영역을 사용한다.
- Header와 MessageInput 고정 레이아웃은 유지하며, loading 표시가 별도의 내부 scroll container를 만들지 않도록 한다.

#### ErrorRetryState

- 조회 실패나 스트리밍 실패 시 기술적인 에러 문자열을 답변 본문에 그대로 출력하지 않고, 사용자가 이해할 수 있는 안내 문구와 다시 시도 아이콘 버튼이 포함된 message box를 표시한다.
- message box에는 오류 상태를 표현하기 위해 `mascotWrongImageUrl`을 사용할 수 있으며, 다시 시도 아이콘 버튼에는 `aria-label="다시 시도"`를 제공한다.
- 다시 시도 요청 진행 중에는 중복 요청을 막고 버튼 위치에 loading 상태를 표시한다.

| 실패 상황 | 표시 위치 / 안내 | 다시 시도 동작 |
| --- | --- | --- |
| 초기 사용자 정보 또는 대화 목록 조회 실패 | Chat 영역 상단 중앙 error message box. 예: "화면을 불러오지 못했어요. 다시 시도해 주세요." | 사용자 정보와 대화 목록 조회를 다시 실행 |
| 기존 대화 메시지 이력 조회 실패 | 해당 conversation의 메시지 영역 error message box. 예: "대화를 불러오지 못했어요. 다시 시도해 주세요." | 현재 route의 conversation messages를 다시 조회 |
| SSE 연결 실패, 응답 중단 또는 backend `error` 이벤트 | 실패한 assistant 응답 위치에 inline error message box. 예: "답변을 불러오지 못했어요. 다시 시도해 주세요." | 같은 conversation과 질문으로 답변 스트리밍을 다시 요청 |

#### Offline State

- 브라우저가 offline 상태이거나 네트워크 단절로 요청이 실패한 경우 일반 서버 오류와 구분해 "인터넷 연결을 확인한 후 다시 시도해 주세요." message box를 표시한다.
- 이미 표시 중인 대화 이력은 offline 상태에서도 유지하며, 새 조회 또는 SSE 재시도 실패 때문에 기존 메시지를 비우지 않는다.
- SSE 진행 중 offline이 감지되면 해당 assistant 응답 위치를 offline error message box로 전환하고, 연결 복구 후 다시 시도 아이콘으로 동일 질문을 재전송할 수 있게 한다.
- offline 상태에서 다시 시도를 누르면 현재 연결 상태를 확인하고, 연결이 복구된 경우에만 요청을 재개한다.

#### Streaming Status Rule

- 정상 스트리밍 중 RAG 단계 라벨은 backend `status` 이벤트의 `message` 값을 그대로 렌더링한다.
- loading/error/offline 안내 문구는 transport 및 화면 상태를 설명하는 UI 문구이며, `phase` 기준으로 RAG 진행 문구를 프론트에서 생성하는 용도로 사용하지 않는다.

### MessageEdit (SCR-420)

TODO: backend message version list 및 이후 대화 재생성 계약 확정 후 구현. 계약 확정 전에는 사용자 메시지 수정 아이콘과 version navigation을 노출하지 않는다.

후속 계약 협의 항목 (현재 API 계약 아님):

- 사용자 수정본을 식별할 `messageId`/`versionId`와 현재 선택된 version 정보
- 각 version에 대응하는 user message와 재생성된 assistant answer 묶음 조회 형태
- 수정 제출 시 새 version 생성 및 SSE answer stream과 연결되는 request/response 흐름
- 이전/다음 version 전환 시 source/verification/meta 데이터의 version 귀속 여부

### ScrollToBottomButton
최하단 아닐 때만 노출 → 최신 메시지로 이동.

### ReferencePanel (SCR-500 / SCR-510)
`Check Reference` 클릭 → 우측 슬라이드인. **열릴 때 사이드바 자동 닫힘.** 헤더 "검색 결과 (N개)", 뷰 토글 **List/Graph**.
- **ReferenceCard (SCR-500)**: Title / Path(`스페이스 > 페이지 > ...`) / 최종 수정자·일 / URL 복사·원본 이동 아이콘. Hover 시 미리보기 + 키워드 하이라이팅. 오래된 문서는 뱃지 구분.
- **ReferenceGraph (SCR-510)**: 노드 클릭 시 강조 테두리 + 미리보기. 줌/팬 지원.

### FollowUpSuggestions (SCR-600)
답변 하단 추천 칩, 선택 시 최하단 스크롤·primary 색 강조. **multi-turn 컨텍스트 유지.**

## Phase 2. Auth / Onboarding (SCR-100 ~ 310)
- Footer `©2026 LINA | SKALA`.
- **SCR-100 LandingPage**: `LINA` 인트로 애니메이션 → 헤드라인 → `Continue with Confluence` CTA
- **SCR-200 Login**: Confluence OAuth 2.0, 서비스 설명·약관 링크
- **SCR-300 OnboardingPage**: 4-step (Connect→Import→Index→Ready). 현재 step 강조. Import 중 `취소`/`완료`.
- **SCR-310 OnboardingDone**: 모든 step 완료 시 `Go to Chat` 활성. `Back to home` 항상 활성.

## Phase 3. Settings 모달 (SCR-700 / SCR-710 / SCR-720)
좌하단 '설정 및 도움말' 클릭 → 중앙 모달. 좌측 탭 + 우측 콘텐츠. ESC/백드롭/X 닫기, 포커스 트랩, 본문 스크롤 잠금.
- **SCR-700 일반**: 채팅 히스토리 관리 (30일 보관). `선택`/`되돌려놓기`/`영구 삭제`(confirm 모달).
- **SCR-710 계정**: Confluence Client_id, 인증 갱신일, "90일마다 갱신" 안내, `Confluence로 이동하기`
- **SCR-720 데이터**: `새로 고침`(5~10분) / 자동 동기화 토글 / 마지막 동기화 시각

## Shared
`BaseButton` `BaseIconButton` `BaseModal` `BaseToast` `BaseTooltip` `BaseSpinner` `EmptyState` `Highlight` `StepIndicator` `DropdownMenu` ...

## Cross-cutting
- 비동기 컴포넌트는 **로딩/에러/빈 상태** 모두 처리
- 아이콘 버튼 `aria-label`, 모달 포커스 트랩, 키보드 전용 조작 가능
- 답변·검색결과는 항상 confluence 내의 데이터 - **출처/최신성/작성자** 노출
- API 응답 타입 추정 금지 → `docs/api-spec.md` 확인인
