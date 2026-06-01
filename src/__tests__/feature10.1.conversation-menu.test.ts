/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat feature10.1 대화 케밥 메뉴 통합 테스트.
 *           최근 채팅/헤더 메뉴 표시, 접근성 닫힘 동작, 기존 API 액션 연결을 검증한다.
 * 작성일 : 2026-06-01
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-06-01, feature10.1 구현, 대화 케밥 메뉴 acceptance criteria 테스트 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vitest 2.1.x, Vue Test Utils 2.4.x 기준
 * --------------------------------------------------
 */
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockConversations, mockCurrentUser, mockMessagesByConversationId } from '@/mocks/data';
import ChatPage from '@/pages/ChatPage.vue';
import router from '@/router';

type CapturedRequest = {
  body: unknown;
  method: string;
  url: string;
};

const capturedRequests: CapturedRequest[] = [];

function createJsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    status,
  });
}

function parseRequestBody(init?: RequestInit): unknown {
  return init?.body ? JSON.parse(String(init.body)) : undefined;
}

function installFeature101FetchMock() {
  capturedRequests.length = 0;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const method = init?.method ?? 'GET';

      capturedRequests.push({
        body: parseRequestBody(init),
        method,
        url: requestUrl,
      });

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

      if (requestUrl.includes('/api/conversations/') && method === 'PATCH') {
        const conversationId = requestUrl.match(/\/api\/conversations\/([^/]+)/)?.[1] ?? '';
        const currentConversation = mockConversations.find(
          (conversation) => conversation.conversationId === conversationId,
        );
        const body = parseRequestBody(init) as { isPinned?: boolean; title?: string };

        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '대화 수정 성공',
          data: {
            conversationId,
            title: body.title ?? currentConversation?.title ?? '',
            isPinned: body.isPinned ?? currentConversation?.isPinned ?? false,
            updatedAt: '2026-06-01T10:00:00+09:00',
          },
        });
      }

      if (requestUrl.includes('/api/conversations/') && method === 'DELETE') {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '대화 삭제 성공',
          data: null,
        });
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
    }),
  );
}

