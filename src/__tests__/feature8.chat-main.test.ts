import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ChatEmptyState from '@/features/chat/ChatEmptyState.vue';
import MessageInput from '@/features/chat/MessageInput.vue';
import PreviewPageCard from '@/features/chat/PreviewPageCard.vue';
import {
  mockConversations,
  mockCurrentUser,
  mockHomeConfluencePages,
  mockMessagesByConversationId,
} from '@/mocks/data';
import ChatPage from '@/pages/ChatPage.vue';
import router from '@/router';
import { BaseFloatingIconButton, BaseTooltip } from '@/shared';

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

describe('feature8 SCR-400 Chat main screen', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    await router.push('/chat');
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const requestUrl =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

        if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/messages')) {
          const conversationId =
            requestUrl.match(/\/api\/conversations\/([^/]+)\/messages/)?.[1] ?? '';

          return new Response(
            JSON.stringify({
              isSuccess: true,
              code: 200,
              message: '메시지 이력 조회 성공',
              data: {
                conversationId,
                messages: mockMessagesByConversationId[conversationId] ?? [],
              },
            }),
            {
              headers: {
                'Content-Type': 'application/json',
              },
              status: 200,
            },
          );
        }

        if (requestUrl.includes('/api/conversations')) {
          return new Response(
            JSON.stringify({
              isSuccess: true,
              code: 200,
              message: '대화 목록 조회 성공',
              data: {
                conversations: mockConversations,
                totalCount: mockConversations.length,
                page: 0,
                size: 20,
              },
            }),
            {
              headers: {
                'Content-Type': 'application/json',
              },
              status: 200,
            },
          );
        }

        return new Response(
          JSON.stringify({
            isSuccess: true,
            code: 200,
            message: '사용자 정보 조회 성공',
            data: mockCurrentUser,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
            },
            status: 200,
          },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the SCR-400 Chat shell with collapsed sidebar, settings entry, and profile affordances', async () => {
    const wrapper = mountChatPage();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(wrapper.get('[data-testid="chat-page"]').classes()).toContain('bg-bg-100');
    expect(wrapper.get('[data-testid="chat-sidebar"]').attributes('data-state')).toBe('collapsed');
    expect(wrapper.get('[data-testid="chat-sidebar"]').classes()).toContain('w-[76px]');
    expect(wrapper.get('[data-testid="sidebar-mascot-toggle"]').attributes('aria-label')).toBe(
      '사이드바 열기',
    );
    expect(wrapper.get('[data-testid="sidebar-hover-toggle-icon"]').classes()).toContain('size-4');
    expect(wrapper.get('[data-testid="chat-sidebar-nav"]').classes()).toContain('gap-3');
    expect(wrapper.get('[data-testid="sidebar-footer"]').classes()).toContain('mt-auto');
    expect(wrapper.get('[data-testid="settings-entry"]').text()).toContain('설정 및 도움말');
    expect(wrapper.get('[data-testid="settings-entry"]').classes()).toEqual(
      expect.arrayContaining(['m-4', 'size-8']),
    );
    expect(wrapper.get('[data-testid="settings-entry-icon"]').classes()).toContain('size-4');
    for (const sidebarAction of wrapper.findAll('[data-testid="collapsed-sidebar-action"]')) {
      expect(sidebarAction.classes()).toEqual(
        expect.arrayContaining(['size-8', 'border-transparent', 'bg-transparent']),
      );
      expect(sidebarAction.find('svg').classes()).toContain('size-4');
    }
    expect(wrapper.get('[data-testid="floating-help-wrapper"]').classes()).toEqual(
      expect.arrayContaining(['absolute', 'bottom-6', 'right-6']),
    );
    expect(wrapper.get('[data-testid="floating-help-button"]').attributes('aria-label')).toBe(
      '도움말 열기',
    );
    expect(wrapper.find('[data-testid="conversation-title"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="conversation-menu-button"]').exists()).toBe(false);
    expect(wrapper.get('header').text()).toContain('LINA');
    expect(wrapper.get('header').classes()).toContain('border-transparent');
    expect(wrapper.get('[data-testid="profile-entry"]').attributes('aria-label')).toBe('계정 관리');
    expect(wrapper.get('[data-testid="profile-entry-image"]').attributes('src')).toBe(
      mockCurrentUser.profileImageUrl,
    );
    expect(wrapper.find('[data-testid="profile-entry-icon"]').exists()).toBe(false);
    expect(wrapper.findAll('[data-testid="preview-page-card"]')).toHaveLength(2);
    expect(wrapper.text()).toContain('환영합니다. 이다연님');
  });

  it('falls back to the profile icon when the profile image fails to load', async () => {
    const wrapper = mountChatPage();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    await wrapper.get('[data-testid="profile-entry-image"]').trigger('error');

    expect(wrapper.find('[data-testid="profile-entry-image"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="profile-entry-icon"]').exists()).toBe(true);
  });

  it('falls back to the profile icon when current user loading fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            isSuccess: false,
            code: 401,
            message: '인증이 필요합니다',
            data: null,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
            },
            status: 401,
          },
        );
      }),
    );

    const wrapper = mountChatPage();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(wrapper.find('[data-testid="profile-entry-icon"]').exists()).toBe(true);
  });

  it('opens and closes the Sidebar inline without changing the reference panel placeholder', async () => {
    const wrapper = mountChatPage();
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    await wrapper.get('[data-testid="sidebar-mascot-toggle"]').trigger('mouseenter');

    expect(wrapper.get('[data-testid="sidebar-mascot-icon"]').classes()).toContain('opacity-0');
    expect(wrapper.get('[data-testid="sidebar-hover-toggle-icon"]').classes()).toContain(
      'opacity-100',
    );

    await wrapper.get('[data-testid="sidebar-mascot-toggle"]').trigger('click');
    await new Promise((resolve) => window.setTimeout(resolve, 200));

    expect(wrapper.get('[data-testid="chat-sidebar"]').attributes('data-state')).toBe('expanded');
    expect(wrapper.get('[data-testid="chat-sidebar"]').classes()).toContain('w-[264px]');
    expect(wrapper.get('[data-testid="chat-sidebar"]').classes()).toContain('bg-bg-100');
    expect(wrapper.get('[data-testid="sidebar-close-toggle"]').attributes('aria-label')).toBe(
      '사이드바 닫기',
    );
    expect(wrapper.get('[data-testid="sidebar-expanded-header"]').classes()).toEqual(
      expect.arrayContaining(['justify-between', 'px-5']),
    );
    expect(wrapper.get('[data-testid="chat-search-inline"]').attributes('placeholder')).toBe(
      '채팅 검색',
    );
    expect(wrapper.get('[data-testid="chat-search-inline-wrapper"]').classes()).toContain(
      'relative',
    );
    expect(wrapper.get('[data-testid="chat-search-inline-icon"]').classes()).toContain('size-4');
    expect(wrapper.get('[data-testid="expanded-new-chat-button"]').text()).toContain('새 채팅');
    expect(wrapper.text()).toContain('고정 채팅');
    expect(wrapper.text()).toContain('최근 채팅');
    expect(wrapper.text()).toContain(mockConversations[0].title);
    expect(wrapper.text()).toContain(mockConversations[1].title);
    expect(wrapper.get('[data-testid="settings-entry-label"]').classes()).toEqual(
      expect.arrayContaining(['font-lina', 'text-small', 'text-overlay-dark-80']),
    );
    expect(wrapper.get('[data-testid="reference-panel"]').attributes('aria-hidden')).toBe('true');

    await wrapper.get('[data-testid="sidebar-close-toggle"]').trigger('click');

    expect(wrapper.get('[data-testid="chat-sidebar"]').attributes('data-state')).toBe('collapsed');
  });

  it('adds tooltip semantics to all icon-only controls on SCR-400', () => {
    const wrapper = mountChatPage();

    const tooltips = wrapper.findAll('[data-testid="base-tooltip"]');
    const tooltipLabels = tooltips.map((tooltip) => tooltip.attributes('aria-label'));

    expect(tooltipLabels).toEqual(
      expect.arrayContaining([
        '사이드바 열기',
        '새 채팅',
        '채팅 검색',
        '채팅 목록',
        '설정 및 도움말',
        '계정 관리',
        '도움말 열기',
        '메시지 보내기',
      ]),
    );
  });

  it('renders BaseFloatingIconButton as a reusable circular icon button', () => {
    const wrapper = mount(BaseFloatingIconButton, {
      props: {
        ariaLabel: '하단으로 이동',
      },
      slots: {
        default: '<span aria-hidden="true">↓</span>',
      },
    });

    expect(wrapper.get('button').attributes('aria-label')).toBe('하단으로 이동');
    expect(wrapper.get('button').classes()).toEqual(
      expect.arrayContaining(['size-12', 'rounded-full', 'shadow-floating']),
    );
  });

  it('portals BaseTooltip content with unclipped right-side placement defaults', async () => {
    const wrapper = mount(BaseTooltip, {
      attachTo: document.body,
      props: {
        label: '채팅 검색',
      },
      slots: {
        default: '<button type="button">S</button>',
      },
    });

    expect(wrapper.get('[data-testid="base-tooltip"]').attributes('aria-label')).toBe('채팅 검색');
    expect(wrapper.get('button').text()).toBe('S');

    await wrapper.get('[data-testid="base-tooltip"]').trigger('mouseenter');

    const tooltip = document.body.querySelector('[role="tooltip"]');

    expect(tooltip?.textContent).toBe('채팅 검색');
    expect(tooltip?.parentElement).toBe(document.body);
    expect(tooltip?.getAttribute('data-side')).toBe('right');
    expect(tooltip?.getAttribute('data-align')).toBe('center');
    expect(tooltip?.getAttribute('data-side-offset')).toBe('12');
    expect(tooltip?.classList.contains('fixed')).toBe(true);
    expect(tooltip?.classList.contains('z-[9999]')).toBe(true);

    wrapper.unmount();
  });

  it('shows collapsed sidebar tooltips in a body-level right-side portal', async () => {
    const wrapper = mountChatPage();
    const sidebarTooltip = wrapper
      .findAll('[data-testid="base-tooltip"]')
      .find((tooltip) => tooltip.attributes('aria-label') === '사이드바 열기');

    await sidebarTooltip?.trigger('mouseenter');

    const tooltip = [...document.body.querySelectorAll('[role="tooltip"]')].find(
      (content) => content.textContent === '사이드바 열기',
    );

    expect(tooltip?.parentElement).toBe(document.body);
    expect(tooltip?.getAttribute('data-side')).toBe('right');
    expect(tooltip?.getAttribute('data-align')).toBe('center');
    expect(tooltip?.getAttribute('data-side-offset')).toBe('12');
    expect(tooltip?.classList.contains('z-[9999]')).toBe(true);

    wrapper.unmount();
  });

  it('keeps explicitly left-placed portal tooltips outside the trigger edge', async () => {
    const wrapper = mount(BaseTooltip, {
      props: {
        label: '계정 관리',
        placement: 'left',
      },
      slots: {
        default: '<button type="button">P</button>',
      },
    });

    await wrapper.get('[data-testid="base-tooltip"]').trigger('mouseenter');

    const tooltip = [...document.body.querySelectorAll('[role="tooltip"]')].find(
      (content) => content.textContent === '계정 관리',
    );

    expect(tooltip?.getAttribute('data-side')).toBe('left');
    expect(tooltip?.classList.contains('-translate-x-full')).toBe(true);

    wrapper.unmount();
  });

  it('renders ASK LINA, SKP symbol, welcome copy, mascot, and two preview page cards', () => {
    const wrapper = mount(ChatEmptyState, {
      props: {
        userName: '유진',
      },
    });

    expect(wrapper.get('[data-testid="ask-lina-logo"]').text()).toContain('ASK');
    expect(wrapper.get('[data-testid="ask-lina-logo"]').text()).toContain('LINA');
    expect(wrapper.get('[data-testid="chat-empty-state"]').classes()).toContain('max-w-none');
    expect(wrapper.get('[data-testid="ask-lina-logo"]').classes()).toEqual(
      expect.arrayContaining(['absolute', 'left-1/2', '-translate-x-1/2']),
    );
    expect(wrapper.get('[data-testid="skp-symbol"]').attributes('src')).toContain(
      'skp_symbol-nobg',
    );
    expect(wrapper.get('[data-testid="skp-symbol-crop"]').classes()).toContain('overflow-hidden');
    expect(wrapper.text()).toContain('환영합니다. 유진님');
    expect(wrapper.get('[data-testid="chat-empty-mascot"]').attributes('src')).toContain(
      'mascot-realize-nobg',
    );
    expect(wrapper.get('[data-testid="chat-empty-mascot"]').classes()).toEqual(
      expect.arrayContaining(['left-[4%]', 'h-36', 'w-36']),
    );
    expect(wrapper.get('[data-testid="preview-page-stack"]').classes()).toContain('-translate-x-8');
    expect(wrapper.get('[data-testid="chat-empty-search-image"]').classes()).toContain(
      'opacity-80',
    );
    expect(wrapper.get('[data-testid="chat-empty-search-image"]').classes()).toEqual(
      expect.arrayContaining(['right-[-15%]', 'top-[-120px]']),
    );

    const cards = wrapper.findAll('[data-testid="preview-page-card"]');

    expect(cards).toHaveLength(2);
    expect(cards[0].html()).toContain('data-testid="preview-page-card-body"');
    expect(cards[0].text()).not.toContain('2026.05.19 게시됨');
    expect(cards[0].text()).not.toContain(mockHomeConfluencePages[0].authorName);
    expect(cards[1].text()).toContain(mockHomeConfluencePages[1].title);
  });

  it('renders PreviewPageCard with reusable 166:191 preview proportions and sanitized body HTML', () => {
    const wrapper = mount(PreviewPageCard, {
      props: {
        page: {
          pageId: 'home-preview-999',
          title: '자주 묻는 질문 (FAQ) - 인프라 운영',
          spaceName: 'Cloud Control Center',
          authorName: '이현서',
          updatedAt: '2026-05-19T18:30:00+09:00',
          breadcrumbs: ['Cloud Control Center', 'AWS', 'FAQ'],
          pageUrl: 'https://confluence.example.com/pages/home-preview-999',
          bodyViewValue: [
            '<article>',
            '<h1>자주 묻는 질문 (FAQ) - 인프라 운영</h1>',
            '<p>Q. AWS 콘솔 접속은 어떻게 하나요?</p>',
            '<img src="x" onerror="alert(1)" />',
            '<script>alert("xss")</script>',
            '</article>',
          ].join(''),
        },
      },
    });

    expect(wrapper.get('[data-testid="preview-page-card"]').classes()).toContain(
      'aspect-[166/191]',
    );
    expect(wrapper.get('[data-testid="preview-page-card"]').classes()).toEqual(
      expect.arrayContaining(['w-[208px]', 'sm:w-[272px]', 'shadow-floating']),
    );
    expect(wrapper.classes()).toContain('group/preview-page');
    expect(wrapper.find('[data-testid="preview-page-card-surface"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="preview-page-card-actions"]').classes()).toContain(
      'group-hover/preview-page:opacity-100',
    );
    expect(wrapper.text()).not.toContain('2026.05.19 게시됨');
    expect(wrapper.text()).not.toContain('이현서');
    expect(wrapper.get('[data-testid="preview-page-card-body"]').classes()).not.toContain('mt-5');
    expect(wrapper.text()).toContain('Q. AWS 콘솔 접속은 어떻게 하나요?');
    expect(wrapper.html()).not.toContain('onerror=');
    expect(wrapper.html()).not.toContain('<script>');
  });

  it('keeps MessageInput disabled until text is entered and supports Enter submission', async () => {
    const onSubmit = vi.fn();
    const wrapper = mount(MessageInput, {
      props: {
        disabled: false,
        onSubmit,
      },
    });

    const textarea = wrapper.get('textarea');
    const button = wrapper.get('[data-testid="message-send-button"]');

    expect(textarea.attributes('placeholder')).toBe('무엇이든 물어보세요...');
    expect(button.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('By messaging LINA, you agree to out Terms');

    await textarea.setValue('운영 가이드를 찾아줘');

    expect(
      wrapper.get('[data-testid="message-send-button"]').attributes('disabled'),
    ).toBeUndefined();

    await textarea.trigger('keydown.enter');

    expect(onSubmit).toHaveBeenCalledWith('운영 가이드를 찾아줘');
    expect((textarea.element as HTMLTextAreaElement).value).toBe('');
    expect(wrapper.get('[data-testid="message-send-button"]').attributes('disabled')).toBeDefined();
  });

  it('keeps Shift+Enter as multiline input and supports streaming stop action state', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const wrapper = mount(MessageInput, {
      props: {
        isStreaming: true,
        onSubmit,
        onCancel,
      },
    });

    const textarea = wrapper.get('textarea');
    const actionButton = wrapper.get('[data-testid="message-send-button"]');

    expect(textarea.attributes('disabled')).toBeDefined();
    expect(actionButton.attributes('aria-label')).toBe('응답 중단');
    expect(actionButton.attributes('disabled')).toBeUndefined();
    expect(actionButton.classes()).toEqual(
      expect.arrayContaining(['bg-bg-400', 'text-overlay-dark-40']),
    );
    expect(wrapper.find('[data-testid="message-cancel-button"]').exists()).toBe(false);
    expect(actionButton.find('rect[width="6"][height="6"]').exists()).toBe(true);

    await actionButton.trigger('click');
    await textarea.trigger('keydown.enter.shift');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('places MessageInput closer to the viewport bottom on SCR-400', () => {
    const wrapper = mount(MessageInput);

    expect(wrapper.get('[data-testid="message-input"]').classes()).toContain('pb-3');
  });
});
