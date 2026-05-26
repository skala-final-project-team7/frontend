import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createConversation,
  deleteConversation,
  getConfluencePagePreview,
  getConversationMessages,
  getCurrentUser,
  listConversations,
  streamConversationChat,
  submitMessageFeedback,
  updateConversationTitle,
} from '@/api';
import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  ChatSseEvent,
  ConfluencePagePreview,
  Conversation,
  ConversationMessages,
  CurrentUser,
  DeleteConversationResponse,
  Feedback,
  ListConversationsParams,
  Message,
  Source,
} from '@/types/api';

describe('feature5 API types and client skeleton', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defines docs/api-spec.md Common Response and chat domain types', () => {
    const source: Source = {
      title: 'S3 트러블슈팅 가이드',
      pageId: '12345',
      spaceId: '98310',
      spaceName: 'Cloud Control Center',
      url: 'https://confluence.example.com/pages/12345',
      sourceUpdatedAt: '2026-04-15T18:30:00+09:00',
      relevanceScore: 0.92,
    };

    const assistantMessage: Message = {
      messageId: 'msg-uuid-002',
      role: 'assistant',
      content: 'S3 권한 오류는 IAM 정책을 수정하여 해결했습니다.',
      sources: [source],
      confidenceScore: 0.85,
      verificationResult: 'SUPPORTED',
      createdAt: '2026-05-06T10:00:05Z',
    };

    const conversation: Conversation = {
      conversationId: 'conv-uuid-001',
      title: 'S3 권한 오류 해결 방법',
      createdAt: '2026-05-06T10:00:00Z',
      lastMessageAt: '2026-05-06T10:05:00Z',
      messageCount: 4,
    };
    const listParams: ListConversationsParams = {
      page: 1,
      size: 10,
    };
    const deleteResponse: DeleteConversationResponse = null;

    const feedback: Feedback = {
      feedbackId: 'fb-uuid-001',
      messageId: assistantMessage.messageId,
      rating: 'like',
      createdAt: '2026-05-06T10:06:00Z',
    };

    const successResponse: ApiSuccessResponse<Conversation> = {
      isSuccess: true,
      code: 200,
      message: '요청 성공 메시지',
      data: conversation,
    };
    const errorResponse: ApiErrorResponse = {
      isSuccess: false,
      code: 404,
      message: '해당 대화를 찾을 수 없습니다',
      data: null,
    };
    const sseEvent: ChatSseEvent = {
      event: 'sources',
      data: {
        sources: [source],
      },
    };
    const previewPage: ConfluencePagePreview = {
      pageId: '12345',
      title: 'S3 트러블슈팅 가이드',
      spaceName: 'Cloud Control Center',
      authorName: 'Platform Team',
      updatedAt: '2026-04-15T09:30:00Z',
      breadcrumbs: ['Cloud Control Center', 'AWS', 'S3', 'S3 트러블슈팅 가이드'],
      pageUrl: 'https://confluence.example.com/pages/12345',
      bodyViewValue: '<h1>S3 트러블슈팅 가이드</h1>',
    };
    const currentUser: CurrentUser = {
      userId: 'user-001',
      name: '이다연',
      email: 'dayeon@example.com',
      role: 'USER',
      profileImageUrl: 'https://example.com/profile/dayeon.png',
      lastLoginAt: '2026-05-20T09:00:00Z',
    };

    expect(successResponse.data.conversationId).toBe('conv-uuid-001');
    expect(errorResponse.data).toBeNull();
    expect(assistantMessage.sources).toEqual([source]);
    expect(listParams).toEqual({ page: 1, size: 10 });
    expect(deleteResponse).toBeNull();
    expect(feedback.rating).toBe('like');
    expect(sseEvent.event).toBe('sources');
    expect(previewPage.bodyViewValue).toContain('<h1>');
    expect(currentUser.role).toBe('USER');
    expect(currentUser.profileImageUrl).toBe('https://example.com/profile/dayeon.png');
  });

  it('unwraps Common Response data for conversations and messages APIs', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      if (requestUrl === '/api/conversations' && method === 'POST') {
        return jsonResponse({
          isSuccess: true,
          code: 201,
          message: '새 대화 생성 성공',
          data: {
            conversationId: 'conv-uuid-001',
            title: '새 대화',
            createdAt: '2026-05-06T10:00:00Z',
          },
        });
      }

      if (requestUrl === '/api/conversations?page=1&size=10' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '대화 목록 조회 성공',
          data: {
            conversations: [],
            totalCount: 0,
            page: 1,
            size: 10,
          },
        });
      }

      if (requestUrl === '/api/conversations/conv-uuid-001/messages' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '메시지 이력 조회 성공',
          data: {
            conversationId: 'conv-uuid-001',
            messages: [],
          } satisfies ConversationMessages,
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          message: `Unexpected request: ${method} ${requestUrl}`,
          data: null,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(createConversation()).resolves.toMatchObject({
      conversationId: 'conv-uuid-001',
      title: '새 대화',
    });
    await expect(listConversations({ page: 1, size: 10 })).resolves.toMatchObject({
      conversations: [],
      page: 1,
      size: 10,
    });
    await expect(getConversationMessages('conv-uuid-001')).resolves.toEqual({
      conversationId: 'conv-uuid-001',
      messages: [],
    });
  });

  it('creates update, delete, and feedback API requests with JSON bodies', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      if (requestUrl === '/api/conversations/conv-uuid-001' && method === 'PATCH') {
        expect(JSON.parse(String(init?.body))).toEqual({ title: 'S3 권한 오류 트러블슈팅' });

        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '대화 제목 수정 성공',
          data: {
            conversationId: 'conv-uuid-001',
            title: 'S3 권한 오류 트러블슈팅',
            updatedAt: '2026-05-06T10:10:00Z',
          },
        });
      }

      if (requestUrl === '/api/conversations/conv-uuid-001' && method === 'DELETE') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '대화 삭제 성공',
          data: null,
        });
      }

      if (requestUrl === '/api/messages/msg-uuid-002/feedback' && method === 'POST') {
        expect(JSON.parse(String(init?.body))).toEqual({
          rating: 'like',
          comment: '정확한 답변이었어요',
        });

        return jsonResponse({
          isSuccess: true,
          code: 201,
          message: '피드백 등록 성공',
          data: {
            feedbackId: 'fb-uuid-001',
            messageId: 'msg-uuid-002',
            rating: 'like',
            createdAt: '2026-05-06T10:06:00Z',
          },
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          message: `Unexpected request: ${method} ${requestUrl}`,
          data: null,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      updateConversationTitle('conv-uuid-001', { title: 'S3 권한 오류 트러블슈팅' }),
    ).resolves.toMatchObject({
      conversationId: 'conv-uuid-001',
      title: 'S3 권한 오류 트러블슈팅',
    });
    await expect(deleteConversation('conv-uuid-001')).resolves.toBeNull();
    await expect(
      submitMessageFeedback('msg-uuid-002', {
        rating: 'like',
        comment: '정확한 답변이었어요',
      }),
    ).resolves.toMatchObject({
      feedbackId: 'fb-uuid-001',
      rating: 'like',
    });
  });

  it('keeps SSE chat as an unwrapped event stream request', async () => {
    const streamResponse = new Response('event: token\ndata: {"content":"S3"}\n\n', {
      headers: {
        'Content-Type': 'text/event-stream',
      },
      status: 200,
    });
    const fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(streamResponse);
    vi.stubGlobal('fetch', fetchMock);

    const response = await streamConversationChat('conv-uuid-001', {
      question: '지난번 S3 버킷 권한 오류 때 어떻게 해결했어?',
    });
    const init = fetchMock.mock.calls[0]?.[1];

    if (!init) {
      throw new Error('SSE chat request init was not captured');
    }

    expect(response).toBe(streamResponse);
    expect(fetchMock).toHaveBeenCalledWith('/api/conversations/conv-uuid-001/chat', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: '지난번 S3 버킷 권한 오류 때 어떻게 해결했어?',
      }),
    });
    expect(init.headers).not.toHaveProperty('X-Common-Response-Wrapper');
  });

  it('unwraps Confluence page preview responses with a page_id query', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      if (requestUrl === '/api/confluence/pages/preview?page_id=12345' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: 'Confluence 페이지 미리보기 조회 성공',
          data: {
            pageId: '12345',
            title: 'S3 트러블슈팅 가이드',
            spaceName: 'Cloud Control Center',
            authorName: 'Platform Team',
            updatedAt: '2026-04-15T09:30:00Z',
            breadcrumbs: ['Cloud Control Center', 'AWS', 'S3', 'S3 트러블슈팅 가이드'],
            pageUrl: 'https://confluence.example.com/pages/12345',
            bodyViewValue: '<h1>S3 트러블슈팅 가이드</h1>',
          } satisfies ConfluencePagePreview,
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          message: `Unexpected request: ${method} ${requestUrl}`,
          data: null,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getConfluencePagePreview('12345')).resolves.toMatchObject({
      pageId: '12345',
      title: 'S3 트러블슈팅 가이드',
      pageUrl: 'https://confluence.example.com/pages/12345',
      breadcrumbs: ['Cloud Control Center', 'AWS', 'S3', 'S3 트러블슈팅 가이드'],
      bodyViewValue: '<h1>S3 트러블슈팅 가이드</h1>',
    });
  });

  it('unwraps current user profile from GET /api/users/me', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      if (requestUrl === '/api/users/me' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 정보 조회 성공',
          data: {
            userId: 'user-001',
            name: '이다연',
            email: 'dayeon@example.com',
            role: 'USER',
            profileImageUrl: 'https://example.com/profile/dayeon.png',
            lastLoginAt: '2026-05-20T09:00:00Z',
          } satisfies CurrentUser,
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          message: `Unexpected request: ${method} ${requestUrl}`,
          data: null,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getCurrentUser()).resolves.toMatchObject({
      userId: 'user-001',
      name: '이다연',
      role: 'USER',
      profileImageUrl: 'https://example.com/profile/dayeon.png',
    });
  });
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}
