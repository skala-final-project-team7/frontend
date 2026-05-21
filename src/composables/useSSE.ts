/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat SSE(text/event-stream) 응답 파서 composable.
 *           MSW mock stream과 backend SSE stream을 동일한 이벤트 계약으로 처리한다.
 * 작성일 : 2026-05-21
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-21, feature9 보강, useSSE composable 최초 작성
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import type { ChatSseEvent } from '@/types/api';

type SseHandlers = {
  /**
   * SSE frame을 파싱한 뒤 호출되는 이벤트 핸들러.
   *
   * @param event token/sources/verification/done 중 하나의 SSE 이벤트
   */
  onEvent: (event: ChatSseEvent) => void;
  /**
   * 스트림 읽기 또는 JSON 파싱 중 에러가 발생했을 때 호출되는 핸들러.
   *
   * @param error 네트워크/파싱/프로토콜 오류 객체
   */
  onError?: (error: unknown) => void;
  /**
   * 스트림이 정상 종료되어 더 이상 읽을 내용이 없을 때 호출되는 핸들러.
   */
  onComplete?: () => void;
};

/**
 * SSE Response를 chunk 단위로 읽고 `event:`/`data:` frame을 ChatSseEvent로 변환한다.
 *
 * @returns stream 함수. 호출자는 backend/mock 교체와 무관하게 Response provider만 넘긴다.
 */
export function useSSE() {
  /**
   * fetch로 받은 SSE Response를 chunk 단위로 읽고 이벤트를 callback으로 전달한다.
   *
   * @param request text/event-stream Response를 반환하는 함수
   * @param handlers 이벤트/에러/완료 콜백 묶음
   */
  async function stream(request: () => Promise<Response>, handlers: SseHandlers): Promise<void> {
    try {
      const response = await request();

      if (!response.ok) {
        throw new Error(`SSE request failed with status ${response.status}`);
      }

      if (!response.body) {
        parseSseText(await response.text(), handlers.onEvent);
        handlers.onComplete?.();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let readerResult = await reader.read();

      while (!readerResult.done) {
        const { value } = readerResult;

        buffer += decoder.decode(value, { stream: true });
        buffer = flushCompleteFrames(buffer, handlers.onEvent);
        readerResult = await reader.read();
      }

      buffer += decoder.decode();
      parseSseText(buffer, handlers.onEvent);
      handlers.onComplete?.();
    } catch (error) {
      handlers.onError?.(error);
      throw error;
    }
  }

  return {
    stream,
  };
}

function flushCompleteFrames(buffer: string, onEvent: (event: ChatSseEvent) => void): string {
  const frames = buffer.split('\n\n');
  const incompleteFrame = frames.pop() ?? '';

  parseSseText(frames.join('\n\n'), onEvent);

  return incompleteFrame;
}

function parseSseText(streamText: string, onEvent: (event: ChatSseEvent) => void) {
  streamText
    .split('\n\n')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .forEach((chunk) => {
      const eventName = chunk.match(/^event:\s*(.+)$/m)?.[1];
      const eventData = chunk.match(/^data:\s*(.+)$/m)?.[1];

      if (!eventName || !eventData) {
        return;
      }

      onEvent({
        event: eventName,
        data: JSON.parse(eventData),
      } as ChatSseEvent);
    });
}
