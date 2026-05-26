## Feature: Server-driven RAG Pipeline Progress Streaming

현재 Chat 대화 화면에서는 프론트엔드가 `phase` 값을 기준으로 정적인 상태 문구를 생성하고 있다.

```ts
function resolveStreamingStatusText(phase: ChatStreamingPhase): string {
  if (phase === 'searching') return '검색 중...';
  if (phase === 'verifying') return '검증 중...';
  if (phase === 'answering') return '답변 생성 중...';
  if (phase === 'streaming') return '답변 생성 중...';

  return '';
}
```

이 방식 대신, BFF/FastAPI에서 전달하는 스트리밍 이벤트의 `message` 값을 그대로 렌더링하는 구조로 변경한다.

프론트엔드는 phase 값을 보고 문구를 직접 만들지 않는다.
백엔드가 `status` 이벤트로 전달하는 사용자 표시용 메시지를 수신하고, 해당 메시지를 현재 LINA 응답 영역에 실시간으로 표시한다.

기존 API Spec의 SSE 이벤트 구조를 유지하되, RAG 진행 상태 표시를 위해 `status` 이벤트를 추가한다.

---

## API 기준

현재 Chat Streaming API는 다음 엔드포인트를 사용한다.

```http
POST /api/conversations/{conversationId}/chat
```

Request Body:

```json
{
  "question": "지난번 S3 버킷 권한 오류 때 어떻게 해결했어?"
}
```

SSE 응답은 Common Response Wrapper를 사용하지 않는다.

기존 API Spec 기준 이벤트 타입:

* `token`
* `sources`
* `verification`
* `done`
* `error`

추가할 이벤트 타입:

* `status`

---

## Goal

BFF의 Chat Streaming API 응답을 fetch streaming 방식으로 수신하고, SSE 형식의 이벤트를 파싱하여 타입별로 처리한다.

처리 대상 이벤트는 다음과 같다.

* `status`: RAG 파이프라인 진행 상태 메시지 표시
* `token`: LINA 답변 본문 chunk 누적 렌더링
* `sources`: 답변에 사용된 RAG 참조 문서 목록 저장
* `verification`: 답변 신뢰도 검증 결과 저장
* `done`: 스트리밍 정상 종료 처리
* `error`: 스트리밍 오류 처리

---

## RAG Pipeline Phase 기준

RAG 파이프라인 설계서 기준 Query 흐름은 다음 순서로 진행된다.

```text
사용자 질문 + JWT
→ ACL Pre-filtering
→ 멀티턴 히스토리 관리자
→ 질의 라우터
→ Multi-Pool Hybrid Search
→ Cross-Encoder 재순위화
→ 답변 생성기
→ 답변 검증
→ 응답 포맷터
→ UI JSON
```

프론트엔드는 이 흐름에 맞춰 백엔드가 내려주는 `status.message`를 표시한다.

---

## Stream Event Types

### 1. status event

RAG 파이프라인 진행 상황을 화면에 표시하기 위한 이벤트이다.

```text
event: status
data: {"phase":"acl_filtering","message":"사용자 권한 범위 내에서 접근 가능한 문서를 확인하고 있습니다."}
```

지원 phase는 다음과 같다.

```ts
export type ChatStreamingPhase =
  | 'connecting'
  | 'acl_filtering'
  | 'searching'
  | 'answering'
  | 'streaming'
  | 'verifying'
  | 'formatting';
```

각 phase의 의미는 다음과 같다.

| phase              | 의미                                                   |
| ------------------ | ---------------------------------------------------- |
| `connecting`       | Chat Streaming API 연결 중                              |
| `acl_filtering`    | JWT 기반 사용자 권한 필터 생성 중                                |
| `searching`        | Multi-Pool Hybrid Search 수행 중                        |
| `answering`        | LLM 답변 생성 준비 중                                       |
| `streaming`        | LLM 답변 토큰 스트리밍 중                                     |
| `verifying`        | 답변 근거 검증 중                                           |
| `formatting`       | 출처/검증 결과를 UI 응답 객체로 변환 중                             |

중요: 프론트엔드는 phase별 문구를 직접 생성하지 않는다.
반드시 백엔드에서 전달된 `message` 값을 그대로 표시한다.
`done`과 `error`는 status phase가 아니라 각각 별도 이벤트로 수신한다.

---

### 2. token event

LLM 답변 토큰 또는 chunk를 전달하는 이벤트이다.

API Spec 기준 형식:

