import { requestJson } from '@/api/client';
import type {
  ConversationListData,
  ConversationMessagesData,
  CreateConversationData,
} from '@/types/api';

export function fetchConversations(page = 0, size = 20) {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return requestJson<ConversationListData>(`/api/conversations?${searchParams.toString()}`);
}

export function createConversation() {
  return requestJson<CreateConversationData>('/api/conversations', {
    method: 'POST',
  });
}

export function fetchConversationMessages(conversationId: string) {
  return requestJson<ConversationMessagesData>(`/api/conversations/${conversationId}/messages`);
}
