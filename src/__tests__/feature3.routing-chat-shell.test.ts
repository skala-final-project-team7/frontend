import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import App from '@/App.vue';
import ChatPage from '@/pages/ChatPage.vue';
import router from '@/router';

describe('feature3 routing and chat shell', () => {
  it('connects the /chat route to the Chat page', () => {
    const chatRoute = router.getRoutes().find((route) => route.path === '/chat');

    expect(chatRoute?.name).toBe('chat');
    expect(chatRoute?.components?.default).toBe(ChatPage);
  });

  it('connects /chat/:conversationId to the Chat page for conversation detail state', () => {
    const conversationRoute = router
      .getRoutes()
      .find((route) => route.path === '/chat/:conversationId');

    expect(conversationRoute?.name).toBe('chat-conversation');
    expect(conversationRoute?.components?.default).toBe(ChatPage);
  });

  it('renders Chat page through the app router outlet at the chat route', async () => {
    router.push('/chat');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.find('[data-testid="chat-page"]').exists()).toBe(true);
  });

  it('keeps the Chat shell regions after SCR-400 details are implemented', () => {
    const wrapper = mount(ChatPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.find('[data-testid="chat-sidebar"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="chat-main"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="message-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="reference-panel"]').exists()).toBe(true);
  });
});
