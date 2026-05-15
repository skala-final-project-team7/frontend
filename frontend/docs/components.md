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

### MessageEdit (SCR-420)
사용자 메시지에 수정 아이콘 → 클릭 시 인라인 편집 모드. `취소`/`보내기` 버튼. 보내기 시 이후 대화 재생성.

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