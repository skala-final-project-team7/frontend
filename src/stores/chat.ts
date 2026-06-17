/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat 서버 상태 Pinia store.
 *           대화 메시지 이력과 SSE 누적 응답을 컴포넌트 밖에서 일관되게 관리한다.
 * 작성일 : 2026-05-21
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-21, feature9 보강, useSSE 기반 메시지 누적 store 추가
 *   - 2026-05-22, feature9 보강, streaming phase/status, abort, error event 처리 추가
 *   - 2026-05-22, feature9 SSE 보강, backend status.message 직접 렌더링 상태 추가
 *   - 2026-05-22, RAG status 계약 반영, 알 수 없는 status phase 무시 처리 추가
 *   - 2026-06-15, feature11 구현, SSE HTTP 실패/스트림 중단/backend error 문구 구분 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Pinia 2.3.x 기준
 * --------------------------------------------------
 */
import { defineStore } from 'pinia';

import { getConversationMessages, streamConversationChat } from '@/api';
import { useSSE } from '@/composables/useSSE';
import type { ChatSseEvent, ChatStreamingPhase, Message } from '@/types/api';

let activeStreamAbortController: AbortController | null = null;
const AUTO_TITLE_PLACEHOLDER = '새 대화';

const KNOWN_STREAMING_PHASES = new Set<ChatStreamingPhase>([
  'idle',
  'connecting',
  'acl_filtering',
  'searching',
  'answering',
  'streaming',
  'verifying',
  'formatting',
  'done',
  'error',
]);

