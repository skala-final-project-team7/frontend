import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ChatMain from './ChatMain.vue';

describe('ChatMain', () => {
  it('shows the empty state when there are no messages', () => {
    const wrapper = mount(ChatMain, {
      props: {
        messages: [],
      },
    });

    expect(wrapper.text()).toContain('환영합니다. 사용자님');
  });
});
