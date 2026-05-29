# FE API Spec

> 목적: Frontend가 직접 호출하거나 화면 구현에 알아야 하는 API 계약만 `docs/api-spec.md`에서 추려 정리한다.
> 기준 문서: `docs/api-spec.md` v2.2.1
> 추가 범위: OAuth 이후 `Connect -> Import -> Index -> Ready` 온보딩 진행 상태 API 제안

---

## 1. 원칙

- Frontend는 BFF endpoint만 호출한다.
- Frontend는 FastAPI / ML 내부 endpoint(`/ml/*`)를 직접 호출하지 않는다.
- Confluence OAuth token, access token, cloudId 등 민감 정보는 Frontend에 노출하지 않는다.
- 일반 JSON API는 Common Response Wrapper를 사용한다.
- Chat SSE API는 Wrapper를 사용하지 않고 event stream을 수신한다.
- timestamp는 `docs/api-spec.md` 기준대로 KST `+09:00` 문자열을 사용한다.

---

## 2. Common Response Wrapper

성공:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "요청 성공 메시지",
  "data": {}
}
```

실패:

```json
{
  "isSuccess": false,
  "code": 404,
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "해당 리소스를 찾을 수 없습니다"
}
```

공통 Header:

| Name | Type | Required | Description |
|---|---|---:|---|
| `Content-Type` | string | Y | `application/json` |
| `Authorization` | string | Y | `Bearer {JWT 토큰}`. 인증 도입 이후 필수 |

---

## 3. FE가 사용하는 API 목록

`docs/api-spec.md` 기준으로 Frontend가 직접 호출하는 API는 아래와 같다.

### 3.1 Auth / User

| Method | URL | 용도 | 상태 |
|---|---|---|---|
| `GET` | `/api/auth/login` | Confluence OAuth 로그인 시작 | 기존 spec에 예정 항목 존재 |
| `GET` | `/api/auth/callback` | OAuth callback 처리 | FE가 직접 fetch하기보다 redirect 대상 |
| `POST` | `/api/auth/refresh` | Refresh Token 기반 JWT 갱신 | 기존 spec에 예정 항목 존재 |
| `POST` | `/api/auth/logout` | 로그아웃 | 기존 spec에 예정 항목 존재 |
| `GET` | `/api/users/me` | 현재 로그인 사용자 정보 조회 | 기존 spec에 응답 예시 존재 |

### 3.2 Onboarding / Knowledge Base

| Method | URL | 용도 | 상태 |
|---|---|---|---|
| `GET` | `/api/onboarding/status` | OAuth 연결 및 지식베이스 구축 4단계 상태 조회 | 이 문서에서 제안 |
| `POST` | `/api/onboarding/ingest/retry` | 실패한 지식베이스 구축 재시도 | 이 문서에서 선택 제안 |
| `POST` | `/api/onboarding/ingest/cancel` | 진행 중인 지식베이스 구축 취소 | 이 문서에서 선택 제안 |

### 3.3 Chat

| Method | URL | 용도 |
|---|---|---|
| `POST` | `/api/conversations` | 새 대화 생성 |
| `GET` | `/api/conversations` | 대화 목록 조회 |
| `GET` | `/api/conversations?query={keyword}` | 채팅 제목/내용 검색 |
| `GET` | `/api/conversations/{conversationId}/messages` | 대화 메시지 이력 조회 |
| `PATCH` | `/api/conversations/{conversationId}` | 대화 제목/고정 상태 수정 |
| `DELETE` | `/api/conversations/{conversationId}` | 대화 삭제 |
| `POST` | `/api/conversations/{conversationId}/chat` | 질문 전송 및 SSE 답변 수신 |
| `POST` | `/api/messages/{messageId}/feedback` | 답변 피드백 등록 |

### 3.4 Reference / Confluence Preview

| Method | URL | 용도 | 상태 |
|---|---|---|---|
| `GET` | `/api/confluence/pages/preview?pageId={pageId}` | 출처 hover preview 조회 | 기존 spec에 예정 항목 존재 |

### 3.5 Admin / Data

| Method | URL | 용도 | 비고 |
|---|---|---|---|
| `POST` | `/api/admin/ingest` | 관리자용 수집 수동 트리거 | 일반 사용자 온보딩용으로 직접 쓰기에는 부적합 |
| `GET` | `/api/admin/ingest/status/{jobId}` | 관리자용 수집 상태 조회 | 온보딩 UI에는 `/api/onboarding/status` 권장 |
| `GET` | `/api/admin/stats` | 서비스 통계 조회 | 관리자 화면 |
| `GET` | `/api/admin/users` | 사용자 현황 조회 | 관리자 화면 |
| `GET` | `/api/admin/data` | 데이터 현황 조회 | 관리자 화면 |
| `GET` | `/api/admin/feedback` | 피드백 현황 조회 | 관리자 화면, 상세 응답은 추가 정의 필요 |
| `GET` | `/api/admin/sync` | 동기화 이력 조회 | 관리자 화면 |

---

## 4. Auth / User API

### 4.1 OAuth 로그인 시작

```http
GET /api/auth/login
```

FE 처리:

- 로그인 버튼 또는 `Continue with Confluence` CTA 클릭 시 해당 URL로 페이지 이동한다.
- 일반 `fetch`가 아니라 browser navigation으로 처리하는 것이 자연스럽다.
- BFF 또는 Authorization Server가 Confluence OAuth 인증 URL로 redirect한다.

### 4.2 OAuth Callback

```http
GET /api/auth/callback
```

FE 처리:

- 사용자가 직접 호출하지 않는다.
- OAuth provider가 redirect하는 callback URL이다.
- BFF는 code 처리, 사용자 생성/갱신, JWT 발급, connection 저장을 수행한다.
- 최초 연결 사용자라면 지식베이스 구축 job을 시작하고 `/onboarding`으로 redirect하는 방향을 권장한다.

> 논의 필요: callback 이후 최초/기존 사용자 여부와 관계없이 일단 `/onboarding`으로 redirect하고, `/api/onboarding/status`가 `canGoToChat` 및 step 상태를 내려주는 방식도 가능하다. 다만 ingest job 시작 시점을 callback에서 처리할지, onboarding status 조회 시 처리할지는 BE/ML과 합의가 필요하다.

### 4.3 현재 사용자 조회

```http
GET /api/users/me
```

Response:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "사용자 정보 조회 성공",
  "data": {
    "userId": "user-001",
    "name": "이다연",
    "email": "dayeon@example.com",
    "role": "USER",
    "profileImageUrl": "https://...",
    "lastLoginAt": "2026-05-20T18:00:00+09:00"
  }
}
```

