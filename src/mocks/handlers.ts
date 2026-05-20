/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend Chat API mock handler 정의.
 *           MSW browser worker와 test server가 동일한 mock 응답 계약을 공유한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature6 구현, conversations/messages/chat mock handler 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x, MSW 2.7.x 기준
 * --------------------------------------------------
 */
import { HttpResponse, http } from 'msw';

import {
  mockConfluencePreviewPages,
  mockConversations,
  mockCurrentUser,
  mockMessagesByConversationId,
  mockSources,
} from './data';
import type {
  ApiSuccessResponse,
  ConversationList,
  ConversationMessages,
  CurrentUser,
} from '@/types/api';

export const mockHandlers = [
  // TODO(MOCK): GET /api/users/me
  http.get('*/api/users/me', () => {
    return HttpResponse.json<ApiSuccessResponse<CurrentUser>>({
      isSuccess: true,
      code: 200,
      message: '사용자 정보 조회 성공',
      data: mockCurrentUser,
    });
  }),

  // TODO(MOCK): GET /api/conversations
  http.get('/api/conversations', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Number(url.searchParams.get('size') ?? 20);
    const startIndex = page * size;
    const conversations = mockConversations.slice(startIndex, startIndex + size);

    return HttpResponse.json<ApiSuccessResponse<ConversationList>>({
      isSuccess: true,
      code: 200,
      message: '대화 목록 조회 성공',
      data: {
        conversations,
        totalCount: mockConversations.length,
        page,
        size,
      },
    });
  }),

  // TODO(MOCK): GET /api/conversations/{conversationId}/messages
  http.get('*/api/conversations/:conversationId/messages', ({ params }) => {
    const conversationId = String(params.conversationId);

    return HttpResponse.json<ApiSuccessResponse<ConversationMessages>>({
      isSuccess: true,
      code: 200,
      message: '메시지 이력 조회 성공',
      data: {
        conversationId,
        messages: mockMessagesByConversationId[conversationId] ?? [],
      },
    });
  }),

  // TODO(MOCK): POST /api/conversations/{conversationId}/chat
  http.post('*/api/conversations/:conversationId/chat', () => {
    return new HttpResponse(createMockSseStream(), {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),

  // TODO(MOCK): GET /api/confluence/pages/preview?page_id={pageId}
  http.get('*/api/confluence/pages/preview', ({ request }) => {
    const url = new URL(request.url);
    const pageId = url.searchParams.get('page_id') ?? '';
    const previewPage = mockConfluencePreviewPages[pageId];

    if (!previewPage) {
      return HttpResponse.json(
        {
          isSuccess: false,
          code: 404,
          message: 'Confluence 페이지 미리보기를 찾을 수 없습니다',
          data: null,
        },
        {
          status: 404,
        },
      );
    }

    return HttpResponse.json({
      isSuccess: true,
      code: 200,
      message: 'Confluence 페이지 미리보기 조회 성공',
      data: previewPage,
    });
  }),
];

function createMockSseStream(): string {
  return [
    createSseEvent('token', { content: 'S3 권한 오류는' }),
    createSseEvent('token', { content: ' IAM 정책을 수정하여 해결했습니다.' }),
    createSseEvent('sources', { sources: mockSources }),
    createSseEvent('verification', {
      confidenceScore: 0.85,
      verificationResult: 'SUPPORTED',
    }),
    createSseEvent('done', { messageId: 'msg-mock-assistant-stream' }),
  ].join('');
}

function createSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
