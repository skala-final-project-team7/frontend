import { ref } from 'vue';

import { streamChat } from '@/api/chat';
import type { ChatStreamEvent } from '@/types/api';

export function useSseChat() {
  const isStreaming = ref(false);
  const errorMessage = ref('');
  const streamedContent = ref('');
  const abortController = ref<AbortController | null>(null);

  async function sendQuestion(conversationId: string, question: string) {
    abortController.value?.abort();
    abortController.value = new AbortController();
    isStreaming.value = true;
    errorMessage.value = '';
    streamedContent.value = '';

    await streamChat(conversationId, question, {
      signal: abortController.value.signal,
      onEvent: handleStreamEvent,
      onError: (error) => {
        errorMessage.value = error.message;
        isStreaming.value = false;
      },
    });

    isStreaming.value = false;
  }

  function cancelStreaming() {
    abortController.value?.abort();
    isStreaming.value = false;
  }

  function handleStreamEvent(event: ChatStreamEvent) {
    if (event.type === 'token') {
      streamedContent.value += event.content;
    }

    if (event.type === 'error') {
      errorMessage.value = event.message;
      isStreaming.value = false;
    }
  }

  return {
    isStreaming,
    errorMessage,
    streamedContent,
    sendQuestion,
    cancelStreaming,
  };
}
