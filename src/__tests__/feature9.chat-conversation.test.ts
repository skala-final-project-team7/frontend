/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat SCR-410/420/600 대화 화면 통합 테스트.
 *           메시지 렌더링, 입력, SSE 누적, route submit fallback, page-level scroll layout을 검증한다.
 * 작성일 : 2026-05-21
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-21, feature9 구현, 대화 화면 렌더링과 입력 플로우 테스트 추가
 *   - 2026-05-22, feature9 보강, streaming status, IME, route fallback, page-level scroll 회귀 테스트 추가
 *   - 2026-05-26, feature9 회귀 보강, 지연된 메시지 이력 실패가 새 스트림을 제거하지 않는지 검증
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vitest 2.1.x, Vue Test Utils 2.4.x 기준
 * --------------------------------------------------
 */
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MessageBubble from '@/features/chat/MessageBubble.vue';
import MessageInput from '@/features/chat/MessageInput.vue';
import { mockConversations, mockCurrentUser, mockMessagesByConversationId } from '@/mocks/data';
import ChatPage from '@/pages/ChatPage.vue';
import router from '@/router';

/**
 * ChatPage를 Pinia와 router가 주입된 상태로 마운트한다.
 *
 * @returns 테스트용 ChatPage wrapper
 */
function mountChatPage() {
  return mount(ChatPage, {
    global: {
      plugins: [createPinia(), router],
    },
  });
}

/**
 * JSON 응답을 생성한다.
 *
 * @param data JSON body로 반환할 payload
 * @param status HTTP status code
 * @returns JSON Response
 */
function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

/**
 * 텍스트/event-stream SSE 응답을 생성한다.
 *
 * @returns 테스트용 SSE Response
 */
function createSseResponse(): Response {
  return new Response(
    [
      'event: sources\n',
      'data: {"sources":[{"title":"S3 트러블슈팅 가이드","pageId":"12345","spaceId":"98310","spaceName":"Cloud Control Center","url":"https://confluence.example.com/pages/12345","sourceUpdatedAt":"2026-04-15T18:30:00+09:00","relevanceScore":0.92}]}\n\n',
      'event: verification\n',
      'data: {"confidenceScore":0.85,"verificationResult":"SUPPORTED"}\n\n',
      'event: token\n',
      'data: {"content":"IAM 정책과 "}\n\n',
      'event: token\n',
      'data: {"content":"버킷 정책을 함께 점검했습니다."}\n\n',
      'event: meta\n',
      'data: {"intent":"운영가이드","used_llm":"gpt-4o","feedback_enabled":true,"latency_ms":1234,"title":"SSE가 생성한 대화 제목"}\n\n',
      'event: done\n',
      'data: {"messageId":"msg-streamed-assistant"}\n\n',
    ].join(''),
    {
      headers: {
        'Content-Type': 'text/event-stream',
      },
      status: 200,
    },
  );
}

/**
 * chat 화면에서 사용하는 API 호출을 테스트용 mock fetch로 대체한다.
 *
 * @returns install된 fetch mock
 */
function installFeature9FetchMock() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const requestUrl =
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method ?? 'GET';

    if (requestUrl === '/api/conversations' && method === 'POST') {
      return createJsonResponse(
        {
          isSuccess: true,
          code: 201,
          message: '새 대화 생성 성공',
          data: {
            conversationId: 'conv-mock-created',
            title: '새 대화',
            createdAt: '2026-05-21T19:00:00+09:00',
          },
        },
        201,
      );
    }

    if (requestUrl.includes('/api/users/me')) {
      return createJsonResponse({
        isSuccess: true,
        code: 200,
        message: '사용자 정보 조회 성공',
        data: mockCurrentUser,
      });
    }

    if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/messages')) {
      const conversationId = requestUrl.match(/\/api\/conversations\/([^/]+)\/messages/)?.[1] ?? '';

      return createJsonResponse({
        isSuccess: true,
        code: 200,
        message: '메시지 이력 조회 성공',
        data: {
          conversationId,
          messages: mockMessagesByConversationId[conversationId] ?? [],
        },
      });
    }

    if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/chat')) {
      expect(method).toBe('POST');
      return createSseResponse();
    }

    if (requestUrl.includes('/api/conversations')) {
      return createJsonResponse({
        isSuccess: true,
        code: 200,
        message: '대화 목록 조회 성공',
        data: {
          conversations: mockConversations,
          totalCount: mockConversations.length,
          page: 0,
          size: 20,
        },
      });
    }

    return createJsonResponse(
      {
        isSuccess: false,
        code: 404,
        message: 'not found',
        data: null,
      },
      404,
    );
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

