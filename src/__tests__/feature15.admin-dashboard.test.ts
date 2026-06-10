import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminEntryPage from '@/pages/AdminEntryPage.vue';
import router from '@/router';
import {
  activateAdminKey,
  getAdminDataOverview,
  getAdminIngestStatus,
  getAdminSyncHistory,
  getAdminStats,
  getAdminUsers,
  getCurrentUser,
  startAdminIngestJob,
} from '@/api';
import type { AdminStats, AdminUsersResponse } from '@/types/api';

vi.mock('@/api', () => ({
  activateAdminKey: vi.fn(),
  getAdminDataOverview: vi.fn(),
  getAdminIngestStatus: vi.fn(),
  getAdminSyncHistory: vi.fn(),
  getAdminStats: vi.fn(),
  getAdminUsers: vi.fn(),
  getCurrentUser: vi.fn(),
  startAdminIngestJob: vi.fn(),
}));

vi.mocked(activateAdminKey);
vi.mocked(getAdminIngestStatus);
vi.mocked(startAdminIngestJob);

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetAdminDataOverview = vi.mocked(getAdminDataOverview);
const mockedGetAdminSyncHistory = vi.mocked(getAdminSyncHistory);
const mockedGetAdminStats = vi.mocked(getAdminStats);
const mockedGetAdminUsers = vi.mocked(getAdminUsers);

const mockStats: AdminStats = {
  dailyQueryCount: 1284,
  avgResponseTime: 2.3,
  totalConversations: 8741,
  hourlyAccessTrend: [
    { hour: 9, count: 23 },
    { hour: 10, count: 45 },
    { hour: 11, count: 70 },
    { hour: 12, count: 55 },
  ],
};

const mockUsers: AdminUsersResponse = {
  totalUsers: 58,
  dailyActiveUsers: 23,
  users: [
    {
      userId: 'user-001',
      name: '사용자 1',
      accessibleSpaceCount: 1,
      accessiblePageCount: 143,
      accessibleAttachmentCount: 46,
      conversationCount: 42,
      lastAccessAt: '2026-06-01T10:16:00+09:00',
    },
    {
      userId: 'user-002',
      name: '사용자 2',
      accessibleSpaceCount: 1,
      accessiblePageCount: 136,
      accessibleAttachmentCount: 45,
      conversationCount: 52,
      lastAccessAt: '2026-05-31T08:07:00+09:00',
    },
  ],
};

