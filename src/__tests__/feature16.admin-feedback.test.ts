import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminEntryPage from '@/pages/AdminEntryPage.vue';
import router from '@/router';
import {
  activateAdminKey,
  getAdminDataOverview,
  getAdminFeedback,
  getAdminIngestStatus,
  getAdminSyncHistory,
  getCurrentUser,
  startAdminIngestJob,
} from '@/api';
import type { AdminFeedbackResponse } from '@/types/api';

vi.mock('@/api', () => ({
  activateAdminKey: vi.fn(),
  getAdminDataOverview: vi.fn(),
  getAdminFeedback: vi.fn(),
  getAdminIngestStatus: vi.fn(),
  getAdminStats: vi.fn(),
  getAdminSyncHistory: vi.fn(),
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
const mockedGetAdminFeedback = vi.mocked(getAdminFeedback);

const mockFeedback: AdminFeedbackResponse = {
  totalCount: 359,
  likeCount: 312,
  dislikeCount: 47,
  positiveRatio: 0.87,
  trend: [
    { date: '2026-05-19', likeCount: 40, dislikeCount: 8 },
    { date: '2026-05-20', likeCount: 52, dislikeCount: 11 },
    { date: '2026-05-21', likeCount: 31, dislikeCount: 4 },
  ],
  negativeFeedbacks: [
    {
      feedbackId: 'fb-uuid-101',
      messageId: 'msg-uuid-200',
      comment: '출처가 질문과 관련 없었어요',
      question: 'S3 권한 오류 원인이 뭐야?',
      answer: 'IAM 정책을 확인하세요...',
      createdAt: '2026-06-04T10:24:00+09:00',
    },
    {
      feedbackId: 'fb-uuid-102',
      messageId: 'msg-uuid-201',
      comment: '답변이 너무 길어요',
      question: '이 문서의 작성 방법은 어떻게 되나요?',
      answer: '해당 문서는 Confluence의 CPC 스페이스에서 관리됩니다.',
      createdAt: '2026-06-03T22:24:00+09:00',
    },
  ],
  page: 0,
  size: 5,
};

describe('feature16 Admin feedback (SCR-820)', () => {
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

  async function mountAndNavigateToFeedback() {
    const wrapper = mount(AdminEntryPage, {
      global: { plugins: [createPinia(), router] },
    });
    await flushPromises();

    const feedbackBtn = wrapper
      .findAll('[data-testid="admin-nav"] button')
      .find((b) => b.text().includes('피드백'));
    await feedbackBtn!.trigger('click');
    await flushPromises();
    return wrapper;
  }

  it('connects /admin/feedback to AdminEntryPage', () => {
    const route = router.getRoutes().find((r) => r.path === '/admin/feedback');
    expect(route?.components?.default).toBe(AdminEntryPage);
  });

  it('calls getAdminFeedback when 피드백 tab is activated', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockResolvedValue(mockFeedback);

    await mountAndNavigateToFeedback();

    expect(mockedGetAdminFeedback).toHaveBeenCalledTimes(1);
  });

  it('renders 긍정/부정 비율 card with likeCount, dislikeCount, positiveRatio', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockResolvedValue(mockFeedback);

    const wrapper = await mountAndNavigateToFeedback();

    expect(wrapper.find('[data-testid="admin-feedback-section"]').exists()).toBe(true);
    const ratioCard = wrapper.get('[data-testid="admin-feedback-ratio-card"]');
    expect(ratioCard.text()).toContain('312');
    expect(ratioCard.text()).toContain('47');
    expect(ratioCard.text()).toContain('87%');
    expect(ratioCard.text()).toContain('13%');
  });

  it('renders the feedback trend chart with one bar per trend date', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockResolvedValue(mockFeedback);

    const wrapper = await mountAndNavigateToFeedback();

    expect(wrapper.find('[data-testid="admin-feedback-trend-chart"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid^="admin-feedback-trend-bar-"]')).toHaveLength(
      mockFeedback.trend.length,
    );
    expect(wrapper.get('[data-testid="admin-feedback-trend-chart"]').text()).toContain('05-19');
  });

  it('switches 기간 탭(7일/14일/30일) UI state only, without re-calling the API', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockResolvedValue(mockFeedback);

    const wrapper = await mountAndNavigateToFeedback();

    expect(
      wrapper.find('[data-testid="admin-feedback-period-tab-7d"]').attributes('aria-selected'),
    ).toBe('true');

    await wrapper.find('[data-testid="admin-feedback-period-tab-14d"]').trigger('click');

    expect(
      wrapper.find('[data-testid="admin-feedback-period-tab-14d"]').attributes('aria-selected'),
    ).toBe('true');
    expect(
      wrapper.find('[data-testid="admin-feedback-period-tab-7d"]').attributes('aria-selected'),
    ).toBe('false');

    await wrapper.find('[data-testid="admin-feedback-period-tab-30d"]').trigger('click');

    expect(
      wrapper.find('[data-testid="admin-feedback-period-tab-30d"]').attributes('aria-selected'),
    ).toBe('true');

    // query parameter(from/to)가 미확정이므로 feedback API 재호출 없음 — mock 격리
    expect(mockedGetAdminFeedback).toHaveBeenCalledTimes(1);
  });

  it('renders negative feedback cards with 질문/답변/comment/createdAt and total count', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockResolvedValue(mockFeedback);

    const wrapper = await mountAndNavigateToFeedback();

    // 총 건수는 dislikeCount 기준으로 표시한다
    expect(wrapper.get('[data-testid="admin-feedback-negative-total"]').text()).toContain('47');

    const firstCard = wrapper.get('[data-testid="admin-feedback-card-fb-uuid-101"]');
    expect(firstCard.text()).toContain('질문');
    expect(firstCard.text()).toContain('S3 권한 오류 원인이 뭐야?');
    expect(firstCard.text()).toContain('답변');
    expect(firstCard.text()).toContain('IAM 정책을 확인하세요...');
    expect(firstCard.text()).toContain('출처가 질문과 관련 없었어요');
    // createdAt 표시 (월/일 + 시각)
    expect(firstCard.text()).toMatch(/06.*04/);

    expect(wrapper.find('[data-testid="admin-feedback-card-fb-uuid-102"]').exists()).toBe(true);
  });

  it('does not render internal identifiers (feedbackId/messageId) in feedback cards', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockResolvedValue(mockFeedback);

    const wrapper = await mountAndNavigateToFeedback();

    const cardText = wrapper.get('[data-testid="admin-feedback-card-fb-uuid-101"]').text();
    expect(cardText).not.toContain('fb-uuid-101');
    expect(cardText).not.toContain('msg-uuid-200');
  });

  it('shows empty state when there is no negative feedback', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockResolvedValue({
      ...mockFeedback,
      dislikeCount: 0,
      negativeFeedbacks: [],
    });

    const wrapper = await mountAndNavigateToFeedback();

    expect(wrapper.find('[data-testid="admin-feedback-empty"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-testid^="admin-feedback-card-"]')).toHaveLength(0);
  });

  it('shows error state when getAdminFeedback fails, retries on button click', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockRejectedValueOnce(new Error('서버 오류'));

    const wrapper = await mountAndNavigateToFeedback();

    expect(wrapper.find('[data-testid="admin-feedback-error"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-feedback-error"]').text()).toContain('서버 오류');

    mockedGetAdminFeedback.mockResolvedValue(mockFeedback);
    await wrapper.find('[data-testid="admin-feedback-error"] button').trigger('click');
    await flushPromises();

    expect(mockedGetAdminFeedback).toHaveBeenCalledTimes(2);
    expect(wrapper.find('[data-testid="admin-feedback-section"]').exists()).toBe(true);
  });

  it('paginates negative feedbacks by dislikeCount and requests the next page', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockResolvedValue(mockFeedback);

    const wrapper = await mountAndNavigateToFeedback();

    expect(mockedGetAdminFeedback).toHaveBeenCalledWith({ page: 0, size: 5 });

    // dislikeCount 47, size 5 → 10 페이지
    const pagination = wrapper.get('[data-testid="admin-feedback-pagination"]');
    expect(pagination.text()).toContain('1 / 10 페이지');

    await wrapper.get('[data-testid="admin-feedback-pagination-next"]').trigger('click');
    await flushPromises();

    expect(mockedGetAdminFeedback).toHaveBeenCalledWith({ page: 1, size: 5 });
    expect(pagination.text()).toContain('2 / 10 페이지');
  });

  it('disables the prev button on the first page', async () => {
    mockAdminBoardBase();
    mockedGetAdminFeedback.mockResolvedValue(mockFeedback);

    const wrapper = await mountAndNavigateToFeedback();

    expect(
      wrapper.get('[data-testid="admin-feedback-pagination-prev"]').attributes('disabled'),
    ).toBeDefined();
  });
});
