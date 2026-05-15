import { createPinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import App from './App.vue';
import { router } from './router';

describe('App', () => {
  it('renders the default chat route', async () => {
    router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.text()).toContain('ASK LINA');
  });
});
