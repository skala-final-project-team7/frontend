/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat Pinia store의 SSE 스트리밍 누적 동작 테스트.
 *           token/source/verification/done/error 이벤트와 stream 취소 처리를 검증한다.
 * 작성일 : 2026-05-21
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-21, feature9 구현, SSE token 누적 store 테스트 추가
 *   - 2026-05-22, feature9 보강, streaming status, AbortSignal, CRLF, error event 회귀 테스트 추가
 *   - 2026-05-22, RAG status 계약 반영, 확정 phase 순서와 meta/unknown phase 테스트 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Pinia 2.3.x, Vitest 2.1.x 기준
 * --------------------------------------------------
 */
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatStore } from '@/stores';

/**
 * status/token/sources/verification/meta/done 이벤트를 한 번에 흘려주는 테스트용 SSE 응답을 만든다.
 *
 * @returns 테스트용 text/event-stream Response
 */
function createSseResponse(): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        controller.enqueue(
          encoder.encode(
            'event: status\ndata: {"phase":"connecting","message":"연결 중이에요"}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'event: status\ndata: {"phase":"acl_filtering","message":"접근 권한을 확인하고 있어요"}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'event: status\ndata: {"phase":"searching","message":"관련 문서를 검색하고 있어요"}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'event: status\ndata: {"phase":"answering","message":"답변을 준비하고 있어요"}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'event: status\ndata: {"phase":"streaming","message":"답변을 작성하고 있어요"}\n\n',
          ),
        );
        controller.enqueue(encoder.encode('event: token\ndata: {"content":"첫 chunk "}\n\n'));
        controller.enqueue(encoder.encode('event: token\ndata: {"content":"두 번째 chunk"}\n\n'));
        controller.enqueue(
          encoder.encode(
            'event: status\ndata: {"phase":"verifying","message":"답변 근거를 검증하고 있어요"}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'event: status\ndata: {"phase":"formatting","message":"답변을 정리하고 있어요"}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'event: sources\ndata: {"sources":[{"title":"S3 트러블슈팅 가이드","pageId":"12345","spaceId":"98310","spaceName":"Cloud Control Center","url":"https://confluence.example.com/pages/12345","updatedAt":"2026-04-15T09:30:00Z","relevanceScore":0.92}]}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'event: verification\ndata: {"confidenceScore":0.91,"verificationResult":"SUPPORTED"}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'event: meta\ndata: {"intent":"운영가이드","used_llm":"gpt-4o","feedback_enabled":true,"latency_ms":1234,"title":"S3 권한 오류 해결 방법"}\n\n',
          ),
        );
        controller.enqueue(encoder.encode('event: done\ndata: {"messageId":"msg-done-001"}\n\n'));
        controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
      },
      status: 200,
    },
  );
}

/**
 * CRLF 줄바꿈을 사용하는 backend SSE 응답을 만든다.
 *
 * @returns CRLF frame 기반 text/event-stream Response
 */
function createCrLfSseResponse(): Response {
  return new Response(
    [
      'event: token\r\n',
      'data: {"content":"CRLF chunk"}\r\n\r\n',
      'event: done\r\n',
      'data: {"messageId":"msg-crlf-001"}\r\n\r\n',
    ].join(''),
    {
      headers: {
        'Content-Type': 'text/event-stream',
      },
      status: 200,
    },
  );
}

/**
 * backend error 이벤트를 포함한 SSE 응답을 만든다.
 *
 * @returns error event 기반 text/event-stream Response
 */
function createErrorSseResponse(): Response {
  return new Response(
    'event: error\ndata: {"code":"ML_SERVER_ERROR","message":"답변 생성 중 오류가 발생했습니다"}\n\n',
    {
      headers: {
        'Content-Type': 'text/event-stream',
      },
      status: 200,
    },
  );
}

