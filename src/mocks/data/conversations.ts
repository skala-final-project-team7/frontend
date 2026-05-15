import type { ChatMessage, ConversationSummary, Source } from '@/types/api';

export const mockSources: Source[] = [
  {
    title: 'S3 트러블슈팅 가이드',
    pageId: '12345',
    spaceId: '98310',
    spaceName: 'Cloud Control Center',
    url: 'https://confluence.example.com/pages/12345',
    updatedAt: '2026-04-15T09:30:00Z',
    relevanceScore: 0.92,
  },
];

export const mockConversations: ConversationSummary[] = [
  {
    conversationId: 'conv-uuid-001',
    title: 'S3 권한 오류 해결 방법',
    lastMessageAt: '2026-05-06T10:05:00Z',
    messageCount: 2,
  },
];

export const mockMessages: ChatMessage[] = [
  {
    messageId: 'msg-uuid-001',
    role: 'user',
    content: '지난번 S3 버킷 권한 오류 때 어떻게 해결했어?',
    createdAt: '2026-05-06T10:00:00Z',
  },
  {
    messageId: 'msg-uuid-002',
    role: 'assistant',
    content: 'S3 권한 오류는 IAM 정책을 수정하여 해결했습니다.',
    sources: mockSources,
    confidenceScore: 0.85,
    verificationResult: 'SUPPORTED',
    createdAt: '2026-05-06T10:00:05Z',
  },
];
