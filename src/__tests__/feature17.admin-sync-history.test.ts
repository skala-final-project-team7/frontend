import { flushPromises, mount } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminEntryPage from '@/pages/AdminEntryPage.vue';
import router from '@/router';
import {
  getAdminDataOverview,
  getAdminIngestStatus,
  getAdminSyncHistory,
  getCurrentUser,
  logout,
  startAdminIngestJob,
} from '@/api';
import type { AdminSyncHistoryResponse } from '@/types/api';

vi.mock('@/api', () => ({
  getAdminDataOverview: vi.fn(),
  getAdminFeedback: vi.fn(),
  getAdminIngestStatus: vi.fn(),
  getAdminStats: vi.fn(),
  getAdminSyncHistory: vi.fn(),
  getAdminUsers: vi.fn(),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
  startAdminIngestJob: vi.fn(),
}));

vi.mocked(getAdminIngestStatus);
vi.mocked(logout);
vi.mocked(startAdminIngestJob);

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetAdminDataOverview = vi.mocked(getAdminDataOverview);
const mockedGetAdminSyncHistory = vi.mocked(getAdminSyncHistory);

const mockSyncHistory: AdminSyncHistoryResponse = {
  syncHistory: [
    {
      syncId: 'sync-001',
      status: 'COMPLETED',
      updatedPages: 1200,
      deletedPages: 5,
      duration: 140,
      completedAt: '2026-06-04T10:23:00+09:00',
    },
    {
      syncId: 'sync-002',
      status: 'FAILED',
      updatedPages: 18,
      deletedPages: 1,
      duration: 67,
      completedAt: '2026-06-03T10:23:00+09:00',
    },
    {
      syncId: 'sync-003',
      status: 'IN_PROGRESS',
      updatedPages: 79,
      deletedPages: 0,
      duration: 138,
      completedAt: '2026-06-02T18:23:00+09:00',
    },
    {
      syncId: 'sync-004',
      status: 'STARTED',
      updatedPages: 5,
      deletedPages: 0,
      duration: 10,
      completedAt: '2026-06-01T18:23:00+09:00',
    },
    {
      syncId: 'sync-005',
      status: 'COMPLETED',
      updatedPages: 42,
      deletedPages: 2,
      duration: 91,
      completedAt: '2026-05-31T18:23:00+09:00',
    },
    {
      syncId: 'sync-006',
      status: 'COMPLETED',
      updatedPages: 33,
      deletedPages: 3,
      duration: 88,
      completedAt: '2026-05-30T18:23:00+09:00',
    },
  ],
};