describe('feature9 chat SSE store integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.unstubAllGlobals();
  });

  it('accumulates SSE chunks and metadata into Pinia messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => createSseResponse()),
    );
    const chatStore = useChatStore();

    await chatStore.streamMessage('conv-mock-001', 'S3 권한 오류를 다시 정리해줘');

    expect(chatStore.isStreaming).toBe(false);
    expect(chatStore.streamingMessageId).toBe('');
    expect(chatStore.streamingPhase).toBe('idle');
    expect(chatStore.activeMessages).toHaveLength(2);
    expect(chatStore.activeMessages[0]).toMatchObject({
      role: 'user',
      content: 'S3 권한 오류를 다시 정리해줘',
    });
    expect(chatStore.activeMessages[1]).toMatchObject({
      messageId: 'msg-done-001',
      role: 'assistant',
      content: '첫 chunk 두 번째 chunk',
      confidenceScore: 0.91,
      verificationResult: 'SUPPORTED',
      statusMessage: '',
    });
    expect(chatStore.activeMessages[1].sources?.[0].title).toBe('S3 트러블슈팅 가이드');
    expect(chatStore.conversationTitlesById['conv-mock-001']).toBe('S3 권한 오류 해결 방법');
  });

  it('stores backend status event messages without generating text from phase', () => {
    const chatStore = useChatStore();
    chatStore.activeConversationId = 'conv-mock-001';
    chatStore.messagesByConversationId['conv-mock-001'] = [
      {
        messageId: 'msg-local-assistant-status',
        role: 'assistant',
        content: '',
        createdAt: '2026-05-22T00:00:00Z',
        sources: [],
      },
    ];

    chatStore.applySseEvent('conv-mock-001', 'msg-local-assistant-status', {
      event: 'status',
      data: {
        phase: 'searching',
        message: '관련 문서를 검색하고 있어요',
      },
    });

    expect(chatStore.streamingPhase).toBe('searching');
    expect(chatStore.activeMessages[0]).toMatchObject({
      statusMessage: '관련 문서를 검색하고 있어요',
    });
  });

  it('ignores unknown status phase values and keeps the previous status', () => {
    const chatStore = useChatStore();
    chatStore.activeConversationId = 'conv-mock-001';
    chatStore.streamingPhase = 'searching';
    chatStore.messagesByConversationId['conv-mock-001'] = [
      {
        messageId: 'msg-local-assistant-status',
        role: 'assistant',
        content: '',
        createdAt: '2026-05-22T00:00:00Z',
        phase: 'searching',
        statusMessage: '관련 문서를 검색하고 있어요',
        sources: [],
      },
    ];

    chatStore.applySseEvent('conv-mock-001', 'msg-local-assistant-status', {
      event: 'status',
      data: {
        phase: 'planning_next_step',
        message: '새 단계 메시지',
      },
    });

    expect(chatStore.streamingPhase).toBe('searching');
    expect(chatStore.activeMessages[0]).toMatchObject({
      phase: 'searching',
      statusMessage: '관련 문서를 검색하고 있어요',
    });
  });

  it('passes AbortSignal to the SSE request and aborts the stream on cancel', async () => {
    let capturedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          capturedSignal = init?.signal ?? undefined;
          capturedSignal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'));
          });
        }),
    );

    vi.stubGlobal('fetch', fetchMock);
    const chatStore = useChatStore();
    const streamPromise = chatStore.streamMessage('conv-mock-001', '취소 테스트');

    await Promise.resolve();
    chatStore.cancelStreaming();
    await streamPromise;

    expect(capturedSignal?.aborted).toBe(true);
    expect(chatStore.isStreaming).toBe(false);
    expect(chatStore.streamingMessageId).toBe('');
    expect(chatStore.activeMessages[1]).toMatchObject({
      role: 'assistant',
      content: '',
      statusMessage: '',
    });
  });

  it('parses CRLF SSE frames from backend-compatible streams', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => createCrLfSseResponse()),
    );
    const chatStore = useChatStore();

    await chatStore.streamMessage('conv-mock-001', 'CRLF 테스트');

    expect(chatStore.activeMessages[1]).toMatchObject({
      messageId: 'msg-crlf-001',
      content: 'CRLF chunk',
    });
  });

  it('renders backend SSE error events into the assistant placeholder and restores controls', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => createErrorSseResponse()),
    );
    const chatStore = useChatStore();

    await chatStore.streamMessage('conv-mock-001', '에러 테스트');

    expect(chatStore.isStreaming).toBe(false);
    expect(chatStore.streamingPhase).toBe('idle');
    expect(chatStore.activeMessages[1]).toMatchObject({
      role: 'assistant',
      content: '답변 생성 중 오류가 발생했습니다',
      statusMessage: '',
    });
  });
});
