import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getAdminDataOverview,
  getAdminFeedback,
  getAdminIngestStatus,
  getAdminStats,
  getAdminSyncHistory,
  getAdminUsers,
  createConversation,
  deleteConversation,
  getConfluencePagePreview,
  getConversationMessages,
  getCurrentUser,
  listConversations,
  searchConversations,
  startAdminIngestJob,
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
    vi.unstubAllEnvs();
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
      createdAt: '2026-05-06T19:00:05+09:00',
    };

    const conversation: Conversation = {
      conversationId: 'conv-uuid-001',
      title: 'S3 권한 오류 해결 방법',
      createdAt: '2026-05-06T19:00:00+09:00',
      lastMessageAt: '2026-05-06T19:05:00+09:00',
    };
    const listParams: ListConversationsParams = {
      page: 1,
      size: 10,
    };
    const invalidListParams: ListConversationsParams = {
      // @ts-expect-error docs/api-spec.md GET /api/conversations supports page and size only.
      query: 'S3 권한',
    };
    const deleteResponse: DeleteConversationResponse = null;

    const feedback: Feedback = {
      feedbackId: 'fb-uuid-001',
      messageId: assistantMessage.messageId,
      rating: 'LIKE',
      createdAt: '2026-05-06T19:06:00+09:00',
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
      errorCode: 'RESOURCE_NOT_FOUND',
      message: '해당 대화를 찾을 수 없습니다',
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
      updatedAt: '2026-04-15T18:30:00+09:00',
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
      lastLoginAt: '2026-05-20T18:00:00+09:00',
    };

    expect(successResponse.data.conversationId).toBe('conv-uuid-001');
    expect(errorResponse.errorCode).toBe('RESOURCE_NOT_FOUND');
    expect(assistantMessage.sources).toEqual([source]);
    expect(listParams).toEqual({ page: 1, size: 10 });
    expect(invalidListParams).toEqual({ query: 'S3 권한' });
    expect(deleteResponse).toBeNull();
    expect(feedback.rating).toBe('LIKE');
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
            isPinned: false,
            createdAt: '2026-05-06T19:00:00+09:00',
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
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
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

  it('preserves the Common Response errorCode on API request failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          {
            isSuccess: false,
            code: 404,
            errorCode: 'RESOURCE_NOT_FOUND',
            message: '해당 대화를 찾을 수 없습니다',
          },
          404,
        ),
      ),
    );

    await expect(getConversationMessages('missing-conversation')).rejects.toMatchObject({
      name: 'ApiClientError',
      code: 404,
      errorCode: 'RESOURCE_NOT_FOUND',
    });
  });

  it('attaches Authorization header from localStorage to JSON APIs', async () => {
    stubLocalStorage({ accessToken: 'token-from-storage' });

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        Accept: 'application/json',
        Authorization: 'Bearer token-from-storage',
      });

      return jsonResponse({
        isSuccess: true,
        code: 200,
        message: '대화 목록 조회 성공',
        data: {
          conversations: [],
          totalCount: 0,
          page: 0,
          size: 20,
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(listConversations()).resolves.toMatchObject({
      conversations: [],
      totalCount: 0,
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
            isPinned: true,
            updatedAt: '2026-05-06T19:10:00+09:00',
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
          rating: 'LIKE',
          comment: '정확한 답변이었어요',
        });

        return jsonResponse({
          isSuccess: true,
          code: 201,
          message: '피드백 등록 성공',
          data: {
            feedbackId: 'fb-uuid-001',
            messageId: 'msg-uuid-002',
            rating: 'LIKE',
            createdAt: '2026-05-06T19:06:00+09:00',
          },
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
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
        rating: 'LIKE',
        comment: '정확한 답변이었어요',
      }),
    ).resolves.toMatchObject({
      feedbackId: 'fb-uuid-001',
      rating: 'LIKE',
    });
  });

  it('searches conversations with message body query pagination parameters', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const requestUrl = String(input);

      expect(requestUrl).toBe('/api/conversations/search?q=S3+%EA%B6%8C%ED%95%9C&page=0&size=20');

      return jsonResponse({
        isSuccess: true,
        code: 200,
        message: '대화 검색 성공',
        data: {
          results: [
            {
              conversationId: 'conv-uuid-001',
              title: 'S3 권한 오류 해결 방법',
              lastMessageAt: '2026-05-06T19:05:00+09:00',
              isPinned: false,
              matchedMessages: [
                {
                  messageId: 'msg-uuid-002',
                  role: 'assistant',
                  snippet: 'IAM 정책을 수정하여 S3 권한 오류를 해결했습니다.',
                  matchPositions: [[13, 18]],
                  createdAt: '2026-05-06T19:00:05+09:00',
                },
              ],
              matchCount: 1,
            },
          ],
          totalCount: 1,
          page: 0,
          size: 20,
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      searchConversations({
        q: 'S3 권한',
        page: 0,
        size: 20,
      }),
    ).resolves.toMatchObject({
      results: [
        {
          conversationId: 'conv-uuid-001',
          matchedMessages: [
            {
              role: 'assistant',
              matchPositions: [[13, 18]],
            },
          ],
        },
      ],
      totalCount: 1,
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

  it('prefixes API requests with VITE_API_BASE_URL when configured', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/');

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      if (
        requestUrl === 'https://api.example.com/api/conversations?page=1&size=10' &&
        method === 'GET'
      ) {
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

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(listConversations({ page: 1, size: 10 })).resolves.toMatchObject({
      conversations: [],
      page: 1,
      size: 10,
    });
  });

  it('unwraps Confluence page preview responses with a pageId query', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      if (requestUrl === '/api/confluence/pages/preview?pageId=12345' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: 'Confluence 페이지 미리보기 조회 성공',
          data: {
            pageId: '12345',
            title: 'S3 트러블슈팅 가이드',
            spaceName: 'Cloud Control Center',
            authorName: 'Platform Team',
            updatedAt: '2026-04-15T18:30:00+09:00',
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
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
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
            lastLoginAt: '2026-05-20T18:00:00+09:00',
          } satisfies CurrentUser,
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
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

  it('unwraps admin APIs with Bearer auth, pagination query params, and ingest endpoints', async () => {
    stubLocalStorage({ accessToken: 'admin-token' });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      expect(init?.headers).toMatchObject({
        Accept: 'application/json',
        Authorization: 'Bearer admin-token',
      });

      if (requestUrl === '/api/admin/data' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '데이터 현황 조회 성공',
          data: {
            totalSpaces: 5,
            totalPages: 1230,
            vectorDbSize: '2.3 GB',
            totalChunks: 8940,
            lastSyncAt: '2026-05-20T17:00:00+09:00',
          },
        });
      }

      if (requestUrl === '/api/admin/sync' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '동기화 이력 조회 성공',
          data: {
            syncHistory: [
              {
                syncId: 'sync-uuid-001',
                status: 'COMPLETED',
                updatedPages: 12,
                deletedPages: 1,
                duration: 45,
                completedAt: '2026-05-20T17:00:00+09:00',
              },
            ],
          },
        });
      }

      if (requestUrl === '/api/admin/stats' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '서비스 통계 조회 성공',
          data: {
            dailyQueryCount: 142,
            avgResponseTime: 3.2,
            totalConversations: 856,
            hourlyAccessTrend: [
              { hour: 9, count: 23 },
              { hour: 10, count: 45 },
            ],
          },
        });
      }

      if (requestUrl === '/api/admin/users?page=0&size=12' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 현황 조회 성공',
          data: {
            totalUsers: 48,
            dailyActiveUsers: 12,
            users: [
              {
                userId: '712020:admin-user',
                name: '관리자',
                accessibleSpaceCount: 5,
                accessiblePageCount: 320,
                accessibleAttachmentCount: 48,
                conversationCount: 35,
                lastAccessAt: '2026-05-20T18:00:00+09:00',
              },
            ],
          },
        });
      }

      if (requestUrl === '/api/admin/feedback?page=1&size=5' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '피드백 현황 조회 성공',
          data: {
            totalCount: 320,
            likeCount: 256,
            dislikeCount: 64,
            positiveRatio: 0.8,
            trend: [{ date: '2026-05-20', likeCount: 52, dislikeCount: 11 }],
            negativeFeedbacks: [
              {
                feedbackId: 'fb-uuid-101',
                messageId: 'msg-uuid-200',
                comment: '출처가 질문과 관련 없었어요',
                question: 'S3 권한 오류 원인이 뭐야?',
                answer: 'IAM 정책을 확인하세요...',
                createdAt: '2026-05-20T18:30:00+09:00',
              },
            ],
            page: 1,
            size: 5,
          },
        });
      }

      if (requestUrl === '/api/admin/ingest' && method === 'POST') {
        expect(JSON.parse(String(init?.body))).toEqual({ mode: 'delta' });

        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '데이터 수집 작업 시작',
          data: {
            jobId: 'job-uuid-001',
            status: 'STARTED',
            startedAt: '2026-05-06T19:00:00+09:00',
          },
        });
      }

      if (requestUrl === '/api/admin/ingest/status/job-uuid-001' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '수집 상태 조회 성공',
          data: {
            jobId: 'job-uuid-001',
            status: 'IN_PROGRESS',
            totalPages: 150,
            processedPages: 87,
            failedPages: 2,
            startedAt: '2026-05-06T19:00:00+09:00',
          },
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getAdminDataOverview()).resolves.toMatchObject({
      totalSpaces: 5,
      totalPages: 1230,
    });
    await expect(getAdminSyncHistory()).resolves.toMatchObject({
      syncHistory: [{ syncId: 'sync-uuid-001', status: 'COMPLETED' }],
    });
    await expect(getAdminStats()).resolves.toMatchObject({
      dailyQueryCount: 142,
      hourlyAccessTrend: expect.arrayContaining([expect.objectContaining({ hour: 9, count: 23 })]),
    });
    await expect(getAdminUsers({ page: 0, size: 12 })).resolves.toMatchObject({
      totalUsers: 48,
      users: [{ userId: '712020:admin-user' }],
    });
    await expect(getAdminFeedback({ page: 1, size: 5 })).resolves.toMatchObject({
      totalCount: 320,
      negativeFeedbacks: [{ feedbackId: 'fb-uuid-101' }],
      page: 1,
      size: 5,
    });
    await expect(startAdminIngestJob({ mode: 'delta' })).resolves.toMatchObject({
      jobId: 'job-uuid-001',
      status: 'STARTED',
    });
    await expect(getAdminIngestStatus('job-uuid-001')).resolves.toMatchObject({
      jobId: 'job-uuid-001',
      status: 'IN_PROGRESS',
      totalPages: 150,
      processedPages: 87,
    });
  });

  it('attaches Authorization header from localStorage to SSE chat requests', async () => {
    stubLocalStorage({ accessToken: 'token-for-sse' });

    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        Authorization: 'Bearer token-for-sse',
      });

      return new Response('event: done\ndata: {"messageId":"msg-stream-001"}\n\n', {
        headers: {
          'Content-Type': 'text/event-stream',
        },
        status: 200,
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      streamConversationChat('conv-uuid-001', {
        question: '실제 BFF 연동 테스트',
      }),
    ).resolves.toBeInstanceOf(Response);
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

function stubLocalStorage(initialValues: Record<string, string> = {}) {
  const storage = new Map(Object.entries(initialValues));

  const localStorageMock = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
    clear: vi.fn(() => {
      storage.clear();
    }),
  };

  vi.stubGlobal('localStorage', localStorageMock);
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: localStorageMock,
  });

  return localStorageMock;
}
