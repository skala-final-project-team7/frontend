/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat SSE(text/event-stream) 응답 파서 composable.
 *           MSW mock stream과 backend SSE stream을 동일한 이벤트 계약으로 처리한다.
 * 작성일 : 2026-05-21
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-21, feature9 보강, useSSE composable 최초 작성
 *   - 2026-05-22, feature9 보강, AbortSignal 취소와 CRLF/multi-data SSE frame 파싱 추가
 *   - 2026-05-22, feature9 문서화, SSE parser helper 주석 보강
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import type { ChatSseEvent } from '@/types/api';

/**
 * SSE stream 처리 결과를 호출자(store)에 전달하기 위한 callback 묶음.
 *
 * stream reader와 JSON parser는 composable이 담당하고, 이벤트 누적/오류 표시/완료 처리는
 * store가 이 callback을 통해 수행한다.
 */
type SseHandlers = {
  /**
   * SSE frame을 파싱한 뒤 호출되는 이벤트 핸들러.
   *
   * @param event status/token/sources/verification/meta/done/error 중 하나의 SSE 이벤트
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
 * AbortSignal을 선택적으로 받아 SSE HTTP Response를 생성하는 요청 함수 타입.
 *
 * API layer의 `streamConversationChat()`을 주입해 mock/backend 전환과 parser 책임을 분리한다.
 */
type SseRequest = (signal?: AbortSignal) => Promise<Response>;

/**
 * SSE Response를 chunk 단위로 읽고 `event:`/`data:` frame을 ChatSseEvent로 변환한다.
 *
 * @returns stream 함수. 호출자는 backend/mock 교체와 무관하게 Response provider만 전달한다.
 */
export function useSSE() {
  /**
   * fetch로 받은 SSE Response를 chunk 단위로 읽고 완성된 SSE frame만 callback으로 전달한다.
   *
   * 아직 `\n\n`으로 닫히지 않은 frame은 buffer에 남겨 다음 chunk와 이어 붙인다.
   * AbortSignal이 중단되면 reader를 cancel하고 정상 완료 callback은 호출하지 않는다.
   *
   * @param request text/event-stream Response를 반환하는 함수
   * @param handlers 이벤트/에러/완료 콜백 묶음
   * @param signal 스트림 읽기 취소에 사용할 AbortSignal
   * @throws HTTP 실패, reader 오류, JSON 파싱 오류가 발생하면 onError 호출 후 다시 throw한다.
   */
  async function stream(
    request: SseRequest,
    handlers: SseHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      const response = await request(signal);

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

        if (signal?.aborted) {
          await reader.cancel();
          return;
        }

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

/**
 * buffer에서 `\n\n` 기준으로 완성된 SSE frame만 파싱하고 마지막 미완성 frame을 반환한다.
 *
 * backend와 브라우저 구현 차이를 흡수하기 위해 CRLF(`\r\n`)는 LF(`\n`)로 정규화한다.
 * 반환된 미완성 frame은 호출자가 다음 chunk 앞에 붙여 중복 파싱을 방지한다.
 *
 * @param buffer 이전 미완성 frame과 새 chunk를 합친 문자열
 * @param onEvent 완성 frame을 ChatSseEvent로 변환한 뒤 호출할 callback
 * @returns 아직 `\n\n` 종료자를 만나지 못한 미완성 frame
 */
function flushCompleteFrames(buffer: string, onEvent: (event: ChatSseEvent) => void): string {
  const normalizedBuffer = buffer.replace(/\r\n/g, '\n');
  const frames = normalizedBuffer.split('\n\n');
  const incompleteFrame = frames.pop() ?? '';

  parseSseText(frames.join('\n\n'), onEvent);

  return incompleteFrame;
}

/**
 * 하나 이상의 완성된 SSE frame 문자열을 ChatSseEvent 객체로 변환해 callback으로 전달한다.
 *
 * `event:` 한 줄과 여러 `data:` 줄을 지원하며, data 줄은 JSON 문자열로 합쳐 파싱한다.
 * event 또는 data가 없는 heartbeat/comment성 chunk는 무시한다.
 *
 * @param streamText `\n\n` 기준으로 완성된 SSE frame 문자열
 * @param onEvent 파싱된 ChatSseEvent를 전달받는 callback
 * @throws data payload가 JSON으로 파싱되지 않으면 SyntaxError를 throw한다.
 */
function parseSseText(streamText: string, onEvent: (event: ChatSseEvent) => void) {
  streamText
    .replace(/\r\n/g, '\n')
    .split('\n\n')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .forEach((chunk) => {
      const eventName = chunk.match(/^event:\s*(.+)$/m)?.[1];
      const eventData = chunk
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.replace(/^data:\s?/, ''))
        .join('\n');

      if (!eventName || !eventData) {
        return;
      }

      onEvent({
        event: eventName,
        data: JSON.parse(eventData),
      } as ChatSseEvent);
    });
}