Enum:

```text
role: USER | ADMIN
```

---

## 5. Onboarding / Knowledge Base API

현재 `docs/api-spec.md`에는 관리자용 수집 API와 BFF -> ML 내부 수집 API는 존재하지만, 일반 사용자 온보딩 화면의 `Connect -> Import -> Index -> Ready` 표시용 API는 없다.

따라서 FE에는 아래 BFF API를 추가하는 방향을 권장한다.

### 5.1 온보딩 상태 조회

```http
GET /api/onboarding/status
```

설명:

- 현재 사용자의 Confluence OAuth 연결 여부와 지식베이스 구축 진행 상태를 조회한다.
- FE는 이 API만 polling한다.
- BFF는 내부적으로 FastAPI `/ml/ingest/status/{jobId}`를 조회하고, FE 4-step 상태로 변환한다.

> 논의 필요: 이 endpoint는 기본적으로 조회 전용으로 두는 것이 좋다. connection은 있지만 ingest job이 없는 경우, job을 자동 시작할지 별도 `POST /api/onboarding/ingest/start`를 둘지 결정해야 한다.

Response:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "온보딩 상태 조회 성공",
  "data": {
    "currentStep": "INDEX",
    "canGoToChat": false,
    "connection": {
      "isConnected": true,
      "siteName": "SKALA Confluence",
      "connectedAt": "2026-05-29T10:00:00+09:00"
    },
    "ingestJob": {
      "jobId": "job-uuid-001",
      "status": "IN_PROGRESS",
      "startedAt": "2026-05-29T10:00:05+09:00",
      "updatedAt": "2026-05-29T10:03:12+09:00"
    },
    "steps": [
      {
        "step": "CONNECT",
        "label": "Connect",
        "status": "COMPLETED",
        "completedAt": "2026-05-29T10:00:00+09:00"
      },
      {
        "step": "IMPORT",
        "label": "Import",
        "status": "COMPLETED",
        "progress": {
          "total": 150,
          "completed": 150,
          "failed": 0
        },
        "completedAt": "2026-05-29T10:02:10+09:00"
      },
      {
        "step": "INDEX",
        "label": "Index",
        "status": "IN_PROGRESS",
        "progress": {
          "total": 150,
          "completed": 87,
          "failed": 0
        }
      },
      {
        "step": "READY",
        "label": "Ready",
        "status": "PENDING"
      }
    ]
  }
}
```

Field rules:

| Field | Type | Required | Description |
|---|---|---:|---|
| `currentStep` | string | Y | 현재 대표 단계 |
| `canGoToChat` | boolean | Y | 채팅 화면 진입 가능 여부 |
| `connection.isConnected` | boolean | Y | Confluence OAuth 연결 여부 |
| `connection.siteName` | string | N | 연결된 Confluence site 표시명 |
| `ingestJob.jobId` | string | N | 연결된 수집 job ID |
| `ingestJob.status` | string | N | 수집 job 상태 |
| `steps` | array | Y | FE step indicator 표시용 상태 목록 |

Enum:

```text
currentStep: CONNECT | IMPORT | INDEX | READY
step.status: PENDING | IN_PROGRESS | COMPLETED | FAILED
ingestJob.status: STARTED | IN_PROGRESS | COMPLETED | FAILED | CANCELED
```

FE 처리 규칙:

- `steps[].status` 기준으로 4단계 UI를 렌더링한다.
- `canGoToChat=true`일 때만 `Go to Chat` 버튼을 활성화한다.
- 알 수 없는 enum은 화면을 깨뜨리지 않고 직전 상태 유지 또는 fallback 상태로 처리한다.
- polling 간격은 2초 또는 3초를 권장한다.
- `canGoToChat=true` 또는 `FAILED` 상태 도달 시 polling을 중단한다.

OAuth 연결 없음 Response:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "온보딩 상태 조회 성공",
  "data": {
    "currentStep": "CONNECT",
    "canGoToChat": false,
    "connection": {
      "isConnected": false
    },
    "ingestJob": null,
    "steps": [
      {
        "step": "CONNECT",
        "label": "Connect",
        "status": "IN_PROGRESS"
      },
      {
        "step": "IMPORT",
        "label": "Import",
        "status": "PENDING"
      },
      {
        "step": "INDEX",
        "label": "Index",
        "status": "PENDING"
      },
      {
        "step": "READY",
        "label": "Ready",
        "status": "PENDING"
      }
    ]
  }
}
```

