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
 *   - 2026-06-15, feature11 구현, Chat 로드 에러 retry 및 assistant 오류 재시도/feedback messageId 회귀 테스트 추가
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
import { useToast } from '@/composables/useToast';

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

function getConversationSearchButton(wrapper: ReturnType<typeof mountChatPage>) {
  const searchButton = wrapper
    .findAll('button')
    .find((button) => button.attributes('aria-label') === '채팅 검색');

  if (!searchButton) {
    throw new Error('Conversation search button was not found');
  }

  return searchButton;
}

function getCollapsedConversationListButton(wrapper: ReturnType<typeof mountChatPage>) {
  const conversationListButton = wrapper
    .findAll('button')
    .find((button) => button.attributes('aria-label') === '채팅 목록');

  if (!conversationListButton) {
    throw new Error('Collapsed conversation list button was not found');
  }

  return conversationListButton;
}

function setPageScrollState(scrollY: number, innerHeight: number, scrollHeight: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value: scrollY,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: innerHeight,
  });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  });
  Object.defineProperty(document.documentElement, 'offsetHeight', {
    configurable: true,
    value: scrollHeight,
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
function installFeature9FetchMock(conversationList = mockConversations) {
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

    if (requestUrl.includes('/api/messages/') && requestUrl.endsWith('/feedback')) {
      return createJsonResponse(
        {
          isSuccess: true,
          code: 201,
          message: '피드백 등록 성공',
          data: {
            feedbackId: 'fb-mock-001',
            messageId: requestUrl.match(/\/api\/messages\/([^/]+)\/feedback/)?.[1] ?? '',
            rating: JSON.parse(String(init?.body)).rating,
            createdAt: '2026-05-21T19:10:00+09:00',
          },
        },
        201,
      );
    }

    if (requestUrl.includes('/api/conversations/search')) {
      const url = new URL(requestUrl, 'http://localhost');
      const query = url.searchParams.get('q') ?? '';

      if (query === 'empty') {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '대화 검색 성공',
          data: {
            results: [],
            totalCount: 0,
            page: 0,
            size: 20,
          },
        });
      }

      if (query === 'fail') {
        return createJsonResponse(
          {
            isSuccess: false,
            code: 500,
            errorCode: 'INTERNAL_ERROR',
            message: '검색 실패',
          },
          500,
        );
      }

      return createJsonResponse({
        isSuccess: true,
        code: 200,
        message: '대화 검색 성공',
        data: {
          results: [
            {
              conversationId: 'conv-mock-001',
              title: 'S3 권한 오류 해결 방법',
              lastMessageAt: '2026-05-06T19:05:00+09:00',
              isPinned: true,
              matchedMessages: [
                {
                  messageId: 'msg-mock-assistant-001',
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
    }

    if (requestUrl.includes('/api/conversations')) {
      return createJsonResponse({
        isSuccess: true,
        code: 200,
        message: '대화 목록 조회 성공',
        data: {
          conversations: conversationList,
          totalCount: conversationList.length,
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
    const { dismissToast, toasts } = useToast();

    toasts.value.forEach((toast) => dismissToast(toast.id));
    await router.push('/chat/conv-mock-001');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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

  it('copies assistant response text from the copy icon and reports the result', async () => {
    vi.useFakeTimers();

    try {
      const writeText = vi.fn().mockResolvedValue(undefined);

      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText,
        },
      });

      const wrapper = mountChatPage();
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(0);

      await wrapper.get('[data-testid="assistant-copy-button"]').trigger('click');
      await Promise.resolve();
      await wrapper.vm.$nextTick();

      const { toasts } = useToast();

      expect(writeText).toHaveBeenCalledWith(
        'S3 권한 오류는 IAM 정책의 버킷 접근 권한을 보강해 해결했습니다.',
      );
      expect(wrapper.find('[data-testid="assistant-copy-confirmed-icon"]').exists()).toBe(true);
      expect(toasts.value.at(-1)).toMatchObject({
        message: '응답이 복사되었습니다',
        variant: 'success',
      });

      await vi.advanceTimersByTimeAsync(4000);

      expect(wrapper.find('[data-testid="assistant-copy-confirmed-icon"]').exists()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows an error toast when assistant response copy fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('clipboard unavailable')),
      },
    });

    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('[data-testid="assistant-copy-button"]').trigger('click');
    await flushAsyncUpdates();

    const { toasts } = useToast();

    expect(toasts.value.at(-1)).toMatchObject({
      message: '응답 복사에 실패했습니다',
      variant: 'error',
    });
  });

  it('opens feedback modal from assistant thumbs down and submits reason with optional comment', async () => {
    const fetchMock = installFeature9FetchMock();
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('[data-testid="assistant-dislike-button"]').trigger('click');

    expect(wrapper.get('[data-testid="feedback-modal"]').text()).toContain('피드백 공유');
    expect(wrapper.get('[data-testid="feedback-close-button"]').classes()).not.toContain(
      'hover:border-status-error',
    );
    expect(wrapper.get('[data-testid="feedback-close-button"]').classes()).not.toContain(
      'focus-visible:border-status-error',
    );
    expect(wrapper.get('[data-testid="feedback-submit-button"]').attributes('disabled')).toBe('');

    await wrapper.get('[data-testid="feedback-reason-incorrect"]').trigger('click');
    await wrapper
      .get('[data-testid="feedback-comment-input"]')
      .setValue('S3 해결 절차가 중간에 끊겼어요.');
    await wrapper.get('[data-testid="feedback-submit-button"]').trigger('click');
    await flushAsyncUpdates();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/messages/msg-mock-assistant-001/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          rating: 'DISLIKE',
          comment: '[올바르지 않거나 끝까지 작성되지 않음] S3 해결 절차가 중간에 끊겼어요.',
        }),
      }),
    );
    expect(wrapper.find('[data-testid="feedback-modal"]').exists()).toBe(false);
  });

  it('submits thumbs up feedback immediately without opening the feedback modal', async () => {
    const fetchMock = installFeature9FetchMock();
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('[data-testid="assistant-like-button"]').trigger('click');
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="feedback-modal"]').exists()).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/messages/msg-mock-assistant-001/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          rating: 'LIKE',
        }),
      }),
    );
    expect(wrapper.get('[data-testid="assistant-like-button"]').attributes('aria-pressed')).toBe(
      'true',
    );
    expect(wrapper.get('[data-testid="assistant-dislike-button"]').attributes('aria-pressed')).toBe(
      'false',
    );
  });

  it('keeps the selected dislike button highlighted after feedback modal submission succeeds', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('[data-testid="assistant-dislike-button"]').trigger('click');
    await wrapper.get('[data-testid="feedback-reason-incorrect"]').trigger('click');
    await wrapper.get('[data-testid="feedback-submit-button"]').trigger('click');
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="feedback-modal"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="assistant-dislike-button"]').attributes('aria-pressed')).toBe(
      'true',
    );
    expect(wrapper.get('[data-testid="assistant-like-button"]').attributes('aria-pressed')).toBe(
      'false',
    );
  });

  it('submits feedback with the server assistant messageId after SSE done replaces the local placeholder id', async () => {
    const fetchMock = installFeature9FetchMock();
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('textarea').setValue('SSE feedback 대상 질문');
    await wrapper.get('textarea').trigger('keydown.enter');
    await flushAsyncUpdates();

    await wrapper.findAll('[data-testid="assistant-like-button"]').at(-1)!.trigger('click');
    await flushAsyncUpdates();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/messages/msg-streamed-assistant/feedback',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          rating: 'LIKE',
        }),
      }),
    );
  });

  it('shows a spinner on the thumbs up button while feedback is submitting', async () => {
    let resolveFeedback: (response: Response) => void = () => undefined;
    const fetchMock = installFeature9FetchMock();
    const defaultFetchMock = fetchMock.getMockImplementation();

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (requestUrl.includes('/api/messages/') && requestUrl.endsWith('/feedback')) {
        return await new Promise<Response>((resolve) => {
          resolveFeedback = resolve;
        });
      }

      if (!defaultFetchMock) {
        throw new Error('Default fetch mock was not installed');
      }

      return await defaultFetchMock(input, init);
    });

    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('[data-testid="assistant-like-button"]').trigger('click');
    await flushAsyncUpdates();

    expect(wrapper.get('[data-testid="assistant-like-button"]').attributes('disabled')).toBe('');
    expect(wrapper.find('[data-testid="assistant-like-spinner"]').exists()).toBe(true);

    resolveFeedback(
      createJsonResponse(
        {
          isSuccess: true,
          code: 201,
          message: '피드백 등록 성공',
          data: {
            feedbackId: 'fb-mock-001',
            messageId: 'msg-mock-assistant-001',
            rating: 'LIKE',
            createdAt: '2026-05-21T19:10:00+09:00',
          },
        },
        201,
      ),
    );
    await flushAsyncUpdates();

    expect(wrapper.get('[data-testid="assistant-like-button"]').attributes('disabled')).toBe(
      undefined,
    );
    expect(wrapper.find('[data-testid="assistant-like-spinner"]').exists()).toBe(false);
  });

  it('opens conversation search modal and blocks one-character queries before API call', async () => {
    const fetchMock = installFeature9FetchMock();
    const wrapper = mountChatPage();
    const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus');
    await flushAsyncUpdates();

    await getConversationSearchButton(wrapper).trigger('click');
    await flushAsyncUpdates();

    expect(focusSpy).toHaveBeenCalled();
    expect(wrapper.get('[data-testid="conversation-search-close"]').classes()).not.toContain(
      'border-primary',
    );
    expect(wrapper.get('[data-testid="conversation-search-close"]').classes()).not.toContain(
      'hover:border-status-error',
    );
    expect(wrapper.get('[data-testid="conversation-search-close"]').classes()).not.toContain(
      'focus-visible:border-status-error',
    );

    await wrapper.get('[data-testid="conversation-search-input"]').setValue('S');
    await wrapper.get('[data-testid="conversation-search-submit"]').trigger('submit');
    await flushAsyncUpdates();

    const { toasts } = useToast();

    expect(wrapper.get('[data-testid="conversation-search-modal"]').text()).not.toContain(
      '검색어는 2자 이상 50자 이하로 입력해주세요.',
    );
    expect(toasts.value.at(-1)).toMatchObject({
      message: '검색어는 2자 이상 50자 이하로 입력해주세요.',
      variant: 'info',
    });
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).includes('/api/conversations/search')),
    ).toBe(false);
  });

  it('closes conversation search modal from backdrop and clears query from circular clear button', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await getConversationSearchButton(wrapper).trigger('click');
    await flushAsyncUpdates();
    await wrapper.get('[data-testid="conversation-search-input"]').setValue('S3 권한');

    expect(wrapper.get('[data-testid="conversation-search-input"]').attributes('type')).toBe(
      'text',
    );
    const clearButton = wrapper.get('[data-testid="conversation-search-clear"]');

    expect(clearButton.classes()).toEqual(
      expect.arrayContaining(['rounded-full', 'bg-bg-300', 'text-overlay-dark-60']),
    );

    await clearButton.trigger('click');

    expect(
      (wrapper.get('[data-testid="conversation-search-input"]').element as HTMLInputElement).value,
    ).toBe('');

    await wrapper.get('[data-testid="conversation-search-modal"]').trigger('click');

    expect(wrapper.find('[data-testid="conversation-search-modal"]').exists()).toBe(false);
  });

  it('shows highlighted conversation search results and moves to the selected conversation', async () => {
    const fetchMock = installFeature9FetchMock();
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await getConversationSearchButton(wrapper).trigger('click');
    await wrapper.get('[data-testid="conversation-search-input"]').setValue('S3 권한');
    await wrapper.get('[data-testid="conversation-search-submit"]').trigger('submit');
    await flushAsyncUpdates();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/conversations/search?q=S3+%EA%B6%8C%ED%95%9C&page=0&size=20',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
    expect(wrapper.get('[data-testid="conversation-search-result"]').text()).toContain(
      'S3 권한 오류 해결 방법',
    );
    const searchResult = wrapper.get('[data-testid="conversation-search-result"]');

    expect(searchResult.text()).not.toContain('고정');
    expect(searchResult.text()).toContain('2026.05.06');
    expect(searchResult.text()).not.toContain('19:05');
    expect(searchResult.text()).toContain('매칭 메시지 1개');
    expect(searchResult.find('.text-overlay-dark-40').exists()).toBe(true);
    expect(searchResult.classes()).toEqual(expect.arrayContaining(['border-b', 'border-bg-300']));
    expect(searchResult.classes()).not.toContain('rounded-card');
    const titleHighlight = wrapper.get('[data-testid="conversation-search-title-highlight"]');

    expect(titleHighlight.text()).toBe('S3 권한');
    expect(titleHighlight.classes()).toContain('text-[#f6a04d]');
    const highlight = wrapper.get('[data-testid="conversation-search-highlight"]');

    expect(highlight.text()).toBe('S3 권한');
    expect(highlight.classes()).toContain('text-[#f6a04d]');
    expect(highlight.classes()).not.toContain('font-bold');
    expect(highlight.classes()).not.toContain('bg-primary/15');

    await wrapper.get('[data-testid="conversation-search-result"]').trigger('click');
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="conversation-search-modal"]').exists()).toBe(false);
    expect(router.currentRoute.value.fullPath).toBe('/chat/conv-mock-001');
  });

  it('shows empty and error states in conversation search modal', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await getConversationSearchButton(wrapper).trigger('click');
    await wrapper.get('[data-testid="conversation-search-input"]').setValue('empty');
    await wrapper.get('[data-testid="conversation-search-submit"]').trigger('submit');
    await flushAsyncUpdates();

    const emptyState = wrapper.get('[data-testid="conversation-search-empty"]');

    expect(emptyState.text()).toContain('대화 결과가 없습니다');
    expect(emptyState.classes()).toContain('text-overlay-dark-80');
    expect(
      wrapper.get('[data-testid="conversation-search-empty-image"]').attributes('src'),
    ).toContain('mascot-wrong');

    await wrapper.get('[data-testid="conversation-search-input"]').setValue('fail');
    await wrapper.get('[data-testid="conversation-search-submit"]').trigger('submit');
    await flushAsyncUpdates();

    const errorState = wrapper.get('[data-testid="conversation-search-error"]');

    expect(errorState.text()).toContain('대화 검색에 실패했습니다');
    expect(errorState.text()).toContain('잠시 후 다시 한번 시도하세요.');
    expect(errorState.text()).not.toContain('/api/conversations/search');
    expect(
      wrapper.get('[data-testid="conversation-search-error-image"]').attributes('src'),
    ).toContain('mascot-wrong');
    expect(errorState.classes()).toContain('text-overlay-dark-80');
    expect(errorState.classes()).not.toContain('text-status-error');
    expect(errorState.classes()).not.toContain('border-status-error/40');
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

  it('removes inline citation markers from assistant content only at render time', () => {
    const message = {
      messageId: 'msg-assistant-citations',
      role: 'assistant' as const,
      content: 'S3 권한은 IAM 정책을 확인합니다 [#1][#2][#3]\\n다음 단계는 버킷 정책입니다 [#12].',
      createdAt: '2026-05-21T00:00:00Z',
      sources: [],
    };
    const wrapper = mount(MessageBubble, {
      props: {
        message,
        editingMessageId: '',
        editingContent: '',
        isStreaming: false,
        streamingMessageId: '',
      },
    });

    expect(wrapper.text()).toContain('S3 권한은 IAM 정책을 확인합니다');
    expect(wrapper.text()).toContain('다음 단계는 버킷 정책입니다.');
    expect(wrapper.text()).not.toContain('[#1]');
    expect(wrapper.text()).not.toContain('[#12]');
    expect(message.content).toContain('[#1][#2][#3]');
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

  it('keeps the existing conversation title fixed even if a later meta.title arrives', async () => {
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('textarea').setValue('S3 권한 오류를 다시 정리해줘');
    await wrapper.get('textarea').trigger('keydown.enter');
    await flushAsyncUpdates();

    expect(wrapper.get('[data-testid="conversation-title"]').text()).toBe('S3 권한 오류 해결 방법');
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
    expect(errorWrapper.find('[data-testid="message-action-row-assistant"]').exists()).toBe(true);
    expect(errorWrapper.find('[data-testid="assistant-like-button"]').exists()).toBe(false);
    expect(errorWrapper.find('[data-testid="assistant-dislike-button"]').exists()).toBe(false);
    expect(errorWrapper.find('[data-testid="assistant-regenerate-button"]').exists()).toBe(true);
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
    expect(wrapper.find('[data-testid="floating-help-wrapper"]').exists()).toBe(false);
  });

  it('shows a centered scroll-to-latest button above the input when the user is away from the bottom', async () => {
    const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

    setPageScrollState(900, 600, 1800);

    const wrapper = mountChatPage();
    await flushAsyncUpdates();
    window.dispatchEvent(new Event('scroll'));
    await flushAsyncUpdates();

    const wrapperButton = wrapper.get('[data-testid="scroll-to-latest-wrapper"]');

    expect(wrapperButton.classes()).toEqual(
      expect.arrayContaining(['fixed', 'bottom-[148px]', 'justify-center']),
    );
    expect(wrapper.get('[data-testid="scroll-to-latest-button"]').attributes('aria-label')).toBe(
      '최신 메시지로 이동',
    );

    await wrapper.get('[data-testid="scroll-to-latest-button"]').trigger('click');

    expect(scrollToSpy).toHaveBeenCalledWith({
      behavior: 'smooth',
      top: 1800,
    });

    setPageScrollState(1190, 600, 1800);
    window.dispatchEvent(new Event('scroll'));
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="scroll-to-latest-wrapper"]').exists()).toBe(false);
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

  it('opens a compact conversation list popover from collapsed sidebar and limits it to 10 items', async () => {
    const conversationList = Array.from({ length: 12 }, (_, index) => ({
      conversationId: `conv-popover-${String(index + 1).padStart(2, '0')}`,
      title: `최근 채팅 ${index + 1}`,
      createdAt: `2026-05-${String(index + 1).padStart(2, '0')}T10:00:00+09:00`,
      lastMessageAt: `2026-05-${String(index + 1).padStart(2, '0')}T10:05:00+09:00`,
      isPinned: false,
    }));
    installFeature9FetchMock(conversationList);
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await getCollapsedConversationListButton(wrapper).trigger('click');
    await flushAsyncUpdates();

    const popover = wrapper.get('[data-testid="collapsed-conversation-popover"]');
    const items = wrapper.findAll('[data-testid="collapsed-conversation-popover-item"]');

    expect(popover.text()).toContain('최근 채팅');
    expect(items).toHaveLength(10);
    expect(popover.text()).toContain('최근 채팅 1');
    expect(popover.text()).toContain('최근 채팅 10');
    expect(popover.text()).not.toContain('최근 채팅 11');

    expect(items[3].attributes('href')).toBe('/chat/conv-popover-04');

    await items[3].trigger('pointerdown');
    await flushAsyncUpdates();

    expect(router.currentRoute.value.fullPath).toBe('/chat/conv-popover-04');
    expect(wrapper.find('[data-testid="collapsed-conversation-popover"]').exists()).toBe(false);
  });

  it('closes the collapsed conversation popover only on outside click, not outside pointerdown', async () => {
    const conversationList = [
      {
        conversationId: 'conv-popover-text-node',
        title: '텍스트 노드 클릭 대상',
        createdAt: '2026-05-01T10:00:00+09:00',
        lastMessageAt: '2026-05-01T10:05:00+09:00',
        isPinned: false,
      },
    ];
    installFeature9FetchMock(conversationList);
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await getCollapsedConversationListButton(wrapper).trigger('click');
    await flushAsyncUpdates();

    expect(router.currentRoute.value.fullPath).toBe('/chat/conv-mock-001');
    expect(wrapper.find('[data-testid="collapsed-conversation-popover"]').exists()).toBe(true);

    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="collapsed-conversation-popover"]').exists()).toBe(true);

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="collapsed-conversation-popover"]').exists()).toBe(false);
  });

  it('routes from a collapsed conversation title pointerdown and closes from route change', async () => {
    const conversationList = [
      {
        conversationId: 'conv-popover-title-click',
        title: '제목 클릭 라우팅 대상',
        createdAt: '2026-05-01T10:00:00+09:00',
        lastMessageAt: '2026-05-01T10:05:00+09:00',
        isPinned: false,
      },
    ];
    installFeature9FetchMock(conversationList);
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await getCollapsedConversationListButton(wrapper).trigger('click');
    await flushAsyncUpdates();

    const item = wrapper.get('[data-testid="collapsed-conversation-popover-item"]');

    await item.trigger('pointerdown');
    await flushAsyncUpdates();

    expect(router.currentRoute.value.fullPath).toBe('/chat/conv-popover-title-click');
    expect(wrapper.find('[data-testid="collapsed-conversation-popover"]').exists()).toBe(false);
  });

  it('routes from a collapsed conversation title mousedown and closes from route change', async () => {
    const conversationList = [
      {
        conversationId: 'conv-popover-mousedown',
        title: 'mousedown 라우팅 대상',
        createdAt: '2026-05-01T10:00:00+09:00',
        lastMessageAt: '2026-05-01T10:05:00+09:00',
        isPinned: false,
      },
    ];
    installFeature9FetchMock(conversationList);
    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await getCollapsedConversationListButton(wrapper).trigger('click');
    await flushAsyncUpdates();

    const item = wrapper.get('[data-testid="collapsed-conversation-popover-item"]');

    expect(item.attributes('href')).toBe('/chat/conv-popover-mousedown');

    await item.trigger('mousedown');
    await flushAsyncUpdates();

    expect(router.currentRoute.value.fullPath).toBe('/chat/conv-popover-mousedown');
    expect(wrapper.find('[data-testid="collapsed-conversation-popover"]').exists()).toBe(false);
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

  it('shows a retryable error state when the initial conversation list load fails', async () => {
    await router.push('/chat');

    let shouldFailConversationList = true;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      if (requestUrl === '/api/users/me' && method === 'GET') {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 정보 조회 성공',
          data: mockCurrentUser,
        });
      }

      if (requestUrl === '/api/conversations' && method === 'GET') {
        if (shouldFailConversationList) {
          return createJsonResponse(
            {
              isSuccess: false,
              code: 500,
              errorCode: 'INTERNAL_ERROR',
              message: '대화 목록 조회 실패',
            },
            500,
          );
        }

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
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="chat-initial-load-error"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="chat-initial-load-error"]').text()).toContain(
      '대화 목록을 불러오지 못했습니다',
    );

    shouldFailConversationList = false;
    await wrapper.get('[data-testid="chat-initial-load-error"] button').trigger('click');
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="chat-initial-load-error"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="chat-empty-state"]').exists()).toBe(true);
  });

  it('shows a retryable error state when creating the first conversation fails', async () => {
    await router.push('/chat');

    let createConversationAttemptCount = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      if (requestUrl === '/api/users/me' && method === 'GET') {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 정보 조회 성공',
          data: mockCurrentUser,
        });
      }

      if (requestUrl === '/api/conversations' && method === 'GET') {
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

      if (requestUrl === '/api/conversations' && method === 'POST') {
        createConversationAttemptCount += 1;

        if (createConversationAttemptCount === 1) {
          return createJsonResponse(
            {
              isSuccess: false,
              code: 500,
              errorCode: 'INTERNAL_ERROR',
              message: '대화 생성 실패',
            },
            500,
          );
        }

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

      if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/chat')) {
        return createSseResponse();
      }

      if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/messages')) {
        const conversationId =
          requestUrl.match(/\/api\/conversations\/([^/]+)\/messages/)?.[1] ?? '';

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

      return createJsonResponse(
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

    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('#lina-message-input').setValue('첫 질문입니다');
    await wrapper.get('[data-testid="message-input"]').trigger('submit');
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="chat-empty-state"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="chat-start-submit-error"]').text()).toContain(
      '메시지를 전송하지 못했습니다',
    );
    expect(wrapper.get('[data-testid="chat-start-submit-error"]').text()).toContain(
      '대화를 시작하지 못했습니다',
    );

    await wrapper.get('[data-testid="chat-start-submit-error"] button').trigger('click');
    await flushAsyncUpdates();

    expect(createConversationAttemptCount).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/conversations/conv-mock-created/chat',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(wrapper.find('[data-testid="chat-start-submit-error"]').exists()).toBe(false);
  });

  it('shows a retryable message history error without clearing the route context', async () => {
    let shouldFailMessageHistory = true;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      if (requestUrl === '/api/users/me' && method === 'GET') {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 정보 조회 성공',
          data: mockCurrentUser,
        });
      }

      if (requestUrl === '/api/conversations' && method === 'GET') {
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

      if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/messages')) {
        if (shouldFailMessageHistory) {
          return createJsonResponse(
            {
              isSuccess: false,
              code: 500,
              errorCode: 'INTERNAL_ERROR',
              message: '메시지 이력 조회 실패',
            },
            500,
          );
        }

        const conversationId =
          requestUrl.match(/\/api\/conversations\/([^/]+)\/messages/)?.[1] ?? '';

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

      return createJsonResponse(
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

    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="chat-message-history-error"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="chat-message-history-error"]').text()).toContain(
      '메시지 이력을 불러오지 못했습니다',
    );
    expect(wrapper.get('[data-testid="conversation-title"]').text()).toBe(
      mockConversations.find((conversation) => conversation.conversationId === 'conv-mock-001')
        ?.title,
    );

    shouldFailMessageHistory = false;
    await wrapper.get('[data-testid="chat-message-history-error"] button').trigger('click');
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="chat-message-history-error"]').exists()).toBe(false);
    expect(wrapper.findAll('[data-testid="message-bubble"]')).toHaveLength(2);
  });

  it('retries the previous user question from an assistant error bubble', async () => {
    let chatAttempt = 0;
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
        const conversationId =
          requestUrl.match(/\/api\/conversations\/([^/]+)\/messages/)?.[1] ?? '';

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
        chatAttempt += 1;

        if (chatAttempt === 1) {
          return new Response(
            'event: error\ndata: {"errorCode":"ML_CONNECTION_ERROR","message":"답변 생성 중 오류가 발생했습니다"}\n\n',
            {
              headers: {
                'Content-Type': 'text/event-stream',
              },
              status: 200,
            },
          );
        }

        return new Response(
          [
            'event: token\n',
            'data: {"content":"재시도 성공 답변"}\n\n',
            'event: done\n',
            'data: {"messageId":"msg-regenerated-assistant"}\n\n',
          ].join(''),
          {
            headers: {
              'Content-Type': 'text/event-stream',
            },
            status: 200,
          },
        );
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
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mountChatPage();
    await flushAsyncUpdates();

    await wrapper.get('textarea').setValue('재시도 질문');
    await wrapper.get('textarea').trigger('keydown.enter');
    await flushAsyncUpdates();

    expect(wrapper.text()).toContain('답변 생성 중 오류가 발생했습니다');
    expect(wrapper.findAll('[data-testid="assistant-regenerate-button"]').length).toBeGreaterThan(
      0,
    );

    await wrapper.findAll('[data-testid="assistant-regenerate-button"]').at(-1)!.trigger('click');
    await flushAsyncUpdates();

    expect(chatAttempt).toBe(2);
    expect(wrapper.text()).toContain('재시도 성공 답변');
  });
});