async function flushAsyncUpdates() {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function mountExpandedChatPage() {
  const wrapper = mount(ChatPage, {
    attachTo: document.body,
    global: {
      plugins: [createPinia(), router],
    },
  });

  await flushAsyncUpdates();
  await wrapper.get('[data-testid="sidebar-mascot-toggle"]').trigger('click');
  await vi.advanceTimersByTimeAsync(200);

  return wrapper;
}

async function openRecentConversationMenu(wrapper: ReturnType<typeof mount>) {
  const recentItem = wrapper.get('[data-testid="recent-conversation-list-item"]');

  await recentItem.trigger('mouseenter');
  await recentItem.get('[data-testid="conversation-menu-trigger"]').trigger('click');

  return recentItem;
}

describe('feature10.1 conversation kebab menu', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setActivePinia(createPinia());
    installFeature101FetchMock();
    vi.spyOn(window, 'prompt').mockReturnValue('문서 동기화 장애 대응');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await router.push('/chat/conv-mock-001');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('shows the recent conversation kebab trigger on hover and keeps it while the menu is open', async () => {
    const wrapper = await mountExpandedChatPage();
    const recentItem = wrapper.get('[data-testid="recent-conversation-list-item"]');

    expect(recentItem.text()).toContain('Confluence 문서 동기화 상태 확인');
    expect(recentItem.find('[data-testid="conversation-menu-trigger"]').exists()).toBe(false);

    await recentItem.trigger('mouseenter');

    const trigger = recentItem.get('[data-testid="conversation-menu-trigger"]');

    expect(trigger.attributes('aria-label')).toBe('대화 메뉴 열기');
    expect(trigger.attributes('aria-haspopup')).toBe('menu');

    await trigger.trigger('click');

    expect(wrapper.get('[data-testid="conversation-action-menu"]').text()).toContain('고정');

    await recentItem.trigger('mouseleave');

    expect(recentItem.find('[data-testid="conversation-menu-trigger"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="conversation-action-menu"]').exists()).toBe(true);
  });

  it('shares the same action menu contract between the recent list and chat header', async () => {
    const wrapper = await mountExpandedChatPage();

    await openRecentConversationMenu(wrapper);

    const recentMenu = wrapper.get('[data-testid="conversation-action-menu"]');

    expect(recentMenu.findAll('[role="menuitem"]')).toHaveLength(3);
    expect(recentMenu.text()).toContain('고정');
    expect(recentMenu.text()).toContain('이름 변경');
    expect(recentMenu.text()).toContain('삭제');
    expect(
      wrapper.findAllComponents({ name: 'ConversationActionMenu' }).length,
    ).toBeGreaterThanOrEqual(2);

    await wrapper.get('[data-testid="conversation-menu-trigger"]').trigger('click');
    await wrapper.get('[data-testid="conversation-menu-button"]').trigger('click');

    const headerMenu = wrapper.get('[data-testid="conversation-action-menu"]');

    expect(headerMenu.findAll('[role="menuitem"]')).toHaveLength(3);
    expect(headerMenu.text()).toContain('고정 해제');
    expect(headerMenu.text()).toContain('이름 변경');
    expect(headerMenu.text()).toContain('삭제');
    expect(
      wrapper.findAllComponents({ name: 'ConversationActionMenu' }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('closes the open menu with Escape or outside click and focuses the first menu item on open', async () => {
    const wrapper = await mountExpandedChatPage();

    await openRecentConversationMenu(wrapper);

    const menuItems = wrapper
      .get('[data-testid="conversation-action-menu"]')
      .findAll('[role="menuitem"]');

    expect(document.activeElement).toBe(menuItems[0].element);

    await wrapper.get('[data-testid="conversation-action-menu"]').trigger('keydown', {
      key: 'Escape',
    });

    expect(wrapper.find('[data-testid="conversation-action-menu"]').exists()).toBe(false);

    await openRecentConversationMenu(wrapper);
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="conversation-action-menu"]').exists()).toBe(false);
  });

  it('connects pin, rename, and delete actions through the existing conversation API functions', async () => {
    const wrapper = await mountExpandedChatPage();

    await openRecentConversationMenu(wrapper);
    await wrapper.get('[data-testid="conversation-menu-pin"]').trigger('click');
    await flushAsyncUpdates();

    expect(
      capturedRequests.some(
        (request) =>
          request.url.endsWith('/api/conversations/conv-mock-002') &&
          request.method === 'PATCH' &&
          JSON.stringify(request.body) === JSON.stringify({ isPinned: true }),
      ),
    ).toBe(true);
    expect(wrapper.get('[data-testid="pinned-chat-list"]').text()).toContain(
      'Confluence 문서 동기화 상태 확인',
    );

    await wrapper.get('[data-testid="conversation-menu-button"]').trigger('click');
    await wrapper.get('[data-testid="conversation-menu-rename"]').trigger('click');
    await flushAsyncUpdates();

    expect(window.prompt).toHaveBeenCalledWith('대화 이름을 입력하세요.', 'S3 권한 오류 해결 방법');
    expect(
      capturedRequests.some(
        (request) =>
          request.url.endsWith('/api/conversations/conv-mock-001') &&
          request.method === 'PATCH' &&
          JSON.stringify(request.body) === JSON.stringify({ title: '문서 동기화 장애 대응' }),
      ),
    ).toBe(true);
    expect(wrapper.get('[data-testid="conversation-title"]').text()).toBe('문서 동기화 장애 대응');

    await wrapper.get('[data-testid="conversation-menu-button"]').trigger('click');
    await wrapper.get('[data-testid="conversation-menu-delete"]').trigger('click');
    await flushAsyncUpdates();

    expect(window.confirm).toHaveBeenCalledWith('이 대화를 삭제할까요?');
    expect(
      capturedRequests.some(
        (request) =>
          request.url.endsWith('/api/conversations/conv-mock-001') && request.method === 'DELETE',
      ),
    ).toBe(true);
    expect(router.currentRoute.value.fullPath).toBe('/chat');
  });
});
