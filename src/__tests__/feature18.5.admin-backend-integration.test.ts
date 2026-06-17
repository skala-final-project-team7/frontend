import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminEntryPage from '@/pages/AdminEntryPage.vue';
import router from '@/router';

function stubLocalStorage(values: Record<string, string>) {
  const storage = {
    getItem: vi.fn((key: string) => values[key] ?? null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    key: vi.fn(),
    length: Object.keys(values).length,
  };

  Object.defineProperty(window, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

const adminUserResponse = {
  isSuccess: true,
  code: 200,
  message: '사용자 정보 조회 성공',
  data: {
    userId: '712020:admin-user',
    name: '관 관리자',
    email: 'admin@company.com',
    role: 'ADMIN',
    profileImageUrl: 'https://example.com/admin.png',
    lastLoginAt: '2026-06-16T08:30:00+09:00',
  },
} as const;

function expectJsonAuthHeaders(init?: RequestInit) {
  expect(init?.headers).toMatchObject({
    Accept: 'application/json',
    Authorization: 'Bearer admin-access-token',
  });
}

describe('feature18.5 Admin backend integration regression', () => {
  beforeEach(async () => {
    stubLocalStorage({ accessToken: 'admin-access-token' });
    await router.push('/admin');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the admin sections from real API functions and renders each tab with live response shapes', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      expectJsonAuthHeaders(init);

      if (requestUrl === '/api/users/me' && method === 'GET') {
        return jsonResponse(adminUserResponse);
      }

      if (requestUrl === '/api/admin/data' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '데이터 현황 조회 성공',
          data: {
            totalSpaces: 5,
            totalPages: 1230,
            vectorDbSize: '2.3 GB',
            totalChunks: 8940,
            lastSyncAt: '2026-06-16T07:00:00+09:00',
          },
        });
      }

      if (requestUrl === '/api/admin/sync' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '동기화 이력 조회 성공',
          data: {
            syncHistory: [
              {
                syncId: 'sync-uuid-001',
                status: 'COMPLETED',
                updatedPages: 12,
                deletedPages: 1,
                duration: 45,
                completedAt: '2026-06-16T07:00:00+09:00',
              },
              {
                syncId: 'sync-uuid-002',
                status: 'FAILED',
                updatedPages: 4,
                deletedPages: 0,
                duration: 21,
                completedAt: '2026-06-15T10:00:00+09:00',
              },
            ],
          },
        });
      }

      if (requestUrl === '/api/admin/stats' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '서비스 통계 조회 성공',
          data: {
            dailyQueryCount: 142,
            avgResponseTime: 3.2,
            totalConversations: 856,
            hourlyAccessTrend: [
              { date: '2026-06-15', hour: 9, count: 23 },
              { date: '2026-06-16', hour: 10, count: 45 },
            ],
          },
        });
      }

      if (requestUrl === '/api/admin/users?page=0&size=12' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 현황 조회 성공',
          data: {
            totalUsers: 48,
            dailyActiveUsers: 12,
            users: [
              {
                userId: '712020:user-001',
                name: '이다연',
                accessibleSpaceCount: 5,
                accessiblePageCount: 320,
                accessibleAttachmentCount: 48,
                conversationCount: 35,
                lastAccessAt: '2026-06-16T08:00:00+09:00',
              },
            ],
          },
        });
      }

      if (requestUrl === '/api/admin/feedback?page=0&size=5' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '피드백 현황 조회 성공',
          data: {
            totalCount: 320,
            likeCount: 256,
            dislikeCount: 64,
            positiveRatio: 0.8,
            trend: [
              { date: '2026-06-15', likeCount: 40, dislikeCount: 8 },
              { date: '2026-06-16', likeCount: 52, dislikeCount: 11 },
            ],
            negativeFeedbacks: [
              {
                feedbackId: 'fb-uuid-101',
                messageId: 'msg-uuid-200',
                comment: '출처가 질문과 관련 없었어요',
                question: 'S3 권한 오류 원인이 뭐야?',
                answer: 'IAM 정책을 확인하세요...',
                createdAt: '2026-06-16T09:30:00+09:00',
              },
            ],
            page: 0,
            size: 5,
          },
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    expect(wrapper.get('[data-testid="admin-page"]').text()).toContain('문서 데이터 관리');
    expect(wrapper.get('[data-testid="admin-data-card-totalSpaces"]').text()).toContain('5');
    expect(wrapper.get('[data-testid="admin-sync-row-sync-uuid-001"]').text()).toContain('완료');

    const navButtons = wrapper.findAll('[data-testid="admin-nav"] button');

    await navButtons.find((button) => button.text().includes('사용자 현황'))?.trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="admin-dashboard-section"]').text()).toContain('5 / 320');
    expect(wrapper.get('[data-testid="admin-stats-card-dailyQueryCount"]').text()).toContain('142');

    await navButtons.find((button) => button.text().includes('피드백'))?.trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="admin-feedback-section"]').text()).toContain('긍정92건');
    expect(wrapper.get('[data-testid="admin-feedback-section"]').text()).toContain('총 64건');
    expect(wrapper.get('[data-testid="admin-feedback-section"]').text()).toContain(
      '출처가 질문과 관련 없었어요',
    );

    await navButtons.find((button) => button.text().includes('동기화 이력'))?.trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="admin-sync-history-section"]').text()).toContain(
      '동기화 이력',
    );
    expect(wrapper.get('[data-testid="admin-sync-status-sync-uuid-002"]').text()).toContain('실패');
  });

  it('shows access denied when the BFF rejects admin board APIs with 403 even after the profile says ADMIN', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      expectJsonAuthHeaders(init);

      if (requestUrl === '/api/users/me' && method === 'GET') {
        return jsonResponse(adminUserResponse);
      }

      if (
        (requestUrl === '/api/admin/data' || requestUrl === '/api/admin/sync') &&
        method === 'GET'
      ) {
        return jsonResponse(
          {
            isSuccess: false,
            code: 403,
            errorCode: 'FORBIDDEN',
            message: '관리자 권한이 필요합니다.',
          },
          403,
        );
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    expect(wrapper.find('[data-testid="admin-board-error"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="admin-access-denied"]').text()).toContain(
      '관리자 API 접근이 거부되었습니다',
    );
  });

  it('keeps real API pagination queries aligned with the BFF contract for users and feedback', async () => {
    const requestUrls: string[] = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';
      requestUrls.push(`${method} ${requestUrl}`);

      expectJsonAuthHeaders(init);

      if (requestUrl === '/api/users/me' && method === 'GET') {
        return jsonResponse(adminUserResponse);
      }

      if (requestUrl === '/api/admin/data' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '데이터 현황 조회 성공',
          data: {
            totalSpaces: 1,
            totalPages: 10,
            vectorDbSize: '0.2 GB',
            totalChunks: 15,
            lastSyncAt: '2026-06-16T07:00:00+09:00',
          },
        });
      }

      if (requestUrl === '/api/admin/sync' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '동기화 이력 조회 성공',
          data: { syncHistory: [] },
        });
      }

      if (requestUrl === '/api/admin/stats' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '서비스 통계 조회 성공',
          data: {
            dailyQueryCount: 12,
            avgResponseTime: 1.8,
            totalConversations: 32,
            hourlyAccessTrend: [
              { hour: 9, count: 4 },
              { hour: 10, count: 7 },
            ],
          },
        });
      }

      if (requestUrl === '/api/admin/users?page=0&size=12' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 현황 조회 성공',
          data: {
            totalUsers: 13,
            dailyActiveUsers: 4,
            users: new Array(12).fill(null).map((_, index) => ({
              userId: `user-${index + 1}`,
              name: `사용자 ${index + 1}`,
              accessibleSpaceCount: 1,
              accessiblePageCount: 2,
              accessibleAttachmentCount: 0,
              conversationCount: index + 1,
              lastAccessAt: '2026-06-16T09:00:00+09:00',
            })),
          },
        });
      }

      if (requestUrl === '/api/admin/users?page=1&size=12' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 현황 조회 성공',
          data: {
            totalUsers: 13,
            dailyActiveUsers: 4,
            users: [
              {
                userId: 'user-13',
                name: '사용자 13',
                accessibleSpaceCount: 1,
                accessiblePageCount: 2,
                accessibleAttachmentCount: 0,
                conversationCount: 13,
                lastAccessAt: '2026-06-16T09:00:00+09:00',
              },
            ],
          },
        });
      }

      if (requestUrl === '/api/admin/feedback?page=0&size=5' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '피드백 현황 조회 성공',
          data: {
            totalCount: 6,
            likeCount: 9,
            dislikeCount: 6,
            positiveRatio: 0.6,
            trend: [{ date: '2026-06-16', likeCount: 9, dislikeCount: 6 }],
            negativeFeedbacks: new Array(5).fill(null).map((_, index) => ({
              feedbackId: `fb-${index + 1}`,
              messageId: `msg-${index + 1}`,
              comment: `comment ${index + 1}`,
              question: `question ${index + 1}`,
              answer: `answer ${index + 1}`,
              createdAt: '2026-06-16T09:30:00+09:00',
            })),
            page: 0,
            size: 5,
          },
        });
      }

      if (requestUrl === '/api/admin/feedback?page=1&size=5' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '피드백 현황 조회 성공',
          data: {
            totalCount: 6,
            likeCount: 9,
            dislikeCount: 6,
            positiveRatio: 0.6,
            trend: [{ date: '2026-06-16', likeCount: 9, dislikeCount: 6 }],
            negativeFeedbacks: [
              {
                feedbackId: 'fb-6',
                messageId: 'msg-6',
                comment: 'comment 6',
                question: 'question 6',
                answer: 'answer 6',
                createdAt: '2026-06-16T09:30:00+09:00',
              },
            ],
            page: 1,
            size: 5,
          },
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    const navButtons = wrapper.findAll('[data-testid="admin-nav"] button');
    await navButtons.find((button) => button.text().includes('사용자 현황'))?.trigger('click');
    await flushPromises();
    await wrapper.get('[data-testid="admin-users-pagination-next"]').trigger('click');
    await flushPromises();

    await navButtons.find((button) => button.text().includes('피드백'))?.trigger('click');
    await flushPromises();
    await wrapper.get('[data-testid="admin-feedback-pagination-next"]').trigger('click');
    await flushPromises();

    expect(requestUrls).toContain('GET /api/admin/users?page=0&size=12');
    expect(requestUrls).toContain('GET /api/admin/users?page=1&size=12');
    expect(requestUrls).toContain('GET /api/admin/feedback?page=0&size=5');
    expect(requestUrls).toContain('GET /api/admin/feedback?page=1&size=5');
    expect(requestUrls.some((url) => url.includes('/api/admin/stats?'))).toBe(false);
    expect(requestUrls.some((url) => url.includes('period='))).toBe(false);
    expect(requestUrls.some((url) => url.includes('from='))).toBe(false);
    expect(requestUrls.some((url) => url.includes('to='))).toBe(false);
  });

  it('renders empty and error states from live admin responses without breaking the page shell', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const requestUrl = String(input);
      const method = init?.method ?? 'GET';

      expectJsonAuthHeaders(init);

      if (requestUrl === '/api/users/me' && method === 'GET') {
        return jsonResponse(adminUserResponse);
      }

      if (requestUrl === '/api/admin/data' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '데이터 현황 조회 성공',
          data: {
            totalSpaces: 0,
            totalPages: 0,
            vectorDbSize: '0 B',
            totalChunks: 0,
            lastSyncAt: null,
          },
        });
      }

      if (requestUrl === '/api/admin/sync' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '동기화 이력 조회 성공',
          data: { syncHistory: [] },
        });
      }

      if (requestUrl === '/api/admin/stats' && method === 'GET') {
        return jsonResponse(
          {
            isSuccess: false,
            code: 500,
            errorCode: 'INTERNAL_SERVER_ERROR',
            message: '서버 오류',
          },
          500,
        );
      }

      if (requestUrl === '/api/admin/users?page=0&size=12' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 현황 조회 성공',
          data: {
            totalUsers: 0,
            dailyActiveUsers: 0,
            users: [],
          },
        });
      }

      if (requestUrl === '/api/admin/feedback?page=0&size=5' && method === 'GET') {
        return jsonResponse({
          isSuccess: true,
          code: 200,
          message: '피드백 현황 조회 성공',
          data: {
            totalCount: 0,
            likeCount: 0,
            dislikeCount: 0,
            positiveRatio: 0,
            trend: [],
            negativeFeedbacks: [],
            page: 0,
            size: 5,
          },
        });
      }

      return jsonResponse(
        {
          isSuccess: false,
          code: 404,
          errorCode: 'RESOURCE_NOT_FOUND',
          message: `Unexpected request: ${method} ${requestUrl}`,
        },
        404,
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const wrapper = mount(AdminEntryPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });

    await flushPromises();

    expect(wrapper.get('[data-testid="admin-sync-empty"]').text()).toContain(
      '최근 동기화 이력이 없습니다',
    );

    const navButtons = wrapper.findAll('[data-testid="admin-nav"] button');
    await navButtons.find((button) => button.text().includes('사용자 현황'))?.trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="admin-dashboard-error"]').text()).toContain('서버 오류');

    await navButtons.find((button) => button.text().includes('피드백'))?.trigger('click');
    await flushPromises();
    expect(wrapper.get('[data-testid="admin-feedback-empty"]').text()).toContain(
      '부정 피드백이 없습니다',
    );
  });
});