describe('feature15 Admin dashboard (SCR-810)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockAdminBoardBase() {
    mockedGetCurrentUser.mockResolvedValue({
      userId: 'admin-001',
      name: '관 관리자',
      email: 'admin@company.com',
      role: 'ADMIN',
      profileImageUrl: '',
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
    mockedGetAdminSyncHistory.mockResolvedValue({ syncHistory: [] });
  }

  async function mountAndNavigateToDashboard() {
    const wrapper = mount(AdminEntryPage, {
      global: { plugins: [createPinia(), router] },
    });
    await flushPromises();

    const dashboardBtn = wrapper
      .findAll('[data-testid="admin-nav"] button')
      .find((b) => b.text().includes('사용자 현황'));
    await dashboardBtn!.trigger('click');
    await flushPromises();
    return wrapper;
  }

  it('connects /admin/dashboard to AdminEntryPage', () => {
    const route = router.getRoutes().find((r) => r.path === '/admin/dashboard');
    expect(route?.components?.default).toBe(AdminEntryPage);
  });

  it('calls getAdminStats and getAdminUsers when 대시보드 tab is activated', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    await mountAndNavigateToDashboard();

    expect(mockedGetAdminStats).toHaveBeenCalledTimes(1);
    expect(mockedGetAdminUsers).toHaveBeenCalledTimes(1);
  });

  it('renders KPI cards with correct stats values', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.find('[data-testid="admin-dashboard-section"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="admin-stats-card-dailyQueryCount"]').text()).toContain(
      '1,284',
    );
    expect(wrapper.get('[data-testid="admin-stats-card-avgResponseTime"]').text()).toContain('2.3');
    expect(wrapper.get('[data-testid="admin-stats-card-users"]').text()).toContain('58');
    expect(wrapper.get('[data-testid="admin-stats-card-users"]').text()).toContain('23');
    expect(wrapper.get('[data-testid="admin-stats-card-totalConversations"]').text()).toContain(
      '8,741',
    );
  });

  it('renders period tabs and changes active state on click (UI state only, no re-fetch)', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.find('[data-testid="admin-trend-period-tab-today"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-trend-period-tab-7d"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-trend-period-tab-30d"]').exists()).toBe(true);

    expect(
      wrapper.find('[data-testid="admin-trend-period-tab-today"]').attributes('aria-selected'),
    ).toBe('true');

    await wrapper.find('[data-testid="admin-trend-period-tab-7d"]').trigger('click');

    expect(
      wrapper.find('[data-testid="admin-trend-period-tab-7d"]').attributes('aria-selected'),
    ).toBe('true');
    expect(
      wrapper.find('[data-testid="admin-trend-period-tab-today"]').attributes('aria-selected'),
    ).toBe('false');
    // query params가 미확정이므로 stats API 재호출 없음
    expect(mockedGetAdminStats).toHaveBeenCalledTimes(1);
  });

  it('renders the access trend chart container', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.find('[data-testid="admin-access-trend-chart"]').exists()).toBe(true);
  });

  it('renders user table rows with name, space/page/attachment, conversationCount', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.find('[data-testid="admin-users-table"]').exists()).toBe(true);

    const user1Row = wrapper.find('[data-testid="admin-user-row-user-001"]');
    expect(user1Row.exists()).toBe(true);
    expect(user1Row.text()).toContain('사용자 1');
    expect(user1Row.text()).toContain('1 / 143 / 46');
    expect(user1Row.text()).toContain('42');

    const user2Row = wrapper.find('[data-testid="admin-user-row-user-002"]');
    expect(user2Row.exists()).toBe(true);
    expect(user2Row.text()).toContain('사용자 2');
    expect(user2Row.text()).toContain('1 / 136 / 45');
    expect(user2Row.text()).toContain('52');
  });

  it('shows empty state when users list is empty', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue({
      totalUsers: 0,
      dailyActiveUsers: 0,
      users: [],
    });

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.find('[data-testid="admin-users-empty"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-users-table"]').exists()).toBe(false);
  });

  it('shows error state when getAdminStats fails, retries on button click', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockRejectedValueOnce(new Error('서버 오류'));
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.find('[data-testid="admin-dashboard-error"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-dashboard-error"]').text()).toContain('서버 오류');

    mockedGetAdminStats.mockResolvedValue(mockStats);
    await wrapper.find('[data-testid="admin-dashboard-error"] button').trigger('click');
    await flushPromises();

    expect(mockedGetAdminStats).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-testid="admin-dashboard-section"]').exists()).toBe(true);
  });

  it('shows pagination page info and total user count in the table header', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    const pagination = wrapper.find('[data-testid="admin-users-pagination"]');
    expect(pagination.exists()).toBe(true);
    // totalUsers 58, size 20 → 3 페이지
    expect(pagination.text()).toContain('1 / 3 페이지');
    expect(wrapper.text()).toContain('전체 58명');
  });

  it('calls getAdminUsers with next page params when pagination advances', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(mockedGetAdminUsers).toHaveBeenCalledWith({ page: 0, size: 20 });

    mockedGetAdminUsers.mockResolvedValue({ totalUsers: 58, dailyActiveUsers: 23, users: [] });
    await wrapper.find('[data-testid="admin-users-pagination-next"]').trigger('click');
    await flushPromises();

    expect(mockedGetAdminUsers).toHaveBeenCalledWith({ page: 1, size: 20 });
  });
});
