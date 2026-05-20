import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import App from '@/App.vue';
import ChatPage from '@/pages/ChatPage.vue';
import router from '@/router';

describe('feature3 routing and chat shell', () => {
  it('connects the root route to the Chat page', () => {
    const rootRoute = router.getRoutes().find((route) => route.path === '/');

    expect(rootRoute?.name).toBe('chat');
    expect(rootRoute?.components?.default).toBe(ChatPage);
  });

  it('renders Chat page through the app router outlet at the root route', async () => {
    router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router],
      },
    });

    expect(wrapper.find('[data-testid="chat-page"]').exists()).toBe(true);
  });

  it('keeps the Chat shell regions after SCR-400 details are implemented', () => {
    const wrapper = mount(ChatPage);

    expect(wrapper.find('[data-testid="chat-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="chat-main"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="message-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reference-panel"]').exists()).toBe(true);
  });
});
