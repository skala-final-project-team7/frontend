import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it, vi } from 'vitest';

import { AUTH_LOGIN_URL_BY_ROLE } from '@/features/auth/authIntent';
import LandingPage from '@/pages/LandingPage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import router from '@/router';

describe('feature12 Auth / Login + Role Selection', () => {
  it('connects the auth entry routes without registering onboarding screens', () => {
    const routes = router.getRoutes();
    const rootRoute = routes.find((route) => route.path === '/');

    expect(rootRoute?.components?.default).toBe(LandingPage);
    expect(routes.find((route) => route.path === '/login')?.components?.default).toBe(LoginPage);
    expect(routes.some((route) => route.path === '/landing')).toBe(false);
    expect(routes.some((route) => route.path.includes('onboarding'))).toBe(false);
    expect(routes.some((route) => route.path.includes('scr-300'))).toBe(false);
    expect(routes.some((route) => route.path.includes('scr-310'))).toBe(false);
  });

  it('uses the service root as Landing before entering Login', async () => {
    await router.push('/');
    await router.isReady();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/');
  });

  it('keeps Login as a direct auth route for users who skip the Landing deck', async () => {
    await router.push('/login');
    await router.isReady();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('renders Landing as a three-panel scroll deck with a graph background', async () => {
    const wrapper = mount(LandingPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.get('[data-testid="landing-hero-panel"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="landing-headline-panel"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="landing-login-panel"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="landing-graph"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('scroll');
    expect(wrapper.text()).not.toContain('continue');
    expect(wrapper.find('[data-testid="login-page"]').exists()).toBe(false);

    const scrollIndicators = wrapper.findAll('.landing-scroll-indicator');
    expect(scrollIndicators).toHaveLength(2);
    expect(scrollIndicators[0].classes()).toContain('text-overlay-dark-60');

    const acronymWords = wrapper.findAll('[data-testid="landing-acronym-word"]');
    expect(acronymWords).toHaveLength(4);
    expect(acronymWords[0].classes()).toContain('landing-acronym-word');
    expect(acronymWords[0].classes()).toContain('text-body');
    expect(acronymWords[0].classes()).toContain('text-overlay-dark-80');
    expect(acronymWords[0].attributes('style')).toContain('left: 30%');
    expect(acronymWords[0].attributes('style')).toContain('top: -62%');
  });

  it('scrolls through Landing panels before routing from the final Confluence CTA to Login', async () => {
    Element.prototype.scrollIntoView = vi.fn();

    await router.push('/');
    await router.isReady();

    const wrapper = mount(LandingPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await wrapper.get('[data-testid="landing-continue-button"]').trigger('click');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(router.currentRoute.value.path).toBe('/');

    await wrapper.get('[data-testid="landing-login-button"]').trigger('click');
    await flushPromises();
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('uses polished headline feature visuals for Ask and Verify', async () => {
    const wrapper = mount(LandingPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await wrapper.get('[data-testid="landing-feature-tab-ask"]').trigger('click');

    expect(wrapper.get('[data-testid="landing-ask-mockup"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="landing-ask-arrow"]').classes()).toContain(
      'landing-ask-arrow',
    );
    expect(wrapper.get('[data-testid="landing-ask-input-box"]').attributes('src')).toContain(
      'ui/chat-input-box.png',
    );
    expect(wrapper.get('[data-testid="landing-feature-icon-ask"]').classes()).toContain(
      'text-primary',
    );
    expect(wrapper.get('[data-testid="landing-ask-input-box"]').classes()).toContain('-right-20');
    expect(wrapper.get('[data-testid="landing-ask-input-box"]').classes()).toContain('top-24');
    expect(wrapper.get('[data-testid="landing-ask-arrow-path"]').attributes('d')).toBe(
      'M 196 226 C 260 204 318 194 360 196',
    );

    await wrapper.get('[data-testid="landing-feature-tab-verify"]').trigger('click');

    expect(wrapper.get('[data-testid="landing-verify-tab-icon"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="landing-feature-icon-verify"]').exists()).toBe(true);
  });

  it('shows only role selection cards on the Login page', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.find('[data-testid="confluence-login-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="role-selection-panel"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="user-role-button"]').classes()).toContain('login-role-card');
    expect(wrapper.get('[data-testid="user-role-button"]').classes()).toContain('items-center');
    expect(wrapper.get('[data-testid="user-role-button"]').classes()).toContain('text-center');
    expect(wrapper.get('[data-testid="user-role-button"]').classes()).toContain(
      'hover:-translate-y-2',
    );
    expect(wrapper.get('[data-testid="user-role-button"]').classes()).toContain(
      'hover:border-primary',
    );
    expect(wrapper.get('[data-testid="admin-role-button"]').classes()).toContain('login-role-card');
    expect(wrapper.get('[data-testid="user-role-image"]').attributes('src')).toContain(
      'lina-user.png',
    );
    expect(wrapper.get('[data-testid="user-role-image"]').classes()).toContain('h-28');
    expect(wrapper.get('[data-testid="admin-role-image"]').attributes('src')).toContain(
      'lina-admin.png',
    );
    expect(wrapper.get('[data-testid="admin-role-image"]').classes()).toContain('h-28');
    expect(wrapper.get('[data-testid="user-role-button"]').text()).toContain(
      '사용자별 접근 가능한 문서를 기반으로 질문하고',
    );
    expect(wrapper.get('[data-testid="admin-role-button"]').text()).toContain(
      '접근 권한 및 운영 상태를 관리합니다.',
    );
    expect(wrapper.get('[data-testid="user-role-button"]').text()).toContain(
      '답변의 출처와 근거를 함께 확인해보세요.',
    );
    expect(wrapper.get('[data-testid="user-role-button"] span:nth-of-type(2)').classes()).toContain(
      'whitespace-pre-line',
    );
    expect(wrapper.get('[data-testid="admin-role-note-icon"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="admin-role-note"]').text()).toBe(
      '관리자 권한 확인 후 접근할 수 있습니다.',
    );
    expect(wrapper.get('[data-testid="user-role-button"]').attributes('data-auth-url')).toBe(
      AUTH_LOGIN_URL_BY_ROLE.user,
    );
    expect(wrapper.get('[data-testid="admin-role-button"]').attributes('data-auth-url')).toBe(
      AUTH_LOGIN_URL_BY_ROLE.admin,
    );
  });

  it('defines /api/auth/login as an OAuth endpoint intent only after role selection', () => {
    expect(AUTH_LOGIN_URL_BY_ROLE.user).toBe('/api/auth/login');
    expect(AUTH_LOGIN_URL_BY_ROLE.admin).toBe('/api/auth/login?mode=admin');
  });

  it('uses role selection links as browser navigation targets for the OAuth start endpoint', async () => {
    await router.push('/login');
    await router.isReady();

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    const userRoleLink = wrapper.get('[data-testid="user-role-button"]');
    const adminRoleLink = wrapper.get('[data-testid="admin-role-button"]');

    expect(userRoleLink.element.tagName).toBe('A');
    expect(userRoleLink.attributes('href')).toBe('/api/auth/login');
    expect(adminRoleLink.element.tagName).toBe('A');
    expect(adminRoleLink.attributes('href')).toBe('/api/auth/login?mode=admin');
  });
});
