import { defineStore } from 'pinia';

import { fetchConversationMessages, fetchConversations } from '@/api/conversations';
import type { ChatMessage, ConversationSummary } from '@/types/api';

type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export const useConversationsStore = defineStore('conversations', {
  state: () => ({
    conversations: [] as ConversationSummary[],
    activeConversationId: null as string | null,
    messages: [] as ChatMessage[],
    status: 'idle' as AsyncStatus,
    errorMessage: '',
  }),
  getters: {
    activeConversation: (state) =>
      state.conversations.find(
        (conversation) => conversation.conversationId === state.activeConversationId,
      ),
    hasConversations: (state) => state.conversations.length > 0,
  },
  actions: {
    async loadConversations() {
      this.status = 'loading';
      this.errorMessage = '';

      try {
        const data = await fetchConversations();

        this.conversations = data.conversations;
        this.activeConversationId = data.conversations[0]?.conversationId ?? null;
        this.status = 'success';
      } catch (error) {
        this.errorMessage =
          error instanceof Error ? error.message : '대화 목록을 불러오지 못했습니다.';
        this.status = 'error';
      }
    },
    async loadMessages(conversationId: string) {
      this.status = 'loading';
      this.errorMessage = '';
      this.activeConversationId = conversationId;

      try {
        const data = await fetchConversationMessages(conversationId);

        this.messages = data.messages;
        this.status = 'success';
      } catch (error) {
        this.errorMessage =
          error instanceof Error ? error.message : '메시지 이력을 불러오지 못했습니다.';
        this.status = 'error';
      }
    },
  },
});
