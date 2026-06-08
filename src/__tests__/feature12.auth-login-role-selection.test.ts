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

    const acronymWords = wrapper.findAll('[data-testid="landing-acronym-word"]');
    expect(acronymWords).toHaveLength(4);
    expect(acronymWords[0].classes()).toContain('landing-acronym-word');
    expect(acronymWords[0].classes()).toContain('text-body');
    expect(acronymWords[0].classes()).toContain('text-overlay-dark-80');
    expect(acronymWords[0].attributes('style')).toContain('left: 28%');
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

  it('shows only role selection cards on the Login page', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.find('[data-testid="confluence-login-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="role-selection-panel"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="user-role-button"]').classes()).toContain('login-role-card');
    expect(wrapper.get('[data-testid="admin-role-button"]').classes()).toContain('login-role-card');
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
