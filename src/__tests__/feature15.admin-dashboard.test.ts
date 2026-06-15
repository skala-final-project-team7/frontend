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
  logout,
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
  logout: vi.fn(),
  startAdminIngestJob: vi.fn(),
}));

vi.mocked(activateAdminKey);
vi.mocked(getAdminIngestStatus);
vi.mocked(logout);
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

  it('uses the Calm Apricot gradient for the daily active ring', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    const stops = wrapper.findAll('[data-testid^="admin-donut-gradient-stop-"]');
    expect(stops.map((stop) => stop.attributes('stop-color'))).toEqual([
      '#ffe4c2',
      '#ffb55b',
      '#f48122',
    ]);
  });

  it('keeps table density while reducing only the dashboard outer bottom spacing', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.get('[data-testid="admin-dashboard-section"]').classes()).toEqual(
      expect.arrayContaining(['px-8', 'pt-7', 'pb-4']),
    );
    expect(wrapper.get('[data-testid="admin-dashboard-layout"]').classes()).toContain('mt-5');
    expect(wrapper.get('[data-testid="admin-users-table"]').classes()).toContain('text-[0.82rem]');
  });

  it('opens the trend modal with period tabs and a 0~24시 axis when the rail chart is clicked', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue({
      ...mockStats,
      hourlyAccessTrend: [
        { date: '2026-06-08', hour: 9, count: 10 },
        { date: '2026-06-15', hour: 9, count: 2 },
        { date: '2026-06-15', hour: 10, count: 3 },
      ],
    } as unknown as AdminStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.find('[data-testid="admin-trend-modal"]').exists()).toBe(false);

    await wrapper.get('[data-testid="admin-trend-expand"]').trigger('click');

    const modal = wrapper.get('[data-testid="admin-trend-modal"]');
    expect(modal.text()).toContain('시간대별 접속 추이');
    expect(modal.text()).toContain('24시');

    expect(
      wrapper.find('[data-testid="admin-trend-period-tab-today"]').attributes('aria-selected'),
    ).toBe('true');
    expect(wrapper.findAll('[data-testid^="admin-access-trend-modal-dot-"]')).toHaveLength(2);

    await wrapper.find('[data-testid="admin-trend-period-tab-7d"]').trigger('click');

    expect(
      wrapper.find('[data-testid="admin-trend-period-tab-7d"]').attributes('aria-selected'),
    ).toBe('true');
    expect(
      wrapper.find('[data-testid="admin-trend-period-tab-today"]').attributes('aria-selected'),
    ).toBe('false');
    expect(wrapper.findAll('[data-testid^="admin-access-trend-modal-dot-"]')).toHaveLength(2);

    await wrapper.find('[data-testid="admin-trend-period-tab-30d"]').trigger('click');

    expect(wrapper.findAll('[data-testid^="admin-access-trend-modal-dot-"]')).toHaveLength(2);
    expect(wrapper.get('[data-testid="admin-trend-modal"]').text()).toContain('9시 12건');
    // query params가 미확정이므로 stats API 재호출 없음
    expect(mockedGetAdminStats).toHaveBeenCalledTimes(1);
  });

  it('closes the trend modal with the close button and ESC', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    await wrapper.get('[data-testid="admin-trend-expand"]').trigger('click');
    await wrapper.get('[data-testid="admin-trend-modal-close"]').trigger('click');
    expect(wrapper.find('[data-testid="admin-trend-modal"]').exists()).toBe(false);

    await wrapper.get('[data-testid="admin-trend-expand"]').trigger('click');
    await wrapper.get('[data-testid="admin-trend-modal"]').trigger('keydown.esc');
    expect(wrapper.find('[data-testid="admin-trend-modal"]').exists()).toBe(false);
  });

  it('highlights conversation bars that are at least twice the page average', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    // 평균 43.3건, 2배 = 86.7건 → 100건만 outlier
    mockedGetAdminUsers.mockResolvedValue({
      totalUsers: 3,
      dailyActiveUsers: 3,
      users: [
        { ...mockUsers.users[0], userId: 'u-low', conversationCount: 10 },
        { ...mockUsers.users[1], userId: 'u-mid', conversationCount: 20 },
        { ...mockUsers.users[1], userId: 'u-high', conversationCount: 100 },
      ],
    });

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.get('[data-testid="admin-user-conv-bar-u-high"]').classes()).toContain(
      'bg-primary',
    );
    expect(wrapper.get('[data-testid="admin-user-conv-bar-u-low"]').classes()).toContain(
      'bg-primary-light',
    );
    expect(wrapper.get('[data-testid="admin-user-conv-bar-u-mid"]').classes()).toContain(
      'bg-primary-light',
    );

    // 막대 만점(100%) = 페이지 평균의 2배 — outlier만 꽉 찬 바가 된다
    expect(wrapper.get('[data-testid="admin-user-conv-bar-u-high"]').attributes('style')).toContain(
      'width: 100%',
    );
    expect(
      wrapper.get('[data-testid="admin-user-conv-bar-u-low"]').attributes('style'),
    ).not.toContain('width: 100%');

    // 비교 툴팁은 기준 초과(outlier) 행 전체 hover로 노출한다 (Teleport → document.body)
    await wrapper.get('[data-testid="admin-user-row-u-high"]').trigger('mouseenter');
    const outlierTooltip = document.body.querySelector('[data-testid="admin-outlier-row-tooltip"]');
    expect(outlierTooltip).not.toBeNull();
    expect(outlierTooltip!.textContent).toContain('2.3배');
    expect(outlierTooltip!.textContent).toContain('다른 사용자보다');

    await wrapper.get('[data-testid="admin-user-row-u-high"]').trigger('mouseleave');
    expect(document.body.querySelector('[data-testid="admin-outlier-row-tooltip"]')).toBeNull();

    // 일반 행 hover 시에는 툴팁이 뜨지 않는다
    await wrapper.get('[data-testid="admin-user-row-u-low"]').trigger('mouseenter');
    expect(document.body.querySelector('[data-testid="admin-outlier-row-tooltip"]')).toBeNull();
  });

  it('shows recency dots in the 마지막 접속 column based on elapsed time, with a legend', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue({
      totalUsers: 3,
      dailyActiveUsers: 2,
      users: [
        {
          ...mockUsers.users[0],
          userId: 'u-fresh',
          lastAccessAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          ...mockUsers.users[1],
          userId: 'u-month',
          lastAccessAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          ...mockUsers.users[1],
          userId: 'u-stale',
          lastAccessAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    });

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.get('[data-testid="admin-user-recency-u-fresh"]').classes()).toContain(
      'bg-status-success',
    );
    expect(wrapper.get('[data-testid="admin-user-recency-u-month"]').classes()).toContain(
      'bg-status-warning',
    );
    expect(wrapper.get('[data-testid="admin-user-recency-u-stale"]').classes()).toContain(
      'bg-bg-400',
    );
    expect(wrapper.text()).toContain('7일 이내');
    expect(wrapper.text()).toContain('30일 이내');
  });

  it('renders the access trend chart container', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(wrapper.find('[data-testid="admin-access-trend-chart"]').exists()).toBe(true);
  });

  it('renders a gradient area under the access trend sparkline and modal chart', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    const sparklineArea = wrapper.get('[data-testid="admin-access-trend-sparkline-area"]');
    expect(sparklineArea.attributes('fill')).toBe('url(#admin-access-trend-sparkline-gradient)');
    expect(wrapper.get('#admin-access-trend-sparkline-gradient').exists()).toBe(true);

    await wrapper.get('[data-testid="admin-trend-expand"]').trigger('click');

    const modalArea = wrapper.get('[data-testid="admin-access-trend-modal-area"]');
    expect(modalArea.attributes('fill')).toBe('url(#admin-access-trend-modal-gradient)');
    expect(wrapper.get('#admin-access-trend-modal-gradient').exists()).toBe(true);
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

    // 마지막 접속에는 연도를 포함해 표시한다
    expect(user1Row.text()).toContain('2026');
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

  it('shows pagination page info and total user count in the rail donut card', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    const pagination = wrapper.find('[data-testid="admin-users-pagination"]');
    expect(pagination.exists()).toBe(true);
    // totalUsers 58, size 12 → 5 페이지
    expect(pagination.text()).toContain('1 / 5 페이지');
    expect(wrapper.get('[data-testid="admin-users-pagination-controls"]').text()).toContain(
      '1 / 5 페이지',
    );
    // 전체/일일 활성 사용자 수는 우측 레일 도넛 카드에서 확인한다
    expect(wrapper.get('[data-testid="admin-stats-card-users"]').text()).toContain('23 / 58명');
  });

  it('sorts user rows by 대화 수 ascending then descending on header clicks', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    // 의도적으로 대화 수 비정렬 순서로 응답 (52 → 42)
    mockedGetAdminUsers.mockResolvedValue({
      totalUsers: 2,
      dailyActiveUsers: 2,
      users: [mockUsers.users[1], mockUsers.users[0]],
    });

    const wrapper = await mountAndNavigateToDashboard();

    function rowTestIds() {
      return wrapper
        .findAll('[data-testid^="admin-user-row-"]')
        .map((row) => row.attributes('data-testid'));
    }

    // 정렬 전: API 응답 순서 유지
    expect(rowTestIds()).toEqual(['admin-user-row-user-002', 'admin-user-row-user-001']);

    // 1번째 클릭: 오름차순 (42 → 52)
    await wrapper.get('[data-testid="admin-users-sort-conversationCount"]').trigger('click');
    expect(rowTestIds()).toEqual(['admin-user-row-user-001', 'admin-user-row-user-002']);

    // 2번째 클릭: 내림차순 (52 → 42)
    await wrapper.get('[data-testid="admin-users-sort-conversationCount"]').trigger('click');
    expect(rowTestIds()).toEqual(['admin-user-row-user-002', 'admin-user-row-user-001']);
  });

  it('sorts user rows by 이름 and exposes aria-sort on the active header', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue({
      totalUsers: 2,
      dailyActiveUsers: 2,
      users: [mockUsers.users[1], mockUsers.users[0]],
    });

    const wrapper = await mountAndNavigateToDashboard();

    const nameHeader = wrapper.get('[data-testid="admin-users-sort-name"]');

    await nameHeader.trigger('click');
    expect(
      wrapper
        .findAll('[data-testid^="admin-user-row-"]')
        .map((row) => row.attributes('data-testid')),
    ).toEqual(['admin-user-row-user-001', 'admin-user-row-user-002']);
    expect(wrapper.get('th[aria-sort]').attributes('aria-sort')).toBe('ascending');

    await nameHeader.trigger('click');
    expect(wrapper.get('th[aria-sort]').attributes('aria-sort')).toBe('descending');
  });

  it('calls getAdminUsers with next page params when pagination advances', async () => {
    mockAdminBoardBase();
    mockedGetAdminStats.mockResolvedValue(mockStats);
    mockedGetAdminUsers.mockResolvedValue(mockUsers);

    const wrapper = await mountAndNavigateToDashboard();

    expect(mockedGetAdminUsers).toHaveBeenCalledWith({ page: 0, size: 12 });

    mockedGetAdminUsers.mockResolvedValue({ totalUsers: 58, dailyActiveUsers: 23, users: [] });
    await wrapper.find('[data-testid="admin-users-pagination-next"]').trigger('click');
    await flushPromises();

    expect(mockedGetAdminUsers).toHaveBeenCalledWith({ page: 1, size: 12 });
  });
});
