import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminEntryPage from '@/pages/AdminEntryPage.vue';
import router from '@/router';
import { getAdminDataOverview, getAdminSyncHistory, getCurrentUser } from '@/api';

vi.mock('@/api', () => ({
  getCurrentUser: vi.fn(),
  getAdminDataOverview: vi.fn(),
  getAdminSyncHistory: vi.fn(),
}));

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetAdminDataOverview = vi.mocked(getAdminDataOverview);
const mockedGetAdminSyncHistory = vi.mocked(getAdminSyncHistory);

describe('feature14 Admin operations board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('connects /admin and /admin/operations to the admin operations board entry', () => {
    const adminRoute = router.getRoutes().find((route) => route.path === '/admin');
    const operationsRoute = router.getRoutes().find((route) => route.path === '/admin/operations');

    expect(adminRoute?.components?.default).toBe(AdminEntryPage);
    expect(operationsRoute?.components?.default).toBe(AdminEntryPage);
  });

  it('renders the admin shell, data cards, sync history, and ingest placeholder for ADMIN users', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      userId: 'admin-001',
      name: '관 관리자',
      email: 'admin@company.com',
      role: 'ADMIN',
      profileImageUrl: 'https://example.com/admin.png',
      lastLoginAt: '2026-06-04T10:23:00+09:00',
    });
    mockedGetAdminDataOverview.mockResolvedValue({
      totalSpaces: 6,
      totalPages: 2847,
      totalAttachments: 934,
      vectorDbSize: '1.2 GB',
      totalChunks: 18432,
      lastSyncAt: '2026-06-04T07:23:00+09:00',
    });
    mockedGetAdminSyncHistory.mockResolvedValue({
      syncHistory: [
        {
          syncId: 'sync-001',
          status: 'COMPLETED',
          updatedPages: 15,
          deletedPages: 5,
          duration: 140,
          completedAt: '2026-06-04T10:23:00+09:00',
        },
        {
          syncId: 'sync-002',
          status: 'FAILED',
          updatedPages: 10,
          deletedPages: 1,
          duration: 67,
          completedAt: '2026-06-03T10:23:00+09:00',
        },
      ],
    });

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    expect(mockedGetCurrentUser).toHaveBeenCalledTimes(1);
    expect(mockedGetAdminDataOverview).toHaveBeenCalledTimes(1);
    expect(mockedGetAdminSyncHistory).toHaveBeenCalledTimes(1);
    expect(wrapper.get('[data-testid="admin-page"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Confluence 데이터 수집 및 동기화를 관리하세요');
    expect(wrapper.text()).toContain('운영');
    expect(wrapper.text()).toContain('대시보드');
    expect(wrapper.text()).toContain('피드백');
    expect(wrapper.text()).toContain('동기화 이력');
    expect(wrapper.get('[data-testid="admin-profile-name"]').text()).toBe('관 관리자');
    expect(wrapper.get('[data-testid="admin-profile-email"]').text()).toBe('admin@company.com');
    expect(wrapper.get('[data-testid="admin-data-card-totalSpaces"]').text()).toContain('6');
    expect(wrapper.get('[data-testid="admin-data-card-totalPages"]').text()).toContain('2,847');
    expect(wrapper.get('[data-testid="admin-data-card-totalAttachments"]').text()).toContain('934');
    expect(wrapper.get('[data-testid="admin-data-card-vectorDbSize"]').text()).toContain('1.2 GB');
    expect(wrapper.get('[data-testid="admin-data-card-totalChunks"]').text()).toContain('18,432');
    expect(wrapper.get('[data-testid="admin-last-sync-at"]').text()).toContain('06. 04.');
    expect(wrapper.get('[data-testid="admin-sync-row-sync-001"]').text()).toContain('COMPLETED');
    expect(wrapper.get('[data-testid="admin-sync-row-sync-002"]').text()).toContain('FAILED');
    expect(wrapper.get('[data-testid="admin-ingest-placeholder"]').text()).toContain(
      'API 연결 전 placeholder 상태',
    );
  });

  it('shows an empty state when the admin sync history has no rows', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      userId: 'admin-001',
      name: '관 관리자',
      email: 'admin@company.com',
      role: 'ADMIN',
      profileImageUrl: 'https://example.com/admin.png',
      lastLoginAt: '2026-06-04T10:23:00+09:00',
    });
    mockedGetAdminDataOverview.mockResolvedValue({
      totalSpaces: 6,
      totalPages: 2847,
      totalAttachments: 934,
      vectorDbSize: '1.2 GB',
      totalChunks: 18432,
      lastSyncAt: '2026-06-04T07:23:00+09:00',
    });
    mockedGetAdminSyncHistory.mockResolvedValue({
      syncHistory: [],
    });

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    expect(wrapper.get('[data-testid="admin-sync-empty"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('최근 동기화 이력이 없습니다');
  });

  it('blocks non-admin users before requesting admin board APIs', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      userId: 'user-001',
      name: '이다연',
      email: 'dayeon@example.com',
      role: 'USER',
      profileImageUrl: 'https://example.com/user.png',
      lastLoginAt: '2026-06-04T10:23:00+09:00',
    });

    await router.push('/admin');
    await router.isReady();

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    expect(mockedGetAdminDataOverview).not.toHaveBeenCalled();
    expect(mockedGetAdminSyncHistory).not.toHaveBeenCalled();
    expect(wrapper.get('[data-testid="admin-access-denied"]').text()).toContain(
      '관리자 권한이 없는 계정입니다',
    );

    await wrapper.get('[data-testid="admin-access-denied-login-button"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('shows a retryable error state when the admin board request fails', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      userId: 'admin-001',
      name: '관 관리자',
      email: 'admin@company.com',
      role: 'ADMIN',
      profileImageUrl: 'https://example.com/admin.png',
      lastLoginAt: '2026-06-04T10:23:00+09:00',
    });
    mockedGetAdminDataOverview.mockRejectedValueOnce(new Error('network error')).mockResolvedValue({
      totalSpaces: 6,
      totalPages: 2847,
      totalAttachments: 934,
      vectorDbSize: '1.2 GB',
      totalChunks: 18432,
      lastSyncAt: '2026-06-04T07:23:00+09:00',
    });
    mockedGetAdminSyncHistory
      .mockResolvedValueOnce({
        syncHistory: [],
      })
      .mockResolvedValue({
        syncHistory: [],
      });

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    expect(wrapper.get('[data-testid="admin-board-error"]').exists()).toBe(true);

    await wrapper.get('[data-testid="admin-board-error"] button').trigger('click');
    await flushPromises();

    expect(mockedGetAdminDataOverview).toHaveBeenCalledTimes(2);
    expect(wrapper.get('[data-testid="admin-sync-empty"]').exists()).toBe(true);
  });
});
