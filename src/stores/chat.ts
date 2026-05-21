/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat 서버 상태 Pinia store.
 *           대화 메시지 이력과 SSE 누적 응답을 컴포넌트 밖에서 일관되게 관리한다.
 * 작성일 : 2026-05-21
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-21, feature9 보강, useSSE 기반 메시지 누적 store 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Pinia 2.3.x 기준
 * --------------------------------------------------
 */
import { defineStore } from 'pinia';

import { getConversationMessages, streamConversationChat } from '@/api';
import { useSSE } from '@/composables/useSSE';
import type { ChatSseEvent, Message } from '@/types/api';

type ChatState = {
  activeConversationId: string;
  messagesByConversationId: Record<string, Message[]>;
  isStreaming: boolean;
  streamingMessageId: string;
};

export const useChatStore = defineStore('chat', {
  state: (): ChatState => ({
    activeConversationId: '',
    messagesByConversationId: {},
    isStreaming: false,
    streamingMessageId: '',
  }),

  getters: {
    activeMessages(state): Message[] {
      return state.activeConversationId
        ? (state.messagesByConversationId[state.activeConversationId] ?? [])
        : [];
    },
  },

  actions: {
    /**
     * 현재 보고 있는 대화 컨텍스트만 비우고, 로컬 스트리밍 식별자도 초기화한다.
     */
    clearActiveConversation() {
      this.activeConversationId = '';
      this.streamingMessageId = '';
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
     * 사용자 질문을 서버 SSE endpoint로 전송하고 token/sources/verification/done 이벤트를 누적한다.
     *
     * @param conversationId 스트리밍할 대화 ID
     * @param question 사용자 질문 본문
     */
    async streamMessage(conversationId: string, question: string) {
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

      const { stream } = useSSE();

      try {
        await stream(() => streamConversationChat(conversationId, { question }), {
          onEvent: (event) => {
            this.applySseEvent(conversationId, assistantMessage.messageId, event);
          },
        });
      } finally {
        this.isStreaming = false;
        this.streamingMessageId = '';
      }
    },

    /**
     * 현재 진행 중인 스트리밍 상태를 취소 표시로만 정리한다.
     */
    cancelStreaming() {
      this.isStreaming = false;
      this.streamingMessageId = '';
    },

    /**
     * SSE 이벤트를 assistant placeholder 메시지에 누적 반영한다.
     *
     * @param conversationId 메시지를 갱신할 대화 ID
     * @param messageId 이벤트를 반영할 assistant 메시지 ID
     * @param event SSE에서 수신한 token/sources/verification/done 이벤트
     */
    applySseEvent(conversationId: string, messageId: string, event: ChatSseEvent) {
      this.messagesByConversationId[conversationId] = (
        this.messagesByConversationId[conversationId] ?? []
      ).map((message) => {
        if (message.messageId !== messageId) {
          return message;
        }

        if (event.event === 'token') {
          return {
            ...message,
            content: `${message.content}${event.data.content}`,
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

        if (event.event === 'done') {
          return {
            ...message,
            messageId: event.data.messageId,
          };
        }

        return message;
      });
    },
  },
});