```text
event: token
data: {"content":"S3 권한 오류는"}
```

수신한 `content`는 현재 LINA 메시지의 본문에 누적한다.

```ts
currentMessage.content += event.content;
```

---

### 3. sources event

답변 생성에 활용된 RAG 참조 문서 목록을 전달하는 이벤트이다.

주의: 이벤트 이름은 `source`가 아니라 API Spec 기준 `sources`이다.
payload도 단일 source 객체가 아니라 `{ sources: Source[] }` 구조이다.

API Spec 기준 형식:

```text
event: sources
data: {
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
  ]
}
```

프론트엔드는 `sources` 이벤트를 수신하면 현재 LINA 메시지의 `sources` 배열을 갱신한다.

```ts
currentMessage.sources = event.sources;
```

또는 기존 source를 유지하면서 추가해야 하는 경우:

```ts
currentMessage.sources.push(...event.sources);
```

중간 발표 범위에서는 API Spec에 정의된 필드를 기준으로 처리한다.

```ts
export type ChatSource = {
  title: string;
  pageId: string;
  spaceId: string;
  spaceName: string;
  url: string;
  sourceUpdatedAt: string;
  relevanceScore: number;
};
```

추후 첨부 파일 출처를 확장할 경우 아래 필드는 optional로 추가할 수 있다.

```ts
export type ChatSource = {
  title: string;
  pageId: string;
  spaceId: string;
  spaceName: string;
  url: string;
  sourceUpdatedAt: string;
  relevanceScore: number;

  // future extension
  sourceType?: 'page' | 'attachment';
  attachmentId?: string;
  attachmentFilename?: string;
  attachmentMime?: string;
  downloadUrl?: string;
};
```

단, 현재 API Spec과 mock data가 attachment 필드를 제공하지 않는다면 UI에서는 page source 기준으로 먼저 구현한다.

---

### 4. verification event

답변 신뢰도 검증 결과를 전달하는 이벤트이다.

API Spec 기준 형식:

```text
event: verification
data: {
  "confidenceScore": 0.85,
  "verificationResult": "SUPPORTED"
}
```

지원 verification result는 다음과 같다.

```ts
export type VerificationResult =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'NOT_SUPPORTED';
```

수신한 검증 결과는 현재 LINA 메시지의 `confidenceScore`, `verificationResult`에 저장한다.

```ts
currentMessage.confidenceScore = event.confidenceScore;
currentMessage.verificationResult = event.verificationResult;
```

---

### 5. done event

스트리밍 완료 이벤트이다.

API Spec 기준 형식:

```text
event: done
data: {"messageId":"msg-uuid-001"}
```

수신 시 처리한다.

* 현재 메시지의 `isStreaming`을 `false`로 변경
* `statusMessage` 초기화
* `messageId` 저장
* 입력창 disabled 상태 해제

```ts
currentMessage.messageId = event.messageId;
currentMessage.isStreaming = false;
currentMessage.statusMessage = '';
```

---

### 6. error event

스트리밍 중 오류가 발생했을 때 전달되는 이벤트이다.

API Spec 기준 형식:

```text
event: error
data: {
  "code": "ML_SERVER_ERROR",
  "message": "답변 생성 중 오류가 발생했습니다"
}
```

수신 시 처리한다.

* 현재 메시지의 `isStreaming`을 `false`로 변경
* `error` 필드에 메시지 저장
* `statusMessage` 초기화
* 사용자에게 오류 메시지 표시
* 입력창 disabled 상태 해제

```ts
currentMessage.isStreaming = false;
currentMessage.statusMessage = '';
currentMessage.error = event.message;
```

---

## TypeScript Types

`src/types/stream.ts` 또는 기존 API 타입 파일에 아래 타입을 추가하거나 기존 타입과 병합한다.

