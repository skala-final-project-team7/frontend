import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import {
  BaseButton,
  BaseGradientButton,
  BaseIconButton,
  BaseSpinner,
  EmptyState,
  ErrorRetryState,
} from '@/shared';

describe('feature7 shared UI state components', () => {
  it('renders BaseSpinner as an accessible loading status', () => {
    const wrapper = mount(BaseSpinner, {
      props: {
        label: '답변을 생성하고 있습니다',
      },
    });

    expect(wrapper.get('[role="status"]').attributes('aria-live')).toBe('polite');
    expect(wrapper.text()).toContain('답변을 생성하고 있습니다');

    const dots = wrapper.findAll('[data-testid="base-spinner-dot"]');

    expect(dots).toHaveLength(3);
    expect(dots[0].classes()).toContain('lina-spinner-dot');
    expect(dots[1].classes()).toContain('lina-spinner-dot');
    expect(dots[2].classes()).toContain('lina-spinner-dot');
    expect(dots[0].attributes('style')).toContain('animation-delay: 0ms');
    expect(dots[1].attributes('style')).toContain('animation-delay: 180ms');
    expect(dots[2].attributes('style')).toContain('animation-delay: 360ms');
  });

  it('renders EmptyState with mascot image, title, description, and optional action slot', () => {
    const wrapper = mount(EmptyState, {
      props: {
        title: '검색 결과가 없습니다',
        description: '다른 질문으로 다시 시도해 주세요.',
      },
      slots: {
        action: '<button type="button">새 질문</button>',
      },
    });

    expect(wrapper.get('[data-testid="empty-state"]').text()).toContain('검색 결과가 없습니다');
    expect(wrapper.get('[data-testid="empty-state-mascot"]').attributes('src')).toContain(
      'mascot-wrong',
    );
    expect(wrapper.get('[data-testid="empty-state-mascot"]').attributes('alt')).toBe('');
    expect(wrapper.text()).toContain('다른 질문으로 다시 시도해 주세요.');
    expect(wrapper.get('button').text()).toBe('새 질문');
  });

  it('renders BaseButton with native button defaults and emits click events', async () => {
    const onClick = vi.fn();
    const wrapper = mount(BaseButton, {
      props: {
        variant: 'primary',
        onClick,
      },
      slots: {
        default: '질문 보내기',
      },
    });

    const button = wrapper.get('button');

    expect(button.attributes('type')).toBe('button');
    expect(button.classes()).toContain('bg-primary');
    expect(button.classes()).toEqual(
      expect.arrayContaining([
        'hover:brightness-105',
        'active:scale-[0.98]',
        'focus-visible:shadow-focus',
        'focus-visible:brightness-105',
      ]),
    );

    await button.trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('keeps BaseButton disabled state non-interactive', async () => {
    const onClick = vi.fn();
    const wrapper = mount(BaseButton, {
      props: {
        disabled: true,
        onClick,
      },
      slots: {
        default: '비활성 버튼',
      },
    });

    const button = wrapper.get('button');

    expect(button.attributes('disabled')).toBeDefined();

    await button.trigger('click');

    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders BaseGradientButton as a compact orange-red pill CTA', async () => {
    const onClick = vi.fn();
    const wrapper = mount(BaseGradientButton, {
      props: {
        onClick,
      },
      slots: {
        default: 'Go to Chat',
      },
    });

    const button = wrapper.get('button');

    expect(button.attributes('type')).toBe('button');
    expect(button.classes()).toEqual(
      expect.arrayContaining([
        'h-[30.46px]',
        'w-[130.53px]',
        'rounded-full',
        'bg-gradient-to-r',
        'from-[#F79140]',
        'to-[#FF4A19]',
        'text-[10px]',
        'font-bold',
        'text-white',
        'hover:brightness-105',
        'active:scale-[0.98]',
        'focus-visible:shadow-focus',
        'focus-visible:brightness-105',
      ]),
    );
    expect(button.text()).toBe('Go to Chat');

    await button.trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders BaseGradientButton disabled state with the same opacity policy as BaseButton', async () => {
    const onClick = vi.fn();
    const wrapper = mount(BaseGradientButton, {
      props: {
        disabled: true,
        onClick,
      },
      slots: {
        default: 'Go to Chat',
      },
    });

    const button = wrapper.get('button');

    expect(button.attributes('disabled')).toBeDefined();
    expect(button.classes()).toEqual(
      expect.arrayContaining([
        'bg-gradient-to-r',
        'from-[#F79140]',
        'to-[#FF4A19]',
        'text-white',
        'disabled:opacity-40',
      ]),
    );

    await button.trigger('click');

    expect(onClick).not.toHaveBeenCalled();
  });

  it('requires BaseIconButton ariaLabel and applies it to the button', () => {
    expect(BaseIconButton.props?.ariaLabel).toMatchObject({
      required: true,
      type: String,
    });

    const wrapper = mount(BaseIconButton, {
      props: {
        ariaLabel: '설정 열기',
      },
      slots: {
        default: '<span aria-hidden="true">S</span>',
      },
    });

    const button = wrapper.get('button');

    expect(button.attributes('aria-label')).toBe('설정 열기');
    expect(button.classes()).toEqual(
      expect.arrayContaining([
        'hover:brightness-105',
        'active:scale-[0.96]',
        'focus-visible:shadow-focus',
        'focus-visible:brightness-105',
      ]),
    );
    expect(button.text()).toBe('S');
  });

  it('renders ErrorRetryState with retry action semantics', async () => {
    const wrapper = mount(ErrorRetryState, {
      props: {
        title: '응답을 불러오지 못했습니다',
        message: '네트워크 상태를 확인한 뒤 다시 시도해 주세요.',
        retryLabel: '다시 시도',
      },
    });

    expect(wrapper.get('[role="alert"]').text()).toContain('응답을 불러오지 못했습니다');
    expect(wrapper.text()).toContain('네트워크 상태를 확인한 뒤 다시 시도해 주세요.');
    expect(wrapper.get('[data-testid="error-retry-icon"]').attributes('aria-hidden')).toBe('true');
    expect(wrapper.get('button').classes()).toContain('gap-3');

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('retry')).toHaveLength(1);
  });
});
