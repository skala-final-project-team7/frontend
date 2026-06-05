/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat 메시지 제출 흐름 composable.
 *           새 대화 생성, route fallback, SSE submit, 실패 toast 처리를 page shell 밖으로 분리한다.
 * 작성일 : 2026-06-04
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-06-04, feature10.5 구현, ChatPage 메시지 제출 책임 분리
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vue Router 4.5.x, Pinia 2.3.x 기준
 * --------------------------------------------------
 */
import type { Ref } from 'vue';
import type { Router } from 'vue-router';

import { createConversation } from '@/api';
import type { useChatStore } from '@/stores';
import type { Conversation } from '@/types/api';

type ToastOptions = {
  variant: 'error' | 'info' | 'success';
};

type UseChatSubmissionOptions = {
  chatStore: ReturnType<typeof useChatStore>;
  conversations: Ref<Conversation[]>;
  routeConversationId: Ref<string>;
  router: Router;
  showToast: (message: string, options?: ToastOptions) => void;
};

/**
 * 채팅 메시지 제출 흐름을 제공한다.
 *
 * @param options route/store/conversation/toast 의존성
 * @returns submit/cancel handler
 */
export function useChatSubmission(options: UseChatSubmissionOptions) {
  const { chatStore, conversations, routeConversationId, router, showToast } = options;

  async function submitMessage(question: string) {
    let conversationId = chatStore.activeConversationId || routeConversationId.value;

    if (chatStore.isStreaming) {
      return;
    }

    try {
      if (!conversationId) {
        const createdConversation = await createConversation();
        conversationId = createdConversation.conversationId;

        if (
          !conversations.value.some(
            (conversation) => conversation.conversationId === conversationId,
          )
        ) {
          conversations.value = [createdConversation, ...conversations.value];
        }

        await router.push({
          name: 'chat-conversation',
          params: {
            conversationId,
          },
        });
      }

      await chatStore.streamMessage(conversationId, question);
    } catch {
      showToast('메시지를 전송하지 못했습니다. 연결 상태를 확인해 주세요.', {
        variant: 'error',
      });
    }
  }

  function cancelStreaming() {
    chatStore.cancelStreaming();
  }

  return {
    cancelStreaming,
    submitMessage,
  };
}
