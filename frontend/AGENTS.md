# Frontend AGENTS

## Project

LINA — Confluence 기반 RAG 검색/응답 시스템 (Vue 3 SPA)

## Tech Stack

- Vue 3 + Vite + TypeScript
- Pinia / Vue Router / Tailwind CSS
- 새 UI 라이브러리 추가 금지 (package.json 외)

## Reference Docs

작업 목적에 따라 아래 우선 확인 문서를 확인한다.

> 경로는 모두 **프로젝트 루트 기준**이다.

| 목적                      | 경로                                     |
| ------------------------- | ---------------------------------------- |
| API 명세                  | `/docs/api-spec.md`                      |
| 아키텍처                  | `/docs/architecture.md`                  |
| 화면별 컴포넌트 상세 구현 | `/frontend/docs/components.md`           |
| Frontend 코딩 규칙        | `/frontend/docs/code-reference.md`       |
| Design system reference   | `/frontend/docs/design-reference.css`    |
| UI design for each frame  | `/frontend/docs/frames/`                 |
| 전체 UI 흐름 파악         | `/frontend/docs/frames/*` `/frontend/docs/ui-spec.pdf` |
| Confluence 원본 샘플      | `/mock-data/confluence_sample_data.json` |

## Implementation Order

1. **Chat** (SCR-400 ~ 600) — mock 데이터로 먼저
2. **Auth / Login + Role Selection** (SCR-100 ~ 200) — Onboarding(SCR-300 ~ 310) 제외
3. **Admin** (SCR-800 ~ 830)
4. **Settings 모달** (SCR-700 ~ 720)


## Service Actors

- **일반 사용자(USER)**: Confluence OAuth 로그인 후 Chat 화면으로 진입한다. 별도의 Data Ingestion/Data Sync 작업을 수행하지 않는다.
- **관리자(ADMIN)**: Confluence OAuth 관리자 모드 로그인 후 Admin 화면으로 진입한다. 조직 데이터 적재, 동기화, Admin Key 활성화, 사용 현황 확인을 담당한다.

## Auth / Data Responsibility

- 서비스 시작 화면은 `/` 랜딩 화면이다.
- `/` 랜딩 화면은 3패널 스크롤 구조로 구성한다.
- `/` 랜딩의 마지막 패널은 로그인 진입 패널이며, 최초 CTA는 `Continue with Confluence` 하나만 표시한다.
- `/` 랜딩의 `Continue with Confluence` 클릭 시 즉시 OAuth를 시작하지 않고 `/login`으로 이동한다.
- `/login` 화면은 일반 사용자/관리자 선택 UI를 표시한다.
- 일반 사용자 선택은 `GET /api/auth/login` 흐름으로 연결한다.
- 관리자 선택은 `GET /api/auth/login?mode=admin` 흐름으로 연결한다.
- 사용자가 선택한 역할은 클라이언트의 로그인 의도일 뿐이다. 최종 권한 판단은 BFF/Auth Server가 `mode=admin`, OAuth 결과, `users.role`, `GET /api/users/me`의 `role`을 기준으로 수행한다.
- 일반 사용자는 로그인 후 Chat 화면에서 질의만 수행한다. Data Ingestion/Data Sync/Admin Key 발급 UI는 일반 사용자 화면에 노출하지 않는다.
- 조직 데이터 수집과 동기화는 오직 관리자 화면에서 관리자만 수행한다.
- 관리자는 Admin 화면에서 Admin Key 활성화, Data Ingestion Agent, Data Sync Agent를 통해 조직 전체 문서와 권한 메타데이터를 서비스 DB에 적재/갱신한다.
- Chat 답변 생성은 서비스 DB에 적재된 데이터 중 로그인 사용자의 권한이 허용하는 범위만 사용한다. 권한 없는 문서는 검색, 조회, 답변 생성에 사용하지 않는다.
- Query Routing, History Manager, Answer Generation, Answer Verification 등 Agent 과정은 권한 필터링 이후의 허용 데이터 범위 안에서 수행한다.
- Onboarding(SCR-300 ~ 310)은 현재 로그인 흐름에서 제거하며 route/page/component 구현 대상에서 제외한다.

## Screen Flow

```mermaid
flowchart TD

    Root[/<br/>랜딩 3패널 스크롤] --> LoginEntry[마지막 패널<br/>로그인 진입]
    LoginEntry --> CTA[Continue with Confluence]
    CTA --> SCR200[/login<br/>로그인]
    SCR200 --> RoleSelect{역할 선택}

    RoleSelect --> UserLogin[일반 사용자로 계속]
    RoleSelect --> AdminLogin[관리자로 계속]

    UserLogin --> UserOAuth[/api/auth/login<br/>Confluence OAuth 일반 사용자 모드]
    AdminLogin --> AdminOAuth[/api/auth/login?mode=admin<br/>Confluence OAuth 관리자 모드]

    UserOAuth --> SCR400[SCR-400<br/>챗봇 메인]
    AdminOAuth --> SCR800[SCR-800<br/>관리자 데이터 수집 메인 보드]

    SCR400 --> SCR410[SCR-410<br/>대화]
    SCR410 -->|출처 클릭| SCR500[SCR-500<br/>출처 List]
    SCR410 -->|출처 클릭| SCR510[SCR-510<br/>출처 Graph]
    SCR410 -->|후속 질문| SCR600[SCR-600<br/>후속 질문]
    SCR410 -->|질문 수정| SCR420[SCR-420<br/>질문 수정]
    SCR420 -->|보내기| SCR410

    SCR400 -.설정 및 도움말.-> Settings{{Settings 모달}}
    SCR410 -.설정 및 도움말.-> Settings
    Settings --- SCR700[SCR-700<br/>일반]
    Settings --- SCR710[SCR-710<br/>계정]
    Settings --- SCR720[SCR-720<br/>데이터]

    SCR800 --> SCR810[SCR-810<br/>관리자 추이 확인]
    SCR800 --> SCR820[SCR-820<br/>관리자 피드백 확인]
    SCR800 --> SCR830[SCR-830<br/>관리자 동기화 이력]
```

## Hard Rules

### 작업 시작 전 (화면/컴포넌트 구현 시)

구현을 시작하기 전 **반드시** 아래 순서로 확인한다. 절차 없이 임의로 만들지 않는다.

1. `/frontend/docs/components.md` → 해당 화면/컴포넌트의 동작 사양
2. `/frontend/docs/frames/{screen-id}.png` → 디자인 시안
3. `/frontend/docs/design-reference.css` → 사용할 디자인 토큰 참고
4. `/docs/api-spec.md` → 필요한 API 응답 구조
5. 의문점이 있으면 코드 작성 전 확인 요청

### 코드 작성 시 (항상)

- 디자인 토큰은 `design-reference.css` 참고, Tailwind config에 등록해 사용 — 임의 색상 금지
- 답변·검색 결과에는 항상 **출처 / 작성일자 / 작성자** 노출
- 비동기 컴포넌트는 로딩 / 에러 / 빈 상태 모두 처리
- 그 외 세부 코딩 규칙은 `/frontend/docs/code-reference.md` 준수
