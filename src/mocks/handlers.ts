/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend Chat API mock handler 정의.
 *           MSW browser worker와 test server가 동일한 mock 응답 계약을 공유한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature6 구현, conversations/messages/chat mock handler 추가
 *   - 2026-05-21, feature9 보강, SSE mock 응답을 ReadableStream chunk 방식으로 변경
 *   - 2026-05-22, feature9 보강, RAG phase placeholder 검증용 SSE event 순서 조정
 *   - 2026-05-22, feature9 SSE 보강, status 이벤트 mock 추가
 *   - 2026-05-22, RAG status 계약 반영, 확정 phase 순서와 meta 이벤트 mock 추가
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
  CreateConversationResponse,
  ConversationList,
  ConversationMessages,
  CurrentUser,
} from '@/types/api';

// TODO(MOCK): 3초 mock SSE 지연은 token streaming 확인용이므로 backend 연결 전 제거하거나 단축한다.
const MOCK_SSE_DEMO_DELAY_MS = import.meta.env.MODE === 'test' ? 0 : 375;

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

  // TODO(MOCK): POST /api/conversations
  http.post('*/api/conversations', () => {
    return HttpResponse.json<ApiSuccessResponse<CreateConversationResponse>>({
      isSuccess: true,
      code: 201,
      message: '새 대화 생성 성공',
      data: {
        conversationId: 'conv-mock-003',
        title: '새 대화',
        createdAt: '2026-05-21T10:00:00Z',
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

/**
 * status/token/sources/verification/meta/done 이벤트를 순차 전송하는 mock SSE 스트림을 생성한다.
 *
 * @returns MSW HttpResponse에 전달할 ReadableStream
 */
function createMockSseStream(): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const events = [
    createSseEvent('status', {
      phase: 'connecting',
      message: '연결 중이에요',
    }),
    createSseEvent('status', {
      phase: 'acl_filtering',
      message: '접근 권한을 확인하고 있어요',
    }),
    createSseEvent('status', {
      phase: 'searching',
      message: '관련 문서를 검색하고 있어요',
    }),
    createSseEvent('status', {
      phase: 'answering',
      message: '답변을 준비하고 있어요',
    }),
    createSseEvent('status', {
      phase: 'streaming',
      message: '답변을 작성하고 있어요',
    }),
    createSseEvent('token', { content: 'S3 권한 ' }),
    createSseEvent('token', { content: '오류는 ' }),
    createSseEvent('token', { content: 'IAM 정책과 ' }),
    createSseEvent('token', { content: '버킷 정책을 ' }),
    createSseEvent('token', { content: '함께 점검해 ' }),
    createSseEvent('token', { content: '해결했습니다.' }),
    createSseEvent('status', {
      phase: 'verifying',
      message: '답변 근거를 검증하고 있어요',
    }),
    createSseEvent('status', {
      phase: 'formatting',
      message: '답변을 정리하고 있어요',
    }),
    createSseEvent('sources', { sources: mockSources }),
    createSseEvent('verification', {
      confidenceScore: 0.85,
      verificationResult: 'SUPPORTED',
    }),
    createSseEvent('meta', {
      intent: '운영가이드',
      used_llm: 'gpt-4o',
      feedback_enabled: true,
      latency_ms: 1234,
      title: 'S3 권한 오류 해결 방법',
    }),
    createSseEvent('done', { messageId: 'msg-mock-assistant-stream' }),
  ];

  return new ReadableStream({
    async start(controller) {
      for (const event of events) {
        await new Promise((resolve) => globalThis.setTimeout(resolve, MOCK_SSE_DEMO_DELAY_MS));
        controller.enqueue(encoder.encode(event));
      }

      controller.close();
    },
  });
}

/**
 * SSE frame을 `event:` / `data:` 줄 구성으로 인코딩한다.
 *
 * @param event SSE 이벤트 이름
 * @param data JSON 직렬화할 payload
 * @returns 한 개의 SSE frame 문자열
 */
function createSseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