describe('feature17 Admin sync history (SCR-830)', () => {
  const mountedWrappers: VueWrapper[] = [];

  beforeEach(async () => {
    vi.clearAllMocks();
    await router.push('/admin');
  });

  afterEach(() => {
    for (const wrapper of mountedWrappers) {
      wrapper.unmount();
    }
    mountedWrappers.length = 0;
  });

  function mockAdminBoardBase(syncHistory: AdminSyncHistoryResponse = mockSyncHistory) {
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
      vectorDbSize: '1.2 GB',
      totalChunks: 18432,
      lastSyncAt: '2026-06-04T07:23:00+09:00',
    });
    mockedGetAdminSyncHistory.mockResolvedValue(syncHistory);
  }

  async function mountAndNavigateToSync() {
    const wrapper = mount(AdminEntryPage, {
      global: { plugins: [createPinia(), router] },
    });
    mountedWrappers.push(wrapper);
    await flushPromises();

    const syncSubTab = wrapper.get('[data-testid="admin-document-subtab-sync"]');
    await syncSubTab.trigger('click');
    await flushPromises();
    return wrapper;
  }

  it('connects /admin/sync to AdminEntryPage', () => {
    const route = router.getRoutes().find((r) => r.path === '/admin/sync');
    expect(route?.components?.default).toBe(AdminEntryPage);
  });

  it('places 동기화 이력 under 문서 데이터 관리 instead of a top-level nav item', async () => {
    mockAdminBoardBase();

    const wrapper = mount(AdminEntryPage, {
      global: { plugins: [createPinia(), router] },
    });
    mountedWrappers.push(wrapper);
    await flushPromises();

    const topLevelNavButtons = wrapper.findAll('[data-testid="admin-nav"] > button');
    expect(topLevelNavButtons.map((button) => button.text())).toEqual([
      '문서 데이터 관리',
      '사용자 현황',
      '피드백',
    ]);

    expect(wrapper.get('[data-testid="admin-document-subtab-operations"]').text()).toContain(
      '운영 대시보드',
    );
    expect(wrapper.get('[data-testid="admin-document-subtab-sync"]').text()).toContain(
      '동기화 이력',
    );
  });

  it('renders the existing SCR-800 content title as a document-management breadcrumb', async () => {
    mockAdminBoardBase();

    const wrapper = mount(AdminEntryPage, {
      global: { plugins: [createPinia(), router] },
    });
    mountedWrappers.push(wrapper);
    await flushPromises();

    const heading = wrapper.get('[data-testid="admin-operations-heading"]');
    expect(heading.text()).toContain('문서 데이터 관리');
    expect(heading.text()).toContain('>');
    expect(heading.text()).toContain('운영 대시보드');
    expect(wrapper.get('[data-testid="admin-operations-subheading"]').classes()).toContain(
      'text-primary',
    );
  });

  it('renders sync history table with status, counts, duration, and completed time', async () => {
    mockAdminBoardBase();

    const wrapper = await mountAndNavigateToSync();

    expect(wrapper.find('[data-testid="admin-sync-history-section"]').exists()).toBe(true);
    expect(mockedGetAdminSyncHistory).toHaveBeenCalledTimes(2);

    const firstRow = wrapper.get('[data-testid="admin-sync-history-row-sync-001"]');
    expect(firstRow.text()).toContain('완료');
    expect(firstRow.text()).toContain('1,200개');
    expect(firstRow.text()).toContain('5개');
    expect(firstRow.text()).toContain('140초');
    expect(firstRow.text()).toMatch(/06.*04/);
  });

  it('visually distinguishes FAILED from COMPLETED while using the API enum values', async () => {
    mockAdminBoardBase();

    const wrapper = await mountAndNavigateToSync();

    const completedBadge = wrapper.get('[data-testid="admin-sync-status-sync-001"]');
    const failedBadge = wrapper.get('[data-testid="admin-sync-status-sync-002"]');

    expect(completedBadge.text()).toBe('완료');
    expect(failedBadge.text()).toBe('실패');
    expect(completedBadge.classes()).toContain('text-[#22C55E]');
    expect(failedBadge.classes()).toContain('text-status-error');
  });

  it('paginates sync history and keeps page size local to the sync tab', async () => {
    mockAdminBoardBase();

    const wrapper = await mountAndNavigateToSync();

    expect(wrapper.findAll('[data-testid^="admin-sync-history-row-"]')).toHaveLength(5);
    expect(wrapper.get('[data-testid="admin-sync-history-pagination"]').text()).toContain(
      '1 / 2 페이지',
    );

    await wrapper.get('[data-testid="admin-sync-history-pagination-next"]').trigger('click');

    expect(wrapper.findAll('[data-testid^="admin-sync-history-row-"]')).toHaveLength(1);
    expect(wrapper.find('[data-testid="admin-sync-history-row-sync-006"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="admin-sync-history-pagination"]').text()).toContain(
      '2 / 2 페이지',
    );

    await wrapper.get('[data-testid="admin-sync-history-pagination-prev"]').trigger('click');
    expect(wrapper.get('[data-testid="admin-sync-history-pagination"]').text()).toContain(
      '1 / 2 페이지',
    );
  });

  it('shows empty state when sync history has no rows', async () => {
    mockAdminBoardBase({ syncHistory: [] });

    const wrapper = await mountAndNavigateToSync();

    expect(wrapper.find('[data-testid="admin-sync-history-empty"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('동기화 이력이 없습니다');
  });

  it('shows retryable error state when sync history loading fails', async () => {
    mockAdminBoardBase();
    mockedGetAdminSyncHistory
      .mockResolvedValueOnce(mockSyncHistory)
      .mockRejectedValueOnce(new Error('동기화 API 오류'));

    const wrapper = await mountAndNavigateToSync();

    expect(wrapper.find('[data-testid="admin-sync-history-error"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-sync-history-error"]').text()).toContain(
      '동기화 API 오류',
    );

    mockedGetAdminSyncHistory.mockResolvedValue(mockSyncHistory);
    await wrapper.get('[data-testid="admin-sync-history-error"] button').trigger('click');
    await flushPromises();

    expect(mockedGetAdminSyncHistory).toHaveBeenCalledTimes(3);
    expect(wrapper.find('[data-testid="admin-sync-history-section"]').exists()).toBe(true);
  });
});
