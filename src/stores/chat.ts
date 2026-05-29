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
      const pendingLocalMessages = currentMessages.filter(
        (message) => !fetchedMessageIds.has(message.messageId),
      );

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
        role: 'USER',
        content: question,
        createdAt: new Date().toISOString(),
      };
      const assistantMessage: Message = {
        messageId: `msg-local-assistant-${Date.now()}`,
        role: 'ASSISTANT',
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
                throw new Error(event.data.message);
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

          if (title) {
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
      const errorMessage =
        error instanceof Error ? error.message : '답변 생성 중 오류가 발생했습니다';

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
  },
});

function isKnownStreamingPhase(phase: string): phase is ChatStreamingPhase {
  return KNOWN_STREAMING_PHASES.has(phase as ChatStreamingPhase);
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: unknown }).name === 'AbortError'
  );
}