FastAPI 상태 조회 실패:

```json
{
  "isSuccess": false,
  "code": 502,
  "errorCode": "INGEST_PIPELINE_UNAVAILABLE",
  "message": "지식베이스 구축 상태를 조회할 수 없습니다"
}
```

### 5.2 지식베이스 구축 재시도 (논의 예정)

선택 API다. 실패한 ingest job을 다시 시작하는 액션이며, 상태 조회 API가 아니다. FE는 이 API 호출 성공 후 `GET /api/onboarding/status` polling을 재개한다.

```http
POST /api/onboarding/ingest/retry
```

처리 규칙:

- 이전 job이 `FAILED` 또는 `CANCELED`일 때만 재시도를 허용한다.
- 기존 job이 `IN_PROGRESS`이면 `409 CONFLICT`를 반환한다.
- 이미 `COMPLETED`이면 retry 대신 데이터 새로고침 또는 동기화 API 사용을 검토한다.
- 성공 응답은 새 job 시작 정보만 반환하고, 4-step 전체 상태는 `GET /api/onboarding/status`에서 조회한다.

Response:

```json
{
  "isSuccess": true,
  "code": 202,
  "message": "지식베이스 구축 재시도 시작",
  "data": {
    "jobId": "job-uuid-002",
    "status": "STARTED",
    "startedAt": "2026-05-29T10:10:00+09:00"
  }
}
```

Conflict Response:

