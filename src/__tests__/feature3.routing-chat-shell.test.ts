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

  it('keeps only feature3 Chat shell placeholder regions before SCR-400 details', () => {
    const wrapper = mount(ChatPage);

    expect(wrapper.find('[data-testid="chat-sidebar"]').text()).toContain('Sidebar placeholder');
    expect(wrapper.find('[data-testid="chat-main"]').text()).toContain('ChatMain placeholder');
    expect(wrapper.find('[data-testid="message-input"]').text()).toContain(
      'MessageInput placeholder',
    );
    expect(wrapper.find('[data-testid="reference-panel"]').text()).toContain(
      'ReferencePanel placeholder',
    );
    expect(wrapper.text()).toContain('SCR-400 detailed design is reserved for feature8');
  });
});
