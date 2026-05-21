import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChatStore } from '@/stores';

/**
 * token/sources/verification/done 이벤트를 한 번에 흘려주는 테스트용 SSE 응답을 만든다.
 *
 * @returns 테스트용 text/event-stream Response
 */
function createSseResponse(): Response {
  return new Response(
    new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        controller.enqueue(encoder.encode('event: token\ndata: {"content":"첫 chunk "}\n\n'));
        controller.enqueue(encoder.encode('event: token\ndata: {"content":"두 번째 chunk"}\n\n'));
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
    });
    expect(chatStore.activeMessages[1].sources?.[0].title).toBe('S3 트러블슈팅 가이드');
  });
});
