/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat feature10.5 ChatPage 책임 분리 리팩토링 회귀 테스트.
 *           page shell, sidebar/header 컴포넌트, submit/route sync composable 분리를 검증한다.
 * 작성일 : 2026-06-04
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-06-04, feature10.5 구현, ChatPage 책임 분리 acceptance criteria 테스트 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vitest 2.1.x, Vue Test Utils 2.4.x 기준
 * --------------------------------------------------
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ChatHeader from '@/features/chat/ChatHeader.vue';
import ChatSidebar from '@/features/chat/ChatSidebar.vue';
import { mockConversations, mockCurrentUser } from '@/mocks/data';
import ChatPage from '@/pages/ChatPage.vue';
import router from '@/router';
import { useChatSubmission } from '@/composables/useChatSubmission';
import { useChatRouteSync } from '@/composables/useChatRouteSync';

const chatPagePath = resolve(process.cwd(), 'src/pages/ChatPage.vue');

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

function createSseResponse(): Response {
  return new Response(
    [
      'event: token\n',
      'data: {"content":"책임 분리 후에도 "}\n\n',
      'event: token\n',
      'data: {"content":"SSE 누적은 유지됩니다."}\n\n',
      'event: done\n',
      'data: {"messageId":"msg-refactor-assistant"}\n\n',
    ].join(''),
    {
      headers: {
        'Content-Type': 'text/event-stream',
      },
      status: 200,
    },
  );
}

function installFeature105FetchMock() {
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

    if (requestUrl === '/api/conversations' && method === 'POST') {
      return createJsonResponse(
        {
          isSuccess: true,
          code: 201,
          message: '새 대화 생성 성공',
          data: {
            conversationId: 'conv-refactor-created',
            title: '새 대화',
            createdAt: '2026-06-04T09:00:00+09:00',
          },
        },
        201,
      );
    }

    if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/messages')) {
      const conversationId = requestUrl.match(/\/api\/conversations\/([^/]+)\/messages/)?.[1] ?? '';

      return createJsonResponse({
        isSuccess: true,
        code: 200,
        message: '메시지 이력 조회 성공',
        data: {
          conversationId,
          messages: [],
        },
      });
    }

    if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/chat')) {
      return createSseResponse();
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
  });

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

async function flushAsyncUpdates() {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

describe('feature10.5 ChatPage responsibility split', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    installFeature105FetchMock();
    await router.push('/chat');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps ChatPage as a shell that composes ChatSidebar and ChatHeader', async () => {
    const wrapper = mount(ChatPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });
    await flushAsyncUpdates();

    expect(wrapper.findComponent(ChatSidebar).exists()).toBe(true);
    expect(wrapper.findComponent(ChatHeader).exists()).toBe(true);
    expect(wrapper.get('[data-testid="chat-sidebar"]').attributes('data-state')).toBe('collapsed');
    expect(wrapper.get('header').text()).toContain('LINA');
  });

  it('moves submission and route synchronization responsibilities to composables', () => {
    expect(typeof useChatSubmission).toBe('function');
    expect(typeof useChatRouteSync).toBe('function');

    const source = readFileSync(chatPagePath, 'utf8');

    expect(source).toContain('useChatSubmission');
    expect(source).toContain('useChatRouteSync');
    expect(source).not.toContain('createConversation');
    expect(source).not.toContain('loadConversationMessages(conversationId');
  });

  it('preserves new conversation fallback and SSE submit through the extracted submission composable', async () => {
    const fetchMock = installFeature105FetchMock();
    const wrapper = mount(ChatPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });
    await flushAsyncUpdates();

    await wrapper.get('textarea').setValue('책임 분리 후에도 전송되나요?');
    await wrapper.get('form').trigger('submit');
    await flushAsyncUpdates();
    await flushAsyncUpdates();

    expect(router.currentRoute.value.fullPath).toBe('/chat/conv-refactor-created');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/conversations',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/conversations/conv-refactor-created/chat',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          question: '책임 분리 후에도 전송되나요?',
        }),
      }),
    );
    expect(wrapper.text()).toContain('책임 분리 후에도 SSE 누적은 유지됩니다.');
  });
});
