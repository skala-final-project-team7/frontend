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
    expect(getByTestId('settings-title').textContent?.trim()).toBe('Settings');
    expect(document.body.querySelector('[data-testid="settings-tab-general"]')).toBeNull();
    expect(getByTestId('settings-account-panel').textContent).toContain('연결된 계정');
    expect(getByTestId('settings-account-nav-item').textContent).toContain('계정 관리');
    expect(document.body.querySelector('[data-testid="settings-tab-data"]')).toBeNull();
    expect(getByTestId('settings-account-panel').textContent).toContain('Client_id');
    expect(getByTestId('settings-confluence-icon').getAttribute('src')).toContain(
      'confluence-icon.png',
    );
    expect(getByTestId('settings-account-panel').textContent).toContain(
      '인증 갱신 날짜 : 2026.08.18',
    );
    expect(getByTestId('settings-account-renewal-note').textContent).toContain(
      '90일마다 인증 갱신되어야 합니다.',
    );
    expect(getByTestId('settings-logout-row').textContent).toContain('Log out on this device');
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
