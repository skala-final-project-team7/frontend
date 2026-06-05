import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import App from '@/App.vue';
import { AUTH_LOGIN_URL_BY_ROLE } from '@/features/auth/authIntent';
import LandingPage from '@/pages/LandingPage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import router from '@/router';

describe('feature12 Auth / Login + Role Selection', () => {
  it('connects the auth entry routes without registering onboarding screens', () => {
    const routes = router.getRoutes();

    expect(routes.find((route) => route.path === '/')?.components?.default).toBe(LandingPage);
    expect(routes.find((route) => route.path === '/login')?.components?.default).toBe(LoginPage);
    expect(routes.some((route) => route.path.includes('onboarding'))).toBe(false);
    expect(routes.some((route) => route.path.includes('scr-300'))).toBe(false);
    expect(routes.some((route) => route.path.includes('scr-310'))).toBe(false);
  });

  it('moves from Landing CTA to the Login page instead of onboarding', async () => {
    await router.push('/');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await wrapper.get('[data-testid="landing-continue-button"]').trigger('click');
    await flushPromises();
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/login');
    expect(wrapper.find('[data-testid="login-page"]').exists()).toBe(true);
  });

  it('opens role selection from the Confluence CTA before any OAuth navigation intent', async () => {
    const wrapper = mount(LoginPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    expect(wrapper.find('[data-testid="role-selection-panel"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="confluence-login-button"]').attributes('data-auth-url')).toBe(
      '',
    );

    await wrapper.get('[data-testid="confluence-login-button"]').trigger('click');

    expect(wrapper.find('[data-testid="role-selection-panel"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="user-role-button"]').attributes('data-auth-url')).toBe(
      AUTH_LOGIN_URL_BY_ROLE.user,
    );
    expect(wrapper.get('[data-testid="admin-role-button"]').attributes('data-auth-url')).toBe(
      AUTH_LOGIN_URL_BY_ROLE.admin,
    );
  });

  it('keeps role selection as client routing intent and mock-routes to Chat/Admin targets', async () => {
    await router.push('/login');
    await router.isReady();

    const wrapper = mount(LoginPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await wrapper.get('[data-testid="confluence-login-button"]').trigger('click');
    await wrapper.get('[data-testid="user-role-button"]').trigger('click');
    await flushPromises();
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/chat');

    await router.push('/login');
    await router.isReady();

    const adminWrapper = mount(LoginPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await adminWrapper.get('[data-testid="confluence-login-button"]').trigger('click');
    await adminWrapper.get('[data-testid="admin-role-button"]').trigger('click');
    await flushPromises();
    await router.isReady();

    expect(router.currentRoute.value.path).toBe('/admin');
  });
});
