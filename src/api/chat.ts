import type { ChatStreamEvent, Source, VerificationResult } from '@/types/api';

type StreamCallbacks = {
  onEvent: (event: ChatStreamEvent) => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
};

export async function streamChat(
  conversationId: string,
  question: string,
  { onEvent, onError, signal }: StreamCallbacks,
) {
  try {
    const response = await fetch(`/api/conversations/${conversationId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error('스트리밍 응답을 시작하지 못했습니다.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bufferedText = '';

    for (;;) {
      const { value, done } = await reader.read();

      if (done) {
        break;
      }

      bufferedText += decoder.decode(value, { stream: true });
      bufferedText = parseSseBuffer(bufferedText, onEvent);
    }
  } catch (error) {
    if ((error as DOMException).name !== 'AbortError') {
      onError(error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.'));
    }
  }
}

function parseSseBuffer(buffer: string, onEvent: (event: ChatStreamEvent) => void) {
  const chunks = buffer.split('\n\n');
  const pendingChunk = chunks.pop() ?? '';

  for (const chunk of chunks) {
    const eventType = chunk
      .split('\n')
      .find((line) => line.startsWith('event:'))
      ?.replace('event:', '')
      .trim();
    const dataText = chunk
      .split('\n')
      .find((line) => line.startsWith('data:'))
      ?.replace('data:', '')
      .trim();

    if (!eventType || !dataText) {
      continue;
    }

    const data = JSON.parse(dataText) as Record<string, unknown>;

    if (eventType === 'token') {
      onEvent({ type: 'token', content: String(data.content ?? '') });
    }

    if (eventType === 'sources') {
      onEvent({ type: 'sources', sources: data.sources as Source[] });
    }

    if (eventType === 'verification') {
      onEvent({
        type: 'verification',
        confidenceScore: Number(data.confidenceScore ?? 0),
        verificationResult: data.verificationResult as VerificationResult,
      });
    }

    if (eventType === 'done') {
      onEvent({ type: 'done', messageId: String(data.messageId ?? '') });
    }

    if (eventType === 'error') {
      onEvent({
        type: 'error',
        code: String(data.code ?? 'STREAM_ERROR'),
        message: String(data.message ?? '답변 생성 중 오류가 발생했습니다.'),
      });
    }
  }

  return pendingChunk;
}