type ChatState = {
  activeConversationId: string;
  messagesByConversationId: Record<string, Message[]>;
  conversationTitlesById: Record<string, string>;
  isStreaming: boolean;
  streamingMessageId: string;
  streamingPhase: ChatStreamingPhase;
};

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    activeConversationId: '',
    messagesByConversationId: {},
    conversationTitlesById: {},
    isStreaming: false,
    streamingMessageId: '',
    streamingPhase: 'idle',
  }),

  getters: {
    activeMessages(state): Message[] {
      return state.activeConversationId
        ? (state.messagesByConversationId[state.activeConversationId] ?? [])
        : [];
    },

    /**
     * 현재 스트리밍 assistant 메시지에 저장된 backend status message를 반환한다.
     *
     * @param state chat store state
     * @returns backend status 이벤트가 전달한 화면 표시용 메시지
     */
    streamingStatusText(state): string {
      const activeMessages = state.activeConversationId
        ? (state.messagesByConversationId[state.activeConversationId] ?? [])
        : [];
      const streamingMessage = activeMessages.find(
        (message) => message.messageId === state.streamingMessageId,
      );

      return streamingMessage?.statusMessage ?? '';
    },
  },

  actions: {
    /**
     * 현재 보고 있는 대화 컨텍스트만 비우고, 로컬 스트리밍 식별자도 초기화한다.
     */
    clearActiveConversation() {
      activeStreamAbortController?.abort();
      activeStreamAbortController = null;
      this.activeConversationId = '';
      this.streamingMessageId = '';
      this.streamingPhase = 'idle';
    },

    /**
     * 지정한 대화의 기존 메시지 이력을 불러와 Pinia에 저장한다.
     *
     * @param conversationId 메시지를 조회할 대화 ID
     */
    async loadConversationMessages(conversationId: string) {
      this.activeConversationId = conversationId;
      const conversationMessages = await getConversationMessages(conversationId);
      const currentMessages = this.messagesByConversationId[conversationId] ?? [];
      const fetchedMessageIds = new Set(
        conversationMessages.messages.map((message) => message.messageId),
      );
      // 로컬 placeholder(msg-local-*)는 서버 영속 후 실제 messageId로 교체되지 않아(특히 user 메시지)
      // ID 기준 dedup만으로는 서버가 돌려준 동일 메시지와 중복으로 쌓인다.
      // 서버가 같은 role+content를 이미 영속한 placeholder는 제외하되,
      // 아직 영속 전(일관성 지연)인 placeholder는 보존해 메시지가 사라지지 않도록 한다.
      const fetchedContentKeys = new Set(
        conversationMessages.messages.map((message) => localMessageContentKey(message)),
      );
      const pendingLocalMessages = currentMessages.filter((message) => {
        if (fetchedMessageIds.has(message.messageId)) {
          return false;
        }

        if (
          message.messageId.startsWith('msg-local-') &&
          fetchedContentKeys.has(localMessageContentKey(message))
        ) {
          return false;
        }

        return true;
      });

      this.messagesByConversationId[conversationId] = [
        ...conversationMessages.messages,
        ...pendingLocalMessages,
      ];
    },

    /**
     * 편집 중인 사용자 메시지의 본문을 현재 active conversation 안에서 갱신한다.
     *
     * @param messageId 수정할 사용자 메시지 ID
     * @param content 새 본문
     */
    updateUserMessage(messageId: string, content: string) {
      const conversationId = this.activeConversationId;

      if (!conversationId) {
        return;
      }

      this.messagesByConversationId[conversationId] = this.activeMessages.map((message) =>
        message.messageId === messageId ? { ...message, content } : message,
      );
    },

    /**
     * 사용자 질문을 서버 SSE endpoint로 전송하고 status/token/sources/verification/meta/done 이벤트를 누적한다.
     *
     * @param conversationId 스트리밍할 대화 ID
     * @param question 사용자 질문 본문
     */
    async streamMessage(conversationId: string, question: string) {
      activeStreamAbortController?.abort();
      const streamAbortController = new AbortController();

      activeStreamAbortController = streamAbortController;

      const userMessage: Message = {
        messageId: `msg-local-user-${Date.now()}`,
        role: 'user',
        content: question,
        createdAt: new Date().toISOString(),
      };
      const assistantMessage: Message = {
        messageId: `msg-local-assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        phase: 'connecting',
        statusMessage: '',
        sources: [],
      };

      this.activeConversationId = conversationId;
      this.messagesByConversationId[conversationId] = [
        ...(this.messagesByConversationId[conversationId] ?? []),
        userMessage,
        assistantMessage,
      ];
      this.isStreaming = true;
      this.streamingMessageId = assistantMessage.messageId;
      this.streamingPhase = 'connecting';

      const { stream } = useSSE();

      try {
        await stream(
          (signal) => streamConversationChat(conversationId, { question }, signal),
          {
            onEvent: (event) => {
              this.applySseEvent(conversationId, assistantMessage.messageId, event);

              if (event.event === 'error') {
                throw new SseEventError(event.data.errorCode, event.data.message);
              }
            },
          },
          streamAbortController.signal,
        );
      } catch (error) {
        if (!isAbortError(error)) {
          this.applyStreamFailure(conversationId, assistantMessage.messageId, error);
        }
      } finally {
        this.isStreaming = false;
        this.streamingMessageId = '';
        this.streamingPhase = 'idle';

        if (activeStreamAbortController === streamAbortController) {
          activeStreamAbortController = null;
        }
      }
    },

    /**
     * 현재 진행 중인 스트리밍 상태를 취소 표시로만 정리한다.
     */
    cancelStreaming() {
      activeStreamAbortController?.abort();
      activeStreamAbortController = null;
      this.isStreaming = false;
      this.streamingMessageId = '';
      this.streamingPhase = 'idle';
    },

    /**
     * SSE 이벤트를 assistant placeholder 메시지에 누적 반영한다.
     *
     * @param conversationId 메시지를 갱신할 대화 ID
     * @param messageId 이벤트를 반영할 assistant 메시지 ID
     * @param event SSE에서 수신한 status/token/sources/verification/meta/done/error 이벤트
     */
    applySseEvent(conversationId: string, messageId: string, event: ChatSseEvent) {
      this.messagesByConversationId[conversationId] = (
        this.messagesByConversationId[conversationId] ?? []
      ).map((message) => {
        if (message.messageId !== messageId) {
          return message;
        }

        if (event.event === 'token') {
          if (message.content.length === 0) {
            this.streamingPhase = 'streaming';
          }

          return {
            ...message,
            phase: 'streaming',
            content: `${message.content}${event.data.content}`,
          };
        }

        if (event.event === 'status') {
          if (!isKnownStreamingPhase(event.data.phase)) {
            return message;
          }

          this.streamingPhase = event.data.phase;

          return {
            ...message,
            phase: event.data.phase,
            statusMessage: event.data.message,
          };
        }

        if (event.event === 'sources') {
          return {
            ...message,
            sources: event.data.sources,
          };
        }

        if (event.event === 'verification') {
          return {
            ...message,
            confidenceScore: event.data.confidenceScore,
            verificationResult: event.data.verificationResult,
          };
        }

        if (event.event === 'meta') {
          const title = event.data.title?.trim();

          // 서버가 생성한 제목이 있고, 적용 가능한 경우(첫 턴 & 기존 제목 없음)에만 표시 제목으로 저장한다.
          if (title && this.shouldApplyGeneratedTitle(conversationId)) {
            this.conversationTitlesById[conversationId] = title;
          }

          // 현재 RAG 구현 호환용 이벤트이며, feature13 계약 정리 후 제거될 수 있어 UI 상태에는 반영하지 않는다.
          return message;
        }

        if (event.event === 'done') {
          this.streamingPhase = 'done';

          return {
            ...message,
            messageId: event.data.messageId,
            phase: 'done',
            statusMessage: '',
          };
        }

        if (event.event === 'error') {
          this.streamingPhase = 'error';

          return {
            ...message,
            phase: 'error',
            statusMessage: '',
            error: event.data.message,
            content: event.data.message,
          };
        }

        return message;
      });
    },

    /**
     * SSE transport 또는 backend error 이벤트 실패를 assistant placeholder에 표시한다.
     *
     * @param conversationId 메시지를 갱신할 대화 ID
     * @param messageId 실패 문구를 반영할 assistant 메시지 ID
     * @param error 수신 또는 파싱 중 발생한 오류
     */
    applyStreamFailure(conversationId: string, messageId: string, error: unknown) {
      const errorMessage = getStreamFailureMessage(error);

      this.messagesByConversationId[conversationId] = (
        this.messagesByConversationId[conversationId] ?? []
      ).map((message) => {
        if (message.messageId !== messageId) {
          return message;
        }

        return {
          ...message,
          phase: 'error',
          statusMessage: '',
          error: errorMessage,
          content: errorMessage,
        };
      });
    },

    /**
     * 서버가 `meta` 이벤트로 내려준 자동 생성 제목을 표시 제목에 반영해도 되는지 판정한다.
     *
     * 다음 두 조건을 모두 만족할 때만 적용을 허용한다.
     *   1. 아직 진짜 제목이 없다 — 비어 있거나 기본 placeholder(`새 대화`)인 경우.
     *      이미 사용자/서버가 정한 제목이 있으면 자동 제목으로 덮어쓰지 않는다(보존).
     *   2. 첫 질문-답변 턴이다 — 메시지가 2개(user 1 + assistant 1) 이하.
     *      이후 턴에서 `meta.title`이 다시 와도 재제목 부여를 막는다.
     *
     * @param conversationId 판정 대상 대화 ID
     * @returns 자동 생성 제목을 적용해도 되면 true
     */
    shouldApplyGeneratedTitle(conversationId: string) {
      const currentTitle = this.conversationTitlesById[conversationId]?.trim();

      // ① 이미 placeholder가 아닌 실제 제목이 있으면 덮어쓰지 않는다.
      if (currentTitle && currentTitle !== AUTO_TITLE_PLACEHOLDER) {
        return false;
      }

      // ② 첫 턴(질문1 + 답변1 = 2개 이하)에서만 자동 제목을 허용한다.
      const conversationMessages = this.messagesByConversationId[conversationId] ?? [];

      return conversationMessages.length <= 2;
    },
  },
});

function isKnownStreamingPhase(phase: string): phase is ChatStreamingPhase {
  return KNOWN_STREAMING_PHASES.has(phase as ChatStreamingPhase);
}

// 로컬 placeholder와 서버 영속 메시지를 messageId 없이 매칭하기 위한 role+content 키.
function localMessageContentKey(message: Pick<Message, 'role' | 'content'>): string {
  return `${message.role}\n${message.content.trim()}`;
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: unknown }).name === 'AbortError'
  );
}

function isSseHttpFailure(error: unknown): boolean {
  return error instanceof Error && /^SSE request failed with status \d+$/.test(error.message);
}

function isStreamInterruptedError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    (error instanceof Error &&
      (error.message === 'Failed to fetch' || error.message.includes('NetworkError')))
  );
}

function getStreamFailureMessage(error: unknown): string {
  if (error instanceof SseEventError) {
    return error.message;
  }

  if (isSseHttpFailure(error)) {
    return '답변 스트림 연결에 실패했습니다. 다시 시도해 주세요.';
  }

  if (isStreamInterruptedError(error)) {
    return '답변 스트림이 중단되었습니다. 다시 시도해 주세요.';
  }

  return error instanceof Error ? error.message : '답변 생성 중 오류가 발생했습니다';
}

class SseEventError extends Error {
  public readonly errorCode: string;

  constructor(errorCode: string, message: string) {
    super(message);
    this.name = 'SseEventError';
    this.errorCode = errorCode;
  }
}