```ts
export type ChatStreamEvent =
  | ChatStatusEvent
  | ChatTokenEvent
  | ChatSourcesEvent
  | ChatVerificationEvent
  | ChatDoneEvent
  | ChatErrorEvent;

export type ChatStreamingPhase =
  | 'connecting'
  | 'acl_filtering'
  | 'searching'
  | 'answering'
  | 'streaming'
  | 'verifying'
  | 'formatting';

export type ChatStatusEvent = {
  type: 'status';
  phase: ChatStreamingPhase;
  message: string;
};

export type ChatTokenEvent = {
  type: 'token';
  content: string;
};

export type ChatSource = {
  title: string;
  pageId: string;
  spaceId: string;
  spaceName: string;
  url: string;
  sourceUpdatedAt: string;
  relevanceScore: number;

  // future extension
  sourceType?: 'page' | 'attachment';
  attachmentId?: string;
  attachmentFilename?: string;
  attachmentMime?: string;
  downloadUrl?: string;
};

export type ChatSourcesEvent = {
  type: 'sources';
  sources: ChatSource[];
};

export type VerificationResult =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'NOT_SUPPORTED';

export type ChatVerificationEvent = {
  type: 'verification';
  confidenceScore: number;
  verificationResult: VerificationResult;
};

export type ChatDoneEvent = {
  type: 'done';
  messageId: string;
};

export type ChatErrorEvent = {
  type: 'error';
  code: string;
  message: string;
};
```

---

## Message State Model

현재 LINA 메시지는 스트리밍 중 다음 상태를 가질 수 있어야 한다.

```ts
export type LinaMessage = {
  messageId?: string;
  role: 'assistant';
  content: string;

  isStreaming: boolean;
  phase?: ChatStreamingPhase;
  statusMessage?: string;

  sources: ChatSource[];

  confidenceScore?: number;
  verificationResult?: VerificationResult;

  error?: string;
  createdAt?: string;
};
```

기존 메시지 이력 조회 API의 assistant message 구조와 호환되어야 한다.

메시지 이력 조회의 assistant message는 다음 필드를 가진다.

```ts
{
  messageId: string;
  role: 'assistant';
  content: string;
  sources: ChatSource[];
  confidenceScore: number;
  verificationResult: VerificationResult;
  createdAt: string;
}
```

---

## Store Handling

Pinia store 또는 chat message handling 로직에 stream event 처리 함수를 추가한다.

```ts
function handleStreamEvent(event: ChatStreamEvent) {
  switch (event.type) {
    case 'status': {
      currentMessage.phase = event.phase;
      currentMessage.statusMessage = event.message;
      break;
    }

    case 'token': {
      currentMessage.content += event.content;
      currentMessage.phase = 'streaming';
      break;
    }

    case 'sources': {
      currentMessage.sources = event.sources;
      break;
    }

    case 'verification': {
      currentMessage.confidenceScore = event.confidenceScore;
      currentMessage.verificationResult = event.verificationResult;
      break;
    }

    case 'done': {
      currentMessage.messageId = event.messageId;
      currentMessage.isStreaming = false;
      currentMessage.phase = 'done';
      currentMessage.statusMessage = '';
      break;
    }

    case 'error': {
      currentMessage.isStreaming = false;
      currentMessage.phase = 'error';
      currentMessage.statusMessage = '';
      currentMessage.error = event.message;
      break;
    }
  }
}
```

---

## UI Rendering

기존의 정적 phase label 함수 사용을 제거한다.

제거 대상 예시:

```ts
resolveStreamingStatusText(phase)
```

아래와 같은 정적 매핑 함수는 사용하지 않는다.

```ts
function resolveStreamingStatusText(phase: ChatStreamingPhase): string {
  if (phase === 'searching') return '검색 중...';
  if (phase === 'verifying') return '검증 중...';
  if (phase === 'answering') return '답변 생성 중...';
  if (phase === 'streaming') return '답변 생성 중...';

  return '';
}
```

대신 메시지 객체의 `statusMessage`를 직접 렌더링한다.

```vue
<p v-if="message.statusMessage" class="text-sm text-gray-500">
  {{ message.statusMessage }}
</p>
```

LINA 답변 본문은 `token` 이벤트를 통해 누적된 `message.content`를 렌더링한다.

```vue
<MessageBubble>
  {{ message.content }}
</MessageBubble>
```

출처 영역은 `sources` 이벤트를 통해 저장된 `message.sources`를 기준으로 렌더링한다.

```vue
<ReferenceList
  v-if="message.sources.length > 0"
  :sources="message.sources"
/>
```

검증 결과는 `verificationResult`와 `confidenceScore`를 기준으로 표시한다.

```vue
<VerificationBadge
  v-if="message.verificationResult"
  :verification-result="message.verificationResult"
  :confidence-score="message.confidenceScore"
/>
```

---

## Fetch Streaming Parser

BFF의 Chat Streaming API 응답을 fetch streaming 방식으로 읽고, SSE 이벤트를 파싱한다.