```json
{
  "isSuccess": false,
  "code": 409,
  "errorCode": "INGEST_ALREADY_IN_PROGRESS",
  "message": "이미 지식베이스 구축이 진행 중입니다"
}
```

### 5.3 지식베이스 구축 취소

선택 API다. FastAPI worker가 실제 cancel을 지원할 때만 노출한다.

```http
POST /api/onboarding/ingest/cancel
```

Response:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "지식베이스 구축 취소 요청 성공",
  "data": {
    "jobId": "job-uuid-001",
    "status": "CANCELED"
  }
}
```

---

## 6. Chat API

### 6.1 새 대화 생성

```http
POST /api/conversations
```

Response:

```json
{
  "isSuccess": true,
  "code": 201,
  "message": "새 대화 생성 성공",
  "data": {
    "conversationId": "conv-uuid-001",
    "title": "새 대화",
    "isPinned": false,
    "createdAt": "2026-05-06T19:00:00+09:00"
  }
}
```

### 6.2 대화 목록 조회

```http
GET /api/conversations?page=0&size=20
```

Query Parameters:

| Key | Type | Required | Default | Description |
|---|---|---:|---|---|
| `page` | number | N | `0` | 페이지 번호 |
| `size` | number | N | `20` | 페이지 크기 |
| `query` | string | N | 없음 | 채팅 제목/메시지 본문 검색어 |

검색 처리 규칙:

- `query`가 없으면 기존 대화 목록을 반환한다.
- `query`가 있으면 backend가 저장소에서 채팅 제목과 메시지 본문을 검색해 반환한다.
- 응답 구조는 일반 목록 조회와 동일하다.
- 정렬은 고정(`isPinned`) 우선, 이후 `lastMessageAt` 최신순을 기본으로 한다.
- FE는 검색 입력 중 자동 호출하지 않고, Enter 키 입력 또는 검색 버튼 클릭 시 `GET /api/conversations?query={keyword}&page=0&size=20`로 조회한다.

Response:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "대화 목록 조회 성공",
  "data": {
    "conversations": [
      {
        "conversationId": "conv-uuid-001",
        "title": "S3 권한 오류 해결 방법",
        "lastMessageAt": "2026-05-06T19:05:00+09:00",
        "messageCount": 4,
        "isPinned": true
      }
    ],
    "totalCount": 15,
    "page": 0,
    "size": 20
  }
}
```

Search Example:

```http
GET /api/conversations?query=S3&page=0&size=20
```

### 6.3 대화 메시지 이력 조회

```http
GET /api/conversations/{conversationId}/messages
```

