/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : feature13 Auth 백엔드 연결 전환 테스트.
 *           useAuthStore, AuthCallbackPage, 라우터 가드의 동작을 검증한다.
 * 작성일 : 2026-06-15
 * --------------------------------------------------
 */
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRouter, createWebHashHistory } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import type { CurrentUser } from '@/types/api';

// ---------------------------------------------------------------------------
// Mock 설정
// ---------------------------------------------------------------------------

const mockGetCurrentUser = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api')>();
  return {
    ...actual,
    getCurrentUser: () => mockGetCurrentUser(),
    logout: () => mockLogout(),
  };
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn<(key: string) => string | null>((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

const mockUser: CurrentUser = {
  userId: '712020:abc',
  name: '이다연',
  email: 'dayeon@example.com',
  role: 'USER',
  profileImageUrl: 'https://example.com/avatar.png',
  lastLoginAt: '2026-06-15T10:00:00+09:00',
};

const mockAdminUser: CurrentUser = {
  ...mockUser,
  userId: '712020:admin',
  name: '관리자',
  role: 'ADMIN',
};

// ---------------------------------------------------------------------------
// useAuthStore 테스트
// ---------------------------------------------------------------------------

describe('feature13 useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('초기 상태에서 isAuthenticated는 false, currentUser는 null이다', () => {
    const auth = useAuthStore();

    expect(auth.isAuthenticated).toBe(false);
    expect(auth.currentUser).toBeNull();
    expect(auth.isRestoringSession).toBe(false);
  });

  it('localStorage에 accessToken이 없으면 restoreSession은 아무것도 하지 않는다', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const auth = useAuthStore();
    await auth.restoreSession();

    expect(mockGetCurrentUser).not.toHaveBeenCalled();
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.currentUser).toBeNull();
  });

  it('localStorage에 accessToken이 있으면 /api/users/me를 호출해 세션을 복원한다', async () => {
    localStorageMock.getItem.mockReturnValue('valid-token');
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const auth = useAuthStore();
    await auth.restoreSession();

    expect(mockGetCurrentUser).toHaveBeenCalledOnce();
    expect(auth.isAuthenticated).toBe(true);
    expect(auth.currentUser).toEqual(mockUser);
  });

  it('restoreSession 진행 중 isRestoringSession이 true로 설정된다', async () => {
    localStorageMock.getItem.mockReturnValue('valid-token');

    let resolvingSession!: () => void;
    mockGetCurrentUser.mockReturnValue(
      new Promise<CurrentUser>((resolve) => {
        resolvingSession = () => resolve(mockUser);
      }),
    );

    const auth = useAuthStore();
    const sessionPromise = auth.restoreSession();

    expect(auth.isRestoringSession).toBe(true);

    resolvingSession();
    await sessionPromise;

    expect(auth.isRestoringSession).toBe(false);
  });

  it('/api/users/me가 401을 반환하면 localStorage 토큰을 제거하고 인증 해제한다', async () => {
    localStorageMock.getItem.mockReturnValue('expired-token');
    mockGetCurrentUser.mockRejectedValue(new Error('401 Unauthorized'));

    const auth = useAuthStore();
    await auth.restoreSession();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.currentUser).toBeNull();
  });

  it('clearAuth는 localStorage accessToken을 제거하고 currentUser를 null로 만든다', async () => {
    localStorageMock.getItem.mockReturnValue('valid-token');
    mockGetCurrentUser.mockResolvedValue(mockUser);
    const auth = useAuthStore();
    await auth.restoreSession();

    auth.clearAuth();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(auth.isAuthenticated).toBe(false);
    expect(auth.currentUser).toBeNull();
  });

  it('logout은 POST /api/auth/logout을 호출하고 clearAuth를 수행한다', async () => {
    localStorageMock.getItem.mockReturnValue('valid-token');
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockLogout.mockResolvedValue(null);

    const auth = useAuthStore();
    await auth.restoreSession();
    await auth.logout();

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(auth.isAuthenticated).toBe(false);
  });

  it('logout API가 실패해도 clearAuth는 실행된다', async () => {
    localStorageMock.getItem.mockReturnValue('valid-token');
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockLogout.mockRejectedValue(new Error('network error'));

    const auth = useAuthStore();
    await auth.restoreSession();
    await auth.logout();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(auth.isAuthenticated).toBe(false);
  });

  it('ADMIN 사용자로 세션 복원 시 currentUser.role이 ADMIN이다', async () => {
    localStorageMock.getItem.mockReturnValue('admin-token');
    mockGetCurrentUser.mockResolvedValue(mockAdminUser);

    const auth = useAuthStore();
    await auth.restoreSession();

    expect(auth.currentUser?.role).toBe('ADMIN');
    expect(auth.isAuthenticated).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AuthCallbackPage 테스트
// ---------------------------------------------------------------------------

describe('feature13 AuthCallbackPage', () => {
  let pinia: ReturnType<typeof createPinia>;

  beforeEach(() => {
    pinia = createPinia();
    setActivePinia(pinia);
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function mountCallbackPage(query: Record<string, string>) {
    const { default: AuthCallbackPage } = await import('@/pages/AuthCallbackPage.vue');

    const router = createRouter({
      history: createWebHashHistory(),
      routes: [
        { path: '/auth/callback', name: 'auth-callback', component: AuthCallbackPage },
        { path: '/chat', name: 'chat', component: { template: '<div>chat</div>' } },
        { path: '/admin', name: 'admin-entry', component: { template: '<div>admin</div>' } },
        { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      ],
    });

    await router.push({ path: '/auth/callback', query });
    await router.isReady();

    const wrapper = mount(AuthCallbackPage, {
      global: { plugins: [pinia, router] },
    });

    await flushPromises();
    return { wrapper, router };
  }

  it('accessToken 쿼리 파라미터가 있으면 localStorage에 저장한다', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    await mountCallbackPage({ accessToken: 'new-token', refreshToken: 'ref-token' });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('accessToken', 'new-token');
  });

  it('returnTo가 없으면 비정상 진입으로 보고 /login으로 돌려보낸다', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const { router } = await mountCallbackPage({
      accessToken: 'user-token',
      refreshToken: 'ref-token',
    });

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('ADMIN이어도 returnTo가 없으면 /login으로 돌려보낸다', async () => {
    mockGetCurrentUser.mockResolvedValue(mockAdminUser);

    const { router } = await mountCallbackPage({
      accessToken: 'admin-token',
      refreshToken: 'ref-token',
    });

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('returnTo=/chat이면 USER가 선택한 의도대로 /chat으로 라우팅한다', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const { router } = await mountCallbackPage({
      accessToken: 'user-token',
      returnTo: '/chat',
    });

    expect(router.currentRoute.value.path).toBe('/chat');
  });

  it('returnTo=/admin이면 ADMIN이 선택한 의도대로 /admin으로 라우팅한다', async () => {
    mockGetCurrentUser.mockResolvedValue(mockAdminUser);

    const { router } = await mountCallbackPage({
      accessToken: 'admin-token',
      returnTo: '/admin',
    });

    expect(router.currentRoute.value.path).toBe('/admin');
  });

  it('ADMIN이 일반 사용자로 로그인(returnTo=/chat)하면 role이 ADMIN이어도 /chat으로 라우팅한다', async () => {
    mockGetCurrentUser.mockResolvedValue(mockAdminUser);

    const { router } = await mountCallbackPage({
      accessToken: 'admin-token',
      returnTo: '/chat',
    });

    expect(router.currentRoute.value.path).toBe('/chat');
  });

  it('허용되지 않은 returnTo(외부 URL)는 무시하고 /login으로 돌려보낸다', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const { router } = await mountCallbackPage({
      accessToken: 'user-token',
      returnTo: 'https://evil.example.com',
    });

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('errorCode=FORBIDDEN이면 /login?error=FORBIDDEN으로 리디렉션한다', async () => {
    const { router } = await mountCallbackPage({ errorCode: 'FORBIDDEN' });

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.error).toBe('FORBIDDEN');
  });

  it('accessToken이 없으면 /login으로 리디렉션한다', async () => {
    const { router } = await mountCallbackPage({});

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('/api/users/me 실패 시 localStorage 토큰을 제거하고 /login으로 이동한다', async () => {
    mockGetCurrentUser.mockRejectedValue(new Error('401'));

    const { router } = await mountCallbackPage({ accessToken: 'bad-token' });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('callback 페이지에 data-testid=auth-callback-page 엘리먼트가 있다', async () => {
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const { wrapper } = await mountCallbackPage({ accessToken: 'token' });

    expect(wrapper.find('[data-testid="auth-callback-page"]').exists()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 라우터 가드 테스트
// ---------------------------------------------------------------------------

describe('feature13 router navigation guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('미인증 상태에서 /chat 접근 시 /login으로 리디렉션한다', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { default: router } = await import('@/router');
    // 프로덕션과 동일하게 가드 활성화를 위해 세션 복원 시도를 먼저 수행한다
    const auth = useAuthStore();
    await auth.restoreSession();

    await router.push('/chat');
    await router.isReady();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('미인증 상태에서 /admin 접근 시 /login으로 리디렉션한다', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { default: router } = await import('@/router');
    const auth = useAuthStore();
    await auth.restoreSession();

    await router.push('/admin');
    await router.isReady();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('USER 역할로 /admin 접근 시 /login으로 리디렉션한다', async () => {
    localStorageMock.getItem.mockReturnValue('user-token');
    mockGetCurrentUser.mockResolvedValue(mockUser);

    const { default: router } = await import('@/router');
    const auth = useAuthStore();
    await auth.restoreSession();

    await router.push('/admin');
    await router.isReady();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('/auth/callback은 미인증 상태에서도 접근 가능하다', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { default: router } = await import('@/router');
    await router.push('/auth/callback');
    await router.isReady();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/auth/callback');
  });

  it('/login과 /는 미인증 상태에서도 접근 가능하다', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { default: router } = await import('@/router');
    await router.push('/login');
    await router.isReady();
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/login');
  });
});

// ---------------------------------------------------------------------------
// LoginPage 에러 배너 테스트
// ---------------------------------------------------------------------------

describe('feature13 LoginPage 에러 배너', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('?error=FORBIDDEN 쿼리 파라미터가 있으면 권한 부족 안내 배너를 표시한다', async () => {
    const { default: LoginPage } = await import('@/pages/LoginPage.vue');
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/login', component: LoginPage }],
    });

    await router.push({ path: '/login', query: { error: 'FORBIDDEN' } });
    await router.isReady();

    const wrapper = mount(LoginPage, {
      global: { plugins: [createPinia(), router] },
    });

    await flushPromises();

    expect(wrapper.find('[data-testid="auth-error-banner"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="auth-error-banner"]').text()).toContain(
      '관리자 권한이 없는 계정입니다',
    );
  });

  it('에러 쿼리 파라미터가 없으면 에러 배너를 표시하지 않는다', async () => {
    const { default: LoginPage } = await import('@/pages/LoginPage.vue');
    const router = createRouter({
      history: createWebHashHistory(),
      routes: [{ path: '/login', component: LoginPage }],
    });

    await router.push('/login');
    await router.isReady();

    const wrapper = mount(LoginPage, {
      global: { plugins: [createPinia(), router] },
    });

    await flushPromises();

    expect(wrapper.find('[data-testid="auth-error-banner"]').exists()).toBe(false);
  });
});