```ts
async function streamChat(conversationId: string, question: string) {
  const response = await fetch(`/api/conversations/${conversationId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw new Error(`Streaming request failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('ReadableStream is not available.');
  }

  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const event = parseSseEvent(part);
      chatStore.handleStreamEvent(event);
    }
  }
}
```

---

## SSE Event Parser

SSE 응답은 다음 형식을 기준으로 파싱한다.

```text
event: token
data: {"content":"S3 권한 오류는"}
```

```text
event: sources
data: {"sources":[{"title":"S3 트러블슈팅 가이드","pageId":"12345","spaceId":"98310","spaceName":"Cloud Control Center","url":"https://confluence.example.com/pages/12345","sourceUpdatedAt":"2026-04-15T18:30:00+09:00","relevanceScore":0.92}]}
```

파서 구현 예시:

```ts
function parseSseEvent(raw: string): ChatStreamEvent {
  const lines = raw.split('\n');

  const eventLine = lines.find((line) => line.startsWith('event:'));
  const dataLines = lines.filter((line) => line.startsWith('data:'));

  const eventType = eventLine?.replace('event:', '').trim();

  const dataText = dataLines
    .map((line) => line.replace('data:', '').trim())
    .join('');

  const data = dataText ? JSON.parse(dataText) : {};

  return {
    type: eventType,
    ...data,
  } as ChatStreamEvent;
}
```

주의:

* 아직 완성되지 않은 SSE chunk는 buffer에 남긴다.
* `\n\n` 기준으로 완성된 이벤트만 처리한다.
* 이미 처리한 chunk를 중복 처리하지 않는다.
* API Spec 기준 이벤트명은 `sources`이다. `source`로 처리하지 않는다.

---

## Expected Event Sequence

정상적인 응답 흐름 예시는 다음과 같다.

```text
event: status
data: {"phase":"connecting","message":"LINA가 질문을 분석할 준비를 하고 있습니다."}

event: status
data: {"phase":"acl_filtering","message":"사용자 권한 범위 내에서 접근 가능한 문서를 확인하고 있습니다."}

event: status
data: {"phase":"searching","message":"관련 문서를 검색하고 있습니다."}

event: status
data: {"phase":"answering","message":"상위 문서를 기반으로 답변을 생성하고 있습니다."}

event: status
data: {"phase":"streaming","message":"답변을 작성하고 있습니다."}

event: token
data: {"content":"Confluence OAuth는"}

event: token
data: {"content":" 사용자의 접근 권한을"}

event: token
data: {"content":" 위임받는 인증 방식입니다."}

event: status
data: {"phase":"verifying","message":"답변이 출처 문서에 근거하는지 검증하고 있습니다."}

event: status
data: {"phase":"formatting","message":"답변을 정리하고 있습니다."}

event: sources
data: {"sources":[{"title":"OAuth 인증 가이드","pageId":"12345","spaceId":"98310","spaceName":"Cloud Control Center","url":"https://confluence.example.com/pages/12345","sourceUpdatedAt":"2026-04-15T18:30:00+09:00","relevanceScore":0.92}]}

event: verification
data: {"confidenceScore":0.85,"verificationResult":"SUPPORTED"}

event: done
data: {"messageId":"msg-uuid-001"}
```

---

## Acceptance Criteria

* 프론트엔드에서 phase별 정적 문구 매핑 함수를 사용하지 않는다.
* BFF/FastAPI에서 내려주는 `status.message` 값을 화면에 그대로 표시한다.
* `status` 이벤트 수신 시 현재 LINA 메시지의 `phase`, `statusMessage`가 갱신된다.
* `token` 이벤트 수신 시 현재 LINA 메시지의 본문이 chunk 단위로 누적 렌더링된다.
* `sources` 이벤트 수신 시 현재 LINA 메시지의 출처 목록에 반영된다.
* 이벤트명은 API Spec 기준 `sources`를 사용한다. `source` 단수 이벤트로 처리하지 않는다.
* `sources` payload는 `{ sources: ChatSource[] }` 구조로 처리한다.
* `verification` 이벤트 수신 시 현재 LINA 메시지의 `confidenceScore`, `verificationResult`에 반영된다.
* `done` 이벤트 수신 시 streaming 상태가 종료되고 입력창이 다시 활성화된다.
* `error` 이벤트 수신 시 오류 메시지를 표시하고 streaming 상태가 종료된다.
* 아직 완성되지 않은 SSE chunk는 buffer에 남기고, 완성된 이벤트만 처리한다.
* 이미 처리한 SSE chunk가 중복 렌더링되지 않는다.