Response:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "메시지 이력 조회 성공",
  "data": {
    "conversationId": "conv-uuid-001",
    "messages": [
      {
        "messageId": "msg-uuid-001",
        "role": "USER",
        "content": "지난번 S3 버킷 권한 오류 때 어떻게 해결했어?",
        "createdAt": "2026-05-06T19:00:00+09:00"
      },
      {
        "messageId": "msg-uuid-002",
        "role": "ASSISTANT",
        "content": "S3 권한 오류는 IAM 정책을 수정하여 해결했습니다...",
        "sources": [
          {
            "title": "S3 트러블슈팅 가이드",
            "pageId": "12345",
            "spaceId": "98310",
            "spaceName": "Cloud Control Center",
            "url": "https://confluence.example.com/pages/12345",
            "sourceUpdatedAt": "2026-04-15T18:30:00+09:00",
            "relevanceScore": 0.92
          }
        ],
        "confidenceScore": 0.85,
        "verificationResult": "SUPPORTED",
        "createdAt": "2026-05-06T19:00:05+09:00"
      }
    ]
  }
}
```

### 6.4 대화 제목 / 고정 상태 수정

```http
PATCH /api/conversations/{conversationId}
```

Request:

```json
{ "title": "S3 권한 오류 트러블슈팅" }
```

또는 고정 상태 변경:

```json
{ "isPinned": true }
```

### 6.5 대화 삭제

```http
DELETE /api/conversations/{conversationId}
```

### 6.6 챗봇 질의 SSE

```http
POST /api/conversations/{conversationId}/chat
```

Request:

```json
{ "question": "지난번 S3 버킷 권한 오류 때 어떻게 해결했어?" }
```

Response는 SSE이며 Common Response Wrapper를 사용하지 않는다.

Event types:

| Event | Payload | FE 처리 |
|---|---|---|
| `status` | `{ "phase": string, "message": string }` | 현재 assistant message loading 문구 표시 |
| `token` | `{ "content": string }` | 답변 본문 chunk 누적 |
| `sources` | `{ "sources": Source[] }` | 답변 출처 목록 저장 |
| `verification` | `{ "confidenceScore": number, "verificationResult": string }` | 신뢰도/검증 결과 저장 |
| `meta` | `{ "intent": string, "used_llm": string, "feedback_enabled": boolean, "latency_ms": number, "title"?: string }` | 현재 구현 호환. FE는 주로 `title`만 사용 |
| `done` | `{ "messageId": string }` | 스트림 종료 및 서버 messageId 반영 |
| `error` | `{ "errorCode": string, "message": string }` | 오류 표시 후 스트림 종료 |

Status phase:

```text
connecting -> acl_filtering -> searching -> answering -> streaming -> verifying -> formatting
```

FE 처리 규칙:

- `status.message`를 화면 문구로 표시한다.
- 분기 로직은 `message`가 아니라 `phase` 기준으로 처리한다.
- 알 수 없는 `phase`는 무시하거나 직전 상태를 유지한다.
- 검색 결과가 0건이면 일부 phase가 생략될 수 있다.

### 6.7 피드백 등록

```http
POST /api/messages/{messageId}/feedback
```

Request:

```json
{
  "rating": "LIKE",
  "comment": "정확한 답변이었어요"
}
```

Enum:

```text
rating: LIKE | DISLIKE
```

---

## 7. Reference / Preview API

### 7.1 Confluence 페이지 미리보기

```http
GET /api/confluence/pages/preview?pageId={pageId}
```

사용 위치:

- 출처 목록 hover preview
- Chat 메인 추천 문서 preview

Response:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "Confluence 페이지 미리보기 조회 성공",
  "data": {
    "pageId": "12345",
    "title": "S3 트러블슈팅 가이드",
    "spaceName": "Cloud Control Center",
    "authorName": "Platform Team",
    "updatedAt": "2026-04-15T18:30:00+09:00",
    "breadcrumbs": ["Cloud Control Center", "AWS", "S3", "S3 트러블슈팅 가이드"],
    "pageUrl": "https://confluence.example.com/pages/12345",
    "bodyViewValue": "<h1>S3 트러블슈팅 가이드</h1><p>S3 권한 오류는...</p>"
  }
}
```

처리 규칙:

- Frontend는 출처 목록 문서 hover 시 `pageId`를 담아 BFF에 요청한다.
- BFF는 서버에 저장된 OAuth 토큰으로 Confluence REST API를 호출한다.
- BFF는 Confluence 응답의 `body.view.value` HTML 문자열을 `bodyViewValue`로 변환해 반환한다.
- BFF는 Confluence 응답의 `space.name`, `ancestors[].title`, `title`을 조합해 `breadcrumbs`를 파생한다.
- Frontend는 `bodyViewValue`를 DOMPurify로 sanitize한 뒤 `v-html`로 렌더링한다.
- 원본 열기 아이콘 클릭 시 `pageUrl`을 새 탭에서 연다.
- BFF는 OAuth token을 FE에 노출하지 않는다.

---

## 8. Admin API

관리자 화면에서만 사용한다. 일반 사용자 온보딩 화면은 이 API를 직접 사용하지 않는 방향을 권장한다.

### 8.1 데이터 수집 수동 트리거

```http
POST /api/admin/ingest
```

Request:

```json
{ "spaceKey": "CPC" }
```

