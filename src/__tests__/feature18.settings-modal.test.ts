import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import SettingsModal from '@/features/settings/SettingsModal.vue';
import { mockConversations, mockCurrentUser } from '@/mocks/data';
import ChatPage from '@/pages/ChatPage.vue';
import router from '@/router';

function mountSettingsModal() {
  return mount(SettingsModal, {
    props: {
      currentUserLastLoginAt: mockCurrentUser.lastLoginAt,
      currentUserId: mockCurrentUser.userId,
      currentUserName: mockCurrentUser.name,
      isOpen: true,
    },
    attachTo: document.body,
  });
}

function getByTestId(testId: string): HTMLElement {
  const element = document.body.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

  if (!element) {
    throw new Error(`Unable to find [data-testid="${testId}"]`);
  }

  return element;
}

function mockChatPageFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

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
}

describe('feature18 Settings modal', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    document.body.innerHTML = '';
    document.body.style.overflow = '';
    await router.push('/chat');
    mockChatPageFetch();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
    document.body.style.overflow = '';
  });

  it('renders only the account management Settings section', () => {
    mountSettingsModal();

    expect(getByTestId('settings-modal-backdrop').classList).toContain('fixed');
    expect(getByTestId('settings-dialog').getAttribute('role')).toBe('dialog');
    expect(getByTestId('settings-dialog').getAttribute('aria-modal')).toBe('true');
    expect(getByTestId('settings-title').textContent?.trim()).toBe('설정');
    expect(document.body.querySelector('[data-testid="settings-tab-general"]')).toBeNull();
    expect(getByTestId('settings-account-panel').textContent).toContain('연결된 계정');
    expect(getByTestId('settings-account-nav-item').textContent).toContain('계정 관리');
    expect(document.body.querySelector('[data-testid="settings-tab-data"]')).toBeNull();
    expect(getByTestId('settings-account-panel').textContent).toContain(mockCurrentUser.userId);
    expect(getByTestId('settings-confluence-icon').getAttribute('src')).toContain(
      'confluence-icon.png',
    );
    expect(getByTestId('settings-slack-card').textContent).toContain('슬랙 연동하기');
    expect(getByTestId('settings-slack-icon').getAttribute('src')).toContain('slack-icon.png');
    expect(getByTestId('settings-notion-card').textContent).toContain('노션 연동하기');
    expect(getByTestId('settings-notion-icon').getAttribute('src')).toContain('notion-icon.png');
    expect(getByTestId('settings-upcoming-overlay').textContent).toContain('To be continued');
    expect(getByTestId('settings-account-panel').textContent).toContain(
      '인증 갱신 날짜 : 2026.08.18',
    );
    expect(getByTestId('settings-account-renewal-note').textContent).toContain(
      '90일마다 인증 갱신되어야 합니다.',
    );
    expect(getByTestId('settings-logout-row').textContent).toContain('이 기기에서 로그아웃 하기');
  });

  it('closes by close button, backdrop, and ESC key', async () => {
    const wrapper = mountSettingsModal();

    getByTestId('settings-close-button').click();
    await nextTick();
    expect(wrapper.emitted('close')).toHaveLength(1);

    getByTestId('settings-modal-backdrop').click();
    await nextTick();
    expect(wrapper.emitted('close')).toHaveLength(2);

    getByTestId('settings-dialog').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await nextTick();
    expect(wrapper.emitted('close')).toHaveLength(3);
  });

  it('locks document scroll and keeps focus inside the modal while open', async () => {
    const wrapper = mountSettingsModal();
    await nextTick();

    expect(document.body.style.overflow).toBe('hidden');
    expect(document.activeElement).toBe(getByTestId('settings-close-button'));

    getByTestId('settings-dialog').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );
    await nextTick();
    expect(document.activeElement).toBe(getByTestId('settings-logout-button'));

    wrapper.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('renders the help nav item below account management and keeps the help modal closed', () => {
    mountSettingsModal();

    const navigation = document.body.querySelector('[aria-label="Settings section"]');
    const navItems = navigation?.querySelectorAll('[data-testid$="-nav-item"]') ?? [];

    expect(navItems[0]?.getAttribute('data-testid')).toBe('settings-account-nav-item');
    expect(navItems[1]?.getAttribute('data-testid')).toBe('settings-help-nav-item');
    expect(getByTestId('settings-help-nav-item').textContent).toContain('도움말');
    expect(getByTestId('settings-account-panel').textContent).toContain('연결된 계정');
    expect(document.body.querySelector('[data-testid="settings-help-dialog"]')).toBeNull();
  });

  it('opens a larger help modal above settings with three guide sections side by side', async () => {
    mountSettingsModal();

    getByTestId('settings-help-nav-item').click();
    await nextTick();

    const helpDialog = getByTestId('settings-help-dialog');

    expect(helpDialog.getAttribute('role')).toBe('dialog');
    expect(helpDialog.getAttribute('aria-modal')).toBe('true');
    expect(getByTestId('settings-dialog').textContent).toContain('연결된 계정');
    expect(helpDialog.textContent).toContain('도움말');

    const columns = helpDialog.querySelectorAll('[data-testid^="settings-help-card-"]');

    expect(columns).toHaveLength(3);
    expect(columns[0]?.getAttribute('data-testid')).toBe('settings-help-card-ask');
    expect(columns[1]?.getAttribute('data-testid')).toBe('settings-help-card-search');
    expect(columns[2]?.getAttribute('data-testid')).toBe('settings-help-card-verify');
    expect(getByTestId('settings-help-card-ask').textContent).toContain('01');
    expect(getByTestId('settings-help-card-ask').textContent).toContain('Ask');
    expect(getByTestId('settings-help-card-search').textContent).toContain('02');
    expect(getByTestId('settings-help-card-search').textContent).toContain('고정');
    expect(getByTestId('settings-help-card-verify').textContent).toContain('03');
    expect(getByTestId('settings-help-card-verify').textContent).toContain('Verify');
  });

  it('renders character images and visual mockups in each help section', async () => {
    mountSettingsModal();

    getByTestId('settings-help-nav-item').click();
    await nextTick();

    expect(
      getByTestId('settings-help-card-ask').querySelector('img[src*="lina-ask"]'),
    ).not.toBeNull();
    expect(
      getByTestId('settings-help-card-ask').querySelector('img[src*="chat-input-box"]'),
    ).not.toBeNull();
    expect(
      getByTestId('settings-help-card-search').querySelector('img[src*="lina-search"]'),
    ).not.toBeNull();
    expect(
      getByTestId('settings-help-card-verify').querySelector('img[src*="lina-verify"]'),
    ).not.toBeNull();
    expect(getByTestId('settings-help-card-verify').querySelector('svg')).not.toBeNull();
  });

  it('closes the help modal with close button, backdrop, and ESC while settings stays open', async () => {
    mountSettingsModal();

    getByTestId('settings-help-nav-item').click();
    await nextTick();
    getByTestId('settings-help-close-button').click();
    await nextTick();
    expect(document.body.querySelector('[data-testid="settings-help-dialog"]')).toBeNull();
    expect(getByTestId('settings-dialog').textContent).toContain('연결된 계정');

    getByTestId('settings-help-nav-item').click();
    await nextTick();
    getByTestId('settings-help-backdrop').click();
    await nextTick();
    expect(document.body.querySelector('[data-testid="settings-help-dialog"]')).toBeNull();

    getByTestId('settings-help-nav-item').click();
    await nextTick();
    getByTestId('settings-help-dialog').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await nextTick();
    expect(document.body.querySelector('[data-testid="settings-help-dialog"]')).toBeNull();
    expect(getByTestId('settings-account-panel').textContent).toContain('연결된 계정');
  });

  it('closes the help modal together when the settings modal is closed', async () => {
    const wrapper = mountSettingsModal();

    getByTestId('settings-help-nav-item').click();
    await nextTick();
    expect(document.body.querySelector('[data-testid="settings-help-dialog"]')).not.toBeNull();

    await wrapper.setProps({ isOpen: false });
    await wrapper.setProps({ isOpen: true });
    await nextTick();

    expect(getByTestId('settings-account-panel').textContent).toContain('연결된 계정');
    expect(document.body.querySelector('[data-testid="settings-help-dialog"]')).toBeNull();
  });

  it('uses compact typography and a dark logout button', () => {
    mountSettingsModal();

    expect(getByTestId('settings-title').className).toContain('text-[18px]');

    const logoutButton = getByTestId('settings-logout-button');

    expect(logoutButton.className).toContain('bg-overlay-dark-80');
    expect(logoutButton.className).toContain('text-primary-white');
  });

  it('opens the settings modal from the header profile entry with a tooltip', async () => {
    const wrapper = mount(ChatPage, {
      global: {
        plugins: [createPinia(), router],
      },
      attachTo: document.body,
    });
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const profileTooltip = getByTestId('profile-entry').closest('[data-testid="base-tooltip"]');

    expect(profileTooltip?.getAttribute('aria-label')).toBe('계정 관리');
    expect(wrapper.find('[data-testid="settings-dialog"]').exists()).toBe(false);

    await wrapper.get('[data-testid="profile-entry"]').trigger('click');
    await nextTick();

    expect(getByTestId('settings-dialog').textContent).toContain('연결된 계정');
  });

  it('opens the help modal from the chat main floating help button', async () => {
    const wrapper = mount(ChatPage, {
      global: {
        plugins: [createPinia(), router],
      },
      attachTo: document.body,
    });
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const helpWrapper = getByTestId('floating-help-wrapper');

    expect(helpWrapper.className).toContain('fixed');
    expect(helpWrapper.className).toContain('z-30');
    expect(wrapper.find('[data-testid="settings-help-dialog"]').exists()).toBe(false);

    await wrapper.get('[data-testid="floating-help-button"]').trigger('click');
    await nextTick();

    expect(getByTestId('settings-help-dialog').textContent).toContain('도움말');
    expect(getByTestId('settings-help-card-search').textContent).toContain('고정');
  });

  it('opens from the Chat sidebar settings entry', async () => {
    const wrapper = mount(ChatPage, {
      global: {
        plugins: [createPinia(), router],
      },
      attachTo: document.body,
    });
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(wrapper.find('[data-testid="settings-dialog"]').exists()).toBe(false);

    await wrapper.get('[data-testid="settings-entry"]').trigger('click');
    await nextTick();

    expect(getByTestId('settings-dialog').textContent).toContain('연결된 계정');
  });
});