/**
 * 비동기 렌더링과 route watcher가 반영될 때까지 UI tick을 비운다.
 */
async function flushAsyncUpdates() {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

describe('feature9 SCR-410, SCR-420, SCR-600 Chat conversation screen', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    installFeature9FetchMock();
    await router.push('/chat/conv-mock-001');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders conversation messages with distinct user and LINA bubble treatments', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="chat-empty-state"]').exists()).toBe(false);
    expect(wrapper.get('header').classes()).toContain('border-bg-300');
    expect(wrapper.get('[data-testid="conversation-title"]').text()).toBe(
      mockConversations.find((conversation) => conversation.conversationId === 'conv-mock-001')
        ?.title,
    );
    expect(wrapper.get('[data-testid="conversation-title"]').classes()).toContain('text-[18px]');
    expect(wrapper.findAll('[data-testid="message-bubble"]')).toHaveLength(2);
    expect(wrapper.get('[data-testid="message-bubble-user"]').classes()).toEqual(
      expect.arrayContaining(['border', 'border-bg-300']),
    );
    expect(wrapper.get('[data-testid="message-bubble-assistant"]').classes()).not.toContain(
      'border',
    );
    expect(wrapper.text()).toContain('출처');
    expect(wrapper.find('[data-testid="source-button"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Check Reference');
    expect(wrapper.text()).not.toContain('S3 트러블슈팅 가이드');
    expect(wrapper.text()).not.toContain('답변 생성');
    expect(wrapper.text()).not.toContain('근거 검증');
    expect(wrapper.find('[data-testid="message-action-row-user"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="message-action-row-assistant"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="message-copy-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="message-edit-button"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="assistant-copy-button"]').attributes('aria-label')).toBe(
      '응답 복사',
    );
    expect(wrapper.get('[data-testid="assistant-like-button"]').attributes('aria-label')).toBe(
      '좋은 응답',
    );
    expect(wrapper.get('[data-testid="assistant-dislike-button"]').attributes('aria-label')).toBe(
      '별로인 응답',
    );
    expect(
      wrapper.get('[data-testid="assistant-regenerate-button"]').attributes('aria-label'),
    ).toBe('다시 시도');

    const tooltipLabels = wrapper
      .findAll('[data-testid="base-tooltip"]')
      .map((tooltip) => tooltip.attributes('aria-label'));

    expect(tooltipLabels).toEqual(
      expect.arrayContaining(['응답 복사', '좋은 응답', '별로인 응답', '다시 시도']),
    );
  });

  it('shows backend status message before token chunks arrive', () => {
    const wrapper = mount(MessageBubble, {
      props: {
        message: {
          messageId: 'msg-local-assistant-phase',
          role: 'assistant',
          content: '',
          createdAt: '2026-05-21T00:00:00Z',
          sources: [],
          statusMessage: '사용자 권한 범위 내에서 접근 가능한 문서를 확인하고 있습니다.',
        },
        editingMessageId: '',
        editingContent: '',
        isStreaming: true,
        streamingMessageId: 'msg-local-assistant-phase',
      },
    });

    expect(wrapper.get('[data-testid="assistant-stream-loading"]').text()).toContain(
      '사용자 권한 범위 내에서 접근 가능한 문서를 확인하고 있습니다.',
    );
  });

  it('keeps Enter submit and Shift+Enter multiline behavior in MessageInput', async () => {
    const onSubmit = vi.fn();
    const wrapper = mount(MessageInput, {
      props: {
        onSubmit,
      },
    });
    const textarea = wrapper.get('textarea');

    await textarea.setValue('첫 줄');
    await textarea.trigger('keydown.enter.shift');
    await textarea.setValue('첫 줄\n두 번째 줄');

    expect(onSubmit).not.toHaveBeenCalled();
    expect((textarea.element as HTMLTextAreaElement).value).toBe('첫 줄\n두 번째 줄');

    await textarea.trigger('keydown.enter');

    expect(onSubmit).toHaveBeenCalledWith('첫 줄\n두 번째 줄');
  });

  it('does not submit incomplete Korean IME composition on Enter', async () => {
    const onSubmit = vi.fn();
    const wrapper = mount(MessageInput, {
      props: {
        onSubmit,
      },
    });
    const textarea = wrapper.get('textarea');

    await textarea.setValue('가');
    await textarea.trigger('compositionstart');
    await textarea.setValue('가가');
    await textarea.trigger('keydown', {
      key: 'Enter',
      isComposing: true,
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect((textarea.element as HTMLTextAreaElement).value).toBe('가가');

    await textarea.trigger('compositionend');
    await textarea.trigger('keydown', {
      key: 'Enter',
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('가가');
  });

  it('streams submitted question into an accumulated LINA answer', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('textarea').setValue('S3 권한 오류를 다시 정리해줘');
    await wrapper.get('textarea').trigger('keydown.enter');
    await flushAsyncUpdates();

    expect(wrapper.text()).toContain('S3 권한 오류를 다시 정리해줘');
    expect(wrapper.text()).toContain('IAM 정책과 버킷 정책을 함께 점검했습니다.');
    expect(wrapper.find('[data-testid="source-button"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Check Reference');
    expect(wrapper.text()).not.toContain('S3 트러블슈팅 가이드');
  });

  it('updates the current conversation title from meta.title', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('textarea').setValue('S3 권한 오류를 다시 정리해줘');
    await wrapper.get('textarea').trigger('keydown.enter');
    await flushAsyncUpdates();

    expect(wrapper.get('[data-testid="conversation-title"]').text()).toBe('SSE가 생성한 대화 제목');
  });

  it('uses the route conversation id when submitting before message history finishes loading', async () => {
    let resolveMessages: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      if (requestUrl.includes('/api/users/me')) {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 정보 조회 성공',
          data: mockCurrentUser,
        });
      }

      if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/messages')) {
        return new Promise<Response>((resolve) => {
          resolveMessages = resolve;
        });
      }

      if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/chat')) {
        expect(method).toBe('POST');
        return createSseResponse();
      }

      if (requestUrl.includes('/api/conversations')) {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '대화 목록 조회 성공',
          data: {
            conversations: mockConversations,
            totalCount: mockConversations.length,
            page: 0,
            size: 20,
          },
        });
      }

      return createJsonResponse(
        {
          isSuccess: false,
          code: 404,
          message: 'not found',
          data: null,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountChatPage();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    await wrapper.get('textarea').setValue('로딩 중 바로 질문');
    await wrapper.get('textarea').trigger('keydown.enter');
    await flushAsyncUpdates();

    expect(
      fetchMock.mock.calls.some(([input, init]) => {
        const requestUrl =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        return requestUrl === '/api/conversations' && init?.method === 'POST';
      }),
    ).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/conversations/conv-mock-001/chat',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(wrapper.text()).toContain('로딩 중 바로 질문');
    expect(wrapper.text()).toContain('IAM 정책과 버킷 정책을 함께 점검했습니다.');

    resolveMessages?.(
      createJsonResponse({
        isSuccess: true,
        code: 200,
        message: '메시지 이력 조회 성공',
        data: {
          conversationId: 'conv-mock-001',
          messages: mockMessagesByConversationId['conv-mock-001'],
        },
      }),
    );
    await flushAsyncUpdates();
  });

  it('preserves a streamed reply when a pending message history request fails afterward', async () => {
    let rejectMessages: ((error: Error) => void) | undefined;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      if (requestUrl.includes('/api/users/me')) {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 정보 조회 성공',
          data: mockCurrentUser,
        });
      }

      if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/messages')) {
        return new Promise<Response>((_resolve, reject) => {
          rejectMessages = reject;
        });
      }

      if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/chat')) {
        expect(method).toBe('POST');
        return createSseResponse();
      }

      if (requestUrl.includes('/api/conversations')) {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '대화 목록 조회 성공',
          data: {
            conversations: mockConversations,
            totalCount: mockConversations.length,
            page: 0,
            size: 20,
          },
        });
      }

      return createJsonResponse(
        {
          isSuccess: false,
          code: 404,
          message: 'not found',
          data: null,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountChatPage();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    await wrapper.get('textarea').setValue('이력 로딩 중 전송한 질문');
    await wrapper.get('textarea').trigger('keydown.enter');
    await flushAsyncUpdates();

    expect(wrapper.text()).toContain('이력 로딩 중 전송한 질문');
    expect(wrapper.text()).toContain('IAM 정책과 버킷 정책을 함께 점검했습니다.');

    rejectMessages?.(new Error('message history request failed'));
    await flushAsyncUpdates();

    expect(wrapper.text()).toContain('이력 로딩 중 전송한 질문');
    expect(wrapper.text()).toContain('IAM 정책과 버킷 정책을 함께 점검했습니다.');
  });

  it('renders loading spinner for an empty assistant placeholder while streaming', () => {
    const wrapper = mount(MessageBubble, {
      props: {
        message: {
          messageId: 'msg-local-assistant-loading',
          role: 'assistant',
          content: '',
          createdAt: '2026-05-21T00:00:00Z',
          sources: [],
          statusMessage: '관련 문서를 검색하고 있습니다.',
        },
        editingMessageId: '',
        editingContent: '',
        isStreaming: true,
        streamingMessageId: 'msg-local-assistant-loading',
      },
    });

    expect(wrapper.get('[data-testid="assistant-stream-loading"]').text()).toContain(
      '관련 문서를 검색하고 있습니다.',
    );
    expect(wrapper.findAll('[data-testid="base-spinner-dot"]')).toHaveLength(3);
    expect(wrapper.find('[data-testid="source-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="message-action-row-assistant"]').exists()).toBe(false);
  });

  it('hides answer actions for cancelled empty placeholders and error responses', () => {
    const cancelledWrapper = mount(MessageBubble, {
      props: {
        message: {
          messageId: 'msg-local-assistant-cancelled',
          role: 'assistant',
          content: '',
          createdAt: '2026-05-21T00:00:00Z',
          sources: [],
        },
        editingMessageId: '',
        editingContent: '',
        isStreaming: false,
        streamingMessageId: '',
      },
    });
    const errorWrapper = mount(MessageBubble, {
      props: {
        message: {
          messageId: 'msg-local-assistant-error',
          role: 'assistant',
          content: '답변 생성 중 오류가 발생했습니다',
          createdAt: '2026-05-21T00:00:00Z',
          phase: 'error',
          error: '답변 생성 중 오류가 발생했습니다',
          sources: [],
        },
        editingMessageId: '',
        editingContent: '',
        isStreaming: false,
        streamingMessageId: '',
      },
    });

    expect(cancelledWrapper.find('[data-testid="source-button"]').exists()).toBe(false);
    expect(cancelledWrapper.find('[data-testid="message-action-row-assistant"]').exists()).toBe(
      false,
    );
    expect(errorWrapper.find('[data-testid="source-button"]').exists()).toBe(false);
    expect(errorWrapper.find('[data-testid="message-action-row-assistant"]').exists()).toBe(false);
  });

  it('keeps the first streamed answer visible when entering chat from /chat', async () => {
    await router.push('/chat');
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="chat-empty-state"]').exists()).toBe(true);

    await wrapper.get('textarea').setValue('첫 질문입니다');
    await wrapper.get('textarea').trigger('keydown.enter');
    await flushAsyncUpdates();

    expect(router.currentRoute.value.fullPath).toBe('/chat/conv-mock-created');
    expect(wrapper.find('[data-testid="chat-empty-state"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('첫 질문입니다');
    expect(wrapper.text()).toContain('IAM 정책과 버킷 정책을 함께 점검했습니다.');
    expect(wrapper.find('[data-testid="assistant-stream-loading"]').exists()).toBe(false);
  });

  it('uses page-level scrolling while keeping the conversation header sticky and input fixed', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    expect(wrapper.get('[data-testid="chat-main"]').classes()).toEqual(
      expect.arrayContaining(['min-h-screen', 'flex-col']),
    );
    expect(wrapper.get('header').classes()).toEqual(expect.arrayContaining(['sticky', 'top-0']));
    expect(wrapper.get('[data-testid="chat-scroll-region"]').classes()).toEqual(
      expect.arrayContaining(['w-full', 'overflow-x-clip', 'pb-[220px]']),
    );
    expect(wrapper.get('[data-testid="chat-page"]').classes()).toContain('overflow-x-clip');
    expect(wrapper.get('[data-testid="chat-page"]').classes()).not.toContain('overflow-x-hidden');
    expect(wrapper.get('[data-testid="chat-scroll-region"]').classes()).not.toContain('flex-1');
    expect(wrapper.get('[data-testid="chat-scroll-region"]').classes()).not.toContain(
      'overflow-x-hidden',
    );
    expect(wrapper.get('[data-testid="chat-scroll-region"]').classes()).not.toContain(
      'overflow-y-auto',
    );
    expect(wrapper.get('[data-testid="chat-scroll-region"]').classes()).not.toContain(
      'overflow-y-scroll',
    );
    expect(wrapper.get('[data-testid="message-list"]').classes()).not.toContain('flex-1');
    expect(wrapper.get('[data-testid="message-list"]').classes()).toContain('overflow-x-clip');
    expect(wrapper.get('[data-testid="message-list"]').classes()).not.toContain(
      'overflow-x-hidden',
    );
    expect(wrapper.get('[data-testid="message-list"]').classes()).not.toContain('overflow-y-auto');
    expect(wrapper.get('[data-testid="chat-input-region"]').classes()).toEqual(
      expect.arrayContaining(['fixed', 'bottom-0', 'right-0', 'shrink-0']),
    );
  });

  it('hides user message editing until backend version history contract is defined', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="message-action-icons-user"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="message-edit-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="message-edit-textarea"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="message-version-navigation"]').exists()).toBe(false);
  });

  it('connects sidebar conversation titles to each conversation message history and pinned state', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('[data-testid="sidebar-mascot-toggle"]').trigger('click');
    await new Promise((resolve) => window.setTimeout(resolve, 200));

    expect(wrapper.find('[data-testid="pinned-chat-list"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="pinned-chat-list"]').text()).toContain(
      mockConversations.find((conversation) => conversation.isPinned)?.title,
    );

    await wrapper
      .findAll('[data-testid="conversation-list-item"]')
      .find((item) => item.text().includes('Confluence 문서 동기화 상태 확인'))
      ?.trigger('click');
    await flushAsyncUpdates();

    expect(router.currentRoute.value.fullPath).toBe('/chat/conv-mock-002');
    expect(wrapper.text()).toContain('문서 동기화가 마지막으로 언제 성공했어?');
    expect(wrapper.text()).not.toContain('지난번 S3 버킷 권한 오류 때 어떻게 해결했어?');
  });

  it('shows the selected conversation history instead of the empty state when entering from /chat', async () => {
    await router.push('/chat');
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="chat-empty-state"]').exists()).toBe(true);

    await wrapper.get('[data-testid="sidebar-mascot-toggle"]').trigger('click');
    await new Promise((resolve) => window.setTimeout(resolve, 200));

    await wrapper
      .findAll('[data-testid="conversation-list-item"]')
      .find((item) => item.text().includes('Confluence 문서 동기화 상태 확인'))
      ?.trigger('click');
    await flushAsyncUpdates();

    expect(router.currentRoute.value.fullPath).toBe('/chat/conv-mock-002');
    expect(wrapper.find('[data-testid="chat-empty-state"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('문서 동기화가 마지막으로 언제 성공했어?');
  });
});
