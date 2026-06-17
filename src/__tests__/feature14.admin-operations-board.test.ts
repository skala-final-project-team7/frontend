import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/api', () => ({
  getCurrentUser: vi.fn(),
  getAdminDataOverview: vi.fn(),
  getAdminIngestStatus: vi.fn(),
  getAdminSyncHistory: vi.fn(),
  startAdminIngestJob: vi.fn(),
  logout: vi.fn(),
}));

const mockedGetCurrentUser = vi.mocked(getCurrentUser);
const mockedGetAdminDataOverview = vi.mocked(getAdminDataOverview);
const mockedGetAdminIngestStatus = vi.mocked(getAdminIngestStatus);
const mockedGetAdminSyncHistory = vi.mocked(getAdminSyncHistory);
const mockedStartAdminIngestJob = vi.mocked(startAdminIngestJob);
const mockedLogout = vi.mocked(logout);

function createDeferredPromise<T>() {
  let resolvePromise: (value: T) => void;
  let rejectPromise: (reason?: unknown) => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return {
    promise,
    resolve: resolvePromise!,
    reject: rejectPromise!,
  };
}

describe('feature14 Admin operations board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockedLogout.mockResolvedValue(null);
  });

  function mockAdminBoardBase() {
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
      ],
    });
  }

  it('connects /admin and /admin/operations to the admin operations board entry', () => {
    const adminRoute = router.getRoutes().find((route) => route.path === '/admin');
    const operationsRoute = router.getRoutes().find((route) => route.path === '/admin/operations');

    expect(adminRoute?.components?.default).toBe(AdminEntryPage);
    expect(operationsRoute?.components?.default).toBe(AdminEntryPage);
  });

  it('renders the admin shell, data cards, sync history, and ingest placeholder for ADMIN users', async () => {
    mockAdminBoardBase();
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
    expect(wrapper.find('[data-testid="admin-page"]').exists()).toBe(true);
    expect(wrapper.text()).toContain(
      '검색에 사용할 사용자 문서를 수집하고 최신 상태로 유지합니다.',
    );
    expect(wrapper.find('[data-testid="admin-ingest-action-hint"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('문서 데이터 관리');
    expect(wrapper.text()).toContain('사용자 현황');
    expect(wrapper.text()).toContain('피드백');
    expect(wrapper.text()).toContain('동기화 이력');
    expect(wrapper.get('[data-testid="admin-operations-heading"]').classes()).toEqual(
      expect.arrayContaining(['text-[1.25rem]', 'font-semibold', 'text-overlay-dark-80']),
    );
    expect(wrapper.get('[data-testid="admin-profile-name"]').text()).toBe('관 관리자');
    // 프로필 영역은 이메일 대신 Admin Mode 라벨을 표시한다 (74bb923 UI 변경 반영)
    expect(wrapper.text()).toContain('Admin Mode');
    expect(wrapper.get('[data-testid="admin-data-card-totalSpaces"]').text()).toContain('6');
    expect(wrapper.get('[data-testid="admin-data-card-totalPages"]').text()).toContain('2,847');
    expect(wrapper.get('[data-testid="admin-data-card-vectorDbSize"]').text()).toContain('1.2 GB');
    expect(wrapper.get('[data-testid="admin-data-card-totalChunks"]').text()).toContain('18,432');
    expect(wrapper.get('[data-testid="admin-last-sync-at"]').text()).toContain('06. 04.');
    expect(wrapper.get('[data-testid="admin-sync-row-sync-001"]').text()).toContain('완료');
    expect(wrapper.get('[data-testid="admin-sync-row-sync-002"]').text()).toContain('실패');
    expect(wrapper.get('[data-testid="admin-ingest-pipeline-card"]').text()).toContain(
      '새로고침하면 진행 상태가 초기화될 수 있습니다',
    );
    expect(
      wrapper.get('[data-testid="admin-start-ingest-button"]').attributes('aria-label'),
    ).toContain('데이터 모두 불러오기');
  });

  it('starts ingest directly when the operator clicks 데이터 불러오기', async () => {
    mockAdminBoardBase();
    mockedStartAdminIngestJob.mockResolvedValue({
      jobId: 'job-uuid-001',
      status: 'STARTED',
      startedAt: '2026-06-09T12:00:00+09:00',
    });

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();
    await wrapper.get('[data-testid="admin-start-ingest-button"]').trigger('click');
    await flushPromises();

    expect(mockedStartAdminIngestJob).toHaveBeenCalledTimes(1);
    expect(mockedStartAdminIngestJob).toHaveBeenCalledWith({ mode: 'full' });
  });

  it('opens the profile menu and logs out to the home route', async () => {
    mockAdminBoardBase();
    mockedLogout.mockResolvedValue(null);

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    await wrapper.get('[data-testid="admin-profile-menu-trigger"]').trigger('click');

    expect(wrapper.get('[data-testid="admin-profile-menu"]').text()).toContain('로그아웃');

    await wrapper.get('[data-testid="admin-profile-logout"]').trigger('click');
    await flushPromises();

    expect(mockedLogout).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('shows action hints while ingest is in progress then on completion', async () => {
    mockAdminBoardBase();
    const ingestDeferred = createDeferredPromise<{
      jobId: string;
      status: 'STARTED';
      startedAt: string;
    }>();

    mockedStartAdminIngestJob.mockReturnValue(ingestDeferred.promise);

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();
    await wrapper.get('[data-testid="admin-start-ingest-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="admin-start-ingest-button"]').attributes('disabled')).toBe(
      '',
    );

    ingestDeferred.resolve({
      jobId: 'job-uuid-011',
      status: 'STARTED',
      startedAt: '2026-06-09T12:00:00+09:00',
    });
    await flushPromises();

    expect(wrapper.get('[data-testid="admin-ingest-status-pill"]').text()).toContain('수집 준비');
  });

  it('changes the ingest CTA to 다시 시도 when the latest ingest job failed', async () => {
    mockAdminBoardBase();
    mockedStartAdminIngestJob.mockResolvedValueOnce({
      jobId: 'job-uuid-003',
      status: 'FAILED',
      startedAt: '2026-06-09T12:20:00+09:00',
    });

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();
    await wrapper.get('[data-testid="admin-start-ingest-button"]').trigger('click');
    await flushPromises();

    expect(
      wrapper.get('[data-testid="admin-start-ingest-button"]').attributes('aria-label'),
    ).toContain('다시 시도');
  });

  it('starts ingest without explicit key activation because /api/admin/ingest bundles it', async () => {
    mockAdminBoardBase();
    mockedStartAdminIngestJob.mockResolvedValue({
      jobId: 'job-uuid-002',
      status: 'COMPLETED',
      startedAt: '2026-06-09T12:10:00+09:00',
    });

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();
    await wrapper.get('[data-testid="admin-start-ingest-button"]').trigger('click');
    await flushPromises();
    await wrapper.get('[data-testid="admin-start-ingest-button"]').trigger('click');
    await flushPromises();

    expect(mockedStartAdminIngestJob).toHaveBeenCalledTimes(2);
  });

  it('shows an empty state when the admin sync history has no rows', async () => {
    mockAdminBoardBase();
    mockedGetAdminSyncHistory.mockResolvedValue({
      syncHistory: [],
    });

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-testid="admin-sync-empty"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('최근 동기화 이력이 없습니다');
  });

  it('renders the INLINE D ingest progress card with ETA and updates it on each polling tick', async () => {
    vi.useFakeTimers();
    mockAdminBoardBase();
    mockedStartAdminIngestJob.mockResolvedValue({
      jobId: 'job-uuid-010',
      status: 'STARTED',
      startedAt: '2026-06-09T12:00:00+09:00',
    });
    mockedGetAdminIngestStatus
      .mockResolvedValueOnce({
        jobId: 'job-uuid-010',
        status: 'STARTED',
        totalPages: 150,
        processedPages: 0,
        failedPages: 0,
        startedAt: '2026-06-09T12:00:00+09:00',
      })
      .mockResolvedValueOnce({
        jobId: 'job-uuid-010',
        status: 'IN_PROGRESS',
        totalPages: 150,
        processedPages: 60,
        failedPages: 1,
        startedAt: '2026-06-09T12:00:00+09:00',
      });

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();
    await wrapper.get('[data-testid="admin-start-ingest-button"]').trigger('click');
    await flushPromises();

    expect(wrapper.get('[data-testid="admin-ingest-pipeline-card"]').text()).toContain(
      '새로고침하면 진행 상태가 초기화될 수 있습니다',
    );

    await vi.advanceTimersByTimeAsync(3000);
    await flushPromises();

    expect(mockedGetAdminIngestStatus).toHaveBeenCalledWith('job-uuid-010');
    expect(wrapper.get('[data-testid="admin-ingest-status-pill"]').text()).toContain('수집 준비');
    expect(wrapper.get('[data-testid="admin-ingest-metric-elapsed"]').text()).not.toContain(
      '00:00',
    );

    await vi.advanceTimersByTimeAsync(3000);
    await flushPromises();

    expect(wrapper.get('[data-testid="admin-ingest-status-pill"]').text()).toContain('수집 중');
    expect(wrapper.get('[data-testid="admin-ingest-progress-percent"]').text()).toContain('40%');
    expect(wrapper.get('[data-testid="admin-ingest-metric-processed"]').text()).toContain(
      '60 / 150',
    );
    expect(wrapper.get('[data-testid="admin-ingest-metric-eta"]').text()).not.toContain('계산 중');
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
    const reloadSpy = vi.fn();
    const originalLocation = window.location;

    // jsdom의 location.reload는 configurable하지 않아 테스트에서 location 객체를 교체한다.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...originalLocation,
        reload: reloadSpy,
      },
    });
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

    expect(wrapper.find('[data-testid="admin-board-error"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="admin-board-error-home-button"]').text()).toContain(
      '홈으로 돌아가기',
    );

    await wrapper.get('[data-testid="admin-board-error"] button').trigger('click');
    await flushPromises();

    expect(reloadSpy).toHaveBeenCalledTimes(1);

    await wrapper.get('[data-testid="admin-board-error-home-button"]').trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });
});