Response:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "데이터 수집 작업 시작",
  "data": {
    "jobId": "job-uuid-001",
    "status": "STARTED",
    "startedAt": "2026-05-06T19:00:00+09:00"
  }
}
```

### 8.2 데이터 수집 상태 조회

```http
GET /api/admin/ingest/status/{jobId}
```

Response:

```json
{
  "isSuccess": true,
  "code": 200,
  "message": "수집 상태 조회 성공",
  "data": {
    "jobId": "job-uuid-001",
    "status": "IN_PROGRESS",
    "totalPages": 150,
    "processedPages": 87,
    "failedPages": 2,
    "startedAt": "2026-05-06T19:00:00+09:00"
  }
}
```

Enum:

```text
status: STARTED | IN_PROGRESS | COMPLETED | FAILED
```

### 8.3 관리자 대시보드 조회

`docs/api-spec.md`에 예정된 관리자 API:

```text
GET /api/admin/stats
GET /api/admin/users
GET /api/admin/data
GET /api/admin/feedback
GET /api/admin/sync
```

현재 FE에서 Settings/Data 화면만 우선 구현한다면 `GET /api/admin/data`, `GET /api/admin/sync`가 우선순위가 높다.

---

## 9. BFF 내부에서만 사용하는 FastAPI 계약 참고

이 섹션은 FE가 직접 호출하지 않는다. FE 온보딩 상태 API를 설계하기 위해 BFF가 참고해야 하는 내부 계약이다.

현재 `docs/api-spec.md` 기준:

```text
POST /ml/ingest
GET  /ml/ingest/status/{jobId}
GET  /ml/ingest/health
```

`POST /ml/ingest`는 Confluence 문서 수집, 청킹, 임베딩 파이프라인을 실행한다. 즉 `Import`, `Chunking`, `Embedding`, `Indexing`은 FastAPI / ML Data Ingestion Pipeline 책임이다.

현재 `/ml/ingest/status/{jobId}`는 관리자용 상태와 동일한 수준으로 정의되어 있어 `Import`와 `Index`를 FE에서 분리하기 어렵다. BFF가 4-step 상태를 안정적으로 만들려면 FastAPI 상태 응답에 stage 정보가 필요하다.

권장 FastAPI status payload:

```json
{
  "jobId": "job-uuid-001",
  "status": "IN_PROGRESS",
  "currentStage": "EMBEDDING",
  "spaceKey": "CPC",
  "startedAt": "2026-05-29T10:00:05+09:00",
  "updatedAt": "2026-05-29T10:03:12+09:00",
  "stages": [
    {
      "stage": "IMPORT",
      "status": "COMPLETED",
      "total": 150,
      "completed": 150,
      "failed": 0
    },
    {
      "stage": "CHUNKING",
      "status": "COMPLETED",
      "total": 150,
      "completed": 150,
      "failed": 0
    },
    {
      "stage": "EMBEDDING",
      "status": "IN_PROGRESS",
      "total": 150,
      "completed": 87,
      "failed": 0
    },
    {
      "stage": "INDEXING",
      "status": "PENDING",
      "total": 150,
      "completed": 0,
      "failed": 0
    }
  ],
  "error": null
}
```

Stage mapping:

| FE Step | FastAPI 조건 | FE 상태 |
|---|---|---|
| `CONNECT` | OAuth connection 존재 | `COMPLETED` |
| `IMPORT` | `IMPORT` 진행 중 | `IN_PROGRESS` |
| `IMPORT` | `IMPORT` 완료 | `COMPLETED` |
| `INDEX` | `CHUNKING`, `EMBEDDING`, `INDEXING` 중 하나 진행 중 | `IN_PROGRESS` |
| `INDEX` | `CHUNKING`, `EMBEDDING`, `INDEXING` 모두 완료 | `COMPLETED` |
| `READY` | job `COMPLETED` 또는 `currentStage=READY` | `COMPLETED` |

---

## 10. 결정 필요 사항

- OAuth callback 직후 BFF가 자동으로 수집 job을 시작할지, FE가 별도 시작 API를 호출할지 결정해야 한다.
- FastAPI `/ml/ingest/status/{jobId}`가 stage별 진행률을 제공할 수 있는지 확인해야 한다.
- `Import`와 `Index`의 경계를 확정해야 한다.
  - 권장: `IMPORT`는 Confluence 원본 수집, `INDEX`는 `CHUNKING + EMBEDDING + INDEXING` 전체.
- 온보딩 화면의 `취소` 버튼을 실제 API로 제공할지, placeholder로 둘지 결정해야 한다.
- 관리자용 `/api/admin/ingest`를 일반 사용자 온보딩에 재사용하지 않을지 확인해야 한다.
