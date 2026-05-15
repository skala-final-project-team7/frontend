import { http, HttpResponse } from 'msw';

import { mockConversations, mockMessages, mockSources } from '@/mocks/data/conversations';

export const handlers = [
  // TODO(MOCK): GET /api/conversations
  http.get('/api/conversations', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 20);

    return HttpResponse.json({
      isSuccess: true,
      code: 200,
      message: '대화 목록 조회 성공',
      data: {
        conversations: mockConversations,
        totalCount: mockConversations.length,
        page,
        size,
      },
    });
  }),

  // TODO(MOCK): POST /api/conversations
  http.post('/api/conversations', () =>
    HttpResponse.json(
      {
        isSuccess: true,
        code: 201,
        message: '새 대화 생성 성공',
        data: {
          conversationId: 'conv-uuid-new',
          title: '새 대화',
          createdAt: '2026-05-15T09:00:00Z',
        },
      },
      { status: 201 },
    ),
  ),

  // TODO(MOCK): GET /api/conversations/{conversationId}/messages
  http.get('/api/conversations/:conversationId/messages', ({ params }) =>
    HttpResponse.json({
      isSuccess: true,
      code: 200,
      message: '메시지 이력 조회 성공',
      data: {
        conversationId: params.conversationId,
        messages: mockMessages,
      },
    }),
  ),

  // TODO(MOCK): POST /api/conversations/{conversationId}/chat
  http.post('/api/conversations/:conversationId/chat', () => {
    const body = [
      'event: token',
      'data: {"content":"S3 권한 오류는"}',
      '',
      'event: token',
      'data: {"content":" IAM 정책을 수정하여 해결했습니다."}',
      '',
      'event: sources',
      `data: ${JSON.stringify({ sources: mockSources })}`,
      '',
      'event: verification',
      'data: {"confidenceScore":0.85,"verificationResult":"SUPPORTED"}',
      '',
      'event: done',
      'data: {"messageId":"msg-uuid-streamed"}',
      '',
    ].join('\n');

    return new HttpResponse(body, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });
  }),
];
