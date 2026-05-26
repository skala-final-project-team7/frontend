/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat SCR-500/510 출처 패널 통합 테스트.
 *           패널 진입, 출처 목록 metadata, hover preview, List/Graph placeholder 토글을 검증한다.
 * 작성일 : 2026-05-26
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-26, feature10 구현, 출처 패널 acceptance criteria 테스트 추가
 *   - 2026-05-26, feature10 UI 보정, 목록 행과 hover preview card 동작 검증 추가
 *   - 2026-05-26, feature10 UI 보정, preview affordance 유지와 새 채팅 초기화 검증 추가
 *   - 2026-05-26, feature10 UI 보정, URL action과 path hover를 preview card에만 제한
 *   - 2026-05-26, feature10 UI 보정, 기본 카드 구조를 보존한 preview 전용 hover scope 검증 추가
 *   - 2026-05-26, feature10 UI 보정, 공통 named hover scope와 팝오버 이동 영역 검증 추가
 *   - 2026-05-26, feature10 UI 보정, hover preview 카드의 본문 전용 표시 검증 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vitest 2.1.x, Vue Test Utils 2.4.x 기준
 * --------------------------------------------------
 */
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReferencePanel from '@/features/chat/ReferencePanel.vue';
import {
  mockConversations,
  mockCurrentUser,
  mockMessagesByConversationId,
  mockSources,
} from '@/mocks/data';
import ChatPage from '@/pages/ChatPage.vue';
import router from '@/router';

function createJsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
  });
}

function installFeature10FetchMock() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      if (requestUrl.includes('/api/confluence/pages/preview')) {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: 'Confluence 페이지 미리보기 조회 성공',
          data: {
            pageId: '12345',
            title: 'S3 트러블슈팅 가이드',
            spaceName: 'Cloud Control Center',
            authorName: 'Platform Team',
            updatedAt: '2026-04-15T18:30:00+09:00',
            breadcrumbs: ['Cloud Control Center', 'AWS', 'S3', 'S3 트러블슈팅 가이드'],
            pageUrl: 'https://confluence.example.com/pages/12345',
            bodyViewValue: '<p>S3 권한 오류는 IAM 정책을 확인합니다.</p>',
          },
        });
      }

      if (requestUrl.includes('/api/users/me')) {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '사용자 정보 조회 성공',
          data: mockCurrentUser,
        });
      }

      if (requestUrl.includes('/api/conversations/') && requestUrl.endsWith('/messages')) {
        return createJsonResponse({
          isSuccess: true,
          code: 200,
          message: '메시지 이력 조회 성공',
          data: {
            conversationId: 'conv-mock-001',
            messages: mockMessagesByConversationId['conv-mock-001'],
          },
        });
      }

      return createJsonResponse({
        isSuccess: true,
        code: 200,
        message: '대화 목록 조회 성공',
        data: {
          conversations: mockConversations,
          totalCount: mockConversations.length,
          page: 0,
          size: 20,
        },
      });
    }),
  );
}

async function flushAsyncUpdates() {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

describe('feature10 SCR-500, SCR-510 Reference panel', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-05-26T00:00:00+09:00'));
    setActivePinia(createPinia());
    installFeature10FetchMock();
    await router.push('/chat/conv-mock-001');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('opens the right reference panel from an assistant source button and collapses the sidebar', async () => {
    const wrapper = mount(ChatPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });
    await flushAsyncUpdates();

    await wrapper.get('[data-testid="sidebar-mascot-toggle"]').trigger('click');
    await vi.advanceTimersByTimeAsync(200);
    expect(wrapper.get('[data-testid="chat-sidebar"]').attributes('data-state')).toBe('expanded');

    await wrapper.get('[data-testid="source-button"]').trigger('click');
    await flushAsyncUpdates();

    expect(wrapper.get('[data-testid="chat-sidebar"]').attributes('data-state')).toBe('collapsed');
    expect(wrapper.get('[data-testid="reference-panel"]').attributes('aria-hidden')).toBe('false');
    expect(wrapper.get('[data-testid="reference-panel"]').text()).toContain('검색 결과 (1개)');
  });

  it('renders compact list metadata without stale badge or preview-only URL actions', async () => {
    const wrapper = mount(ReferencePanel, {
      props: {
        sources: mockSources,
        keyword: 'S3 권한 오류',
      },
    });
    await flushAsyncUpdates();

    const sourceItem = wrapper.get('[data-testid="reference-list-item"]');

    expect(sourceItem.classes()).toContain('border-b');
    expect(sourceItem.text()).toContain('S3 트러블슈팅 가이드');
    expect(sourceItem.text()).toContain('Cloud Control Center > AWS > S3 > S3 트러블슈팅 가이드');
    expect(sourceItem.text()).toContain('Platform Team');
    expect(sourceItem.text()).toContain('2026.04.15');
    expect(sourceItem.text()).not.toContain('오래된 문서');
    expect(sourceItem.find('[data-testid="reference-stale-badge"]').exists()).toBe(false);
    expect(sourceItem.find('[data-testid="reference-source-icon"]').exists()).toBe(true);
    expect(sourceItem.find('[data-testid="reference-author-icon"]').exists()).toBe(true);
    expect(sourceItem.find('[data-testid="reference-date-icon"]').exists()).toBe(true);
    expect(sourceItem.findAll('mark').some((mark) => mark.text() === 'S3')).toBe(true);
    expect(sourceItem.find('[data-testid="reference-copy-url"]').exists()).toBe(false);
    expect(sourceItem.find('[data-testid="reference-open-url"]').exists()).toBe(false);
    expect(sourceItem.find('[data-testid="preview-page-card-actions"]').exists()).toBe(false);
    expect(sourceItem.find('[data-testid="preview-page-card-breadcrumbs"]').exists()).toBe(false);
  });

  it('shows the existing shadowed PreviewPageCard with its hover affordances beside a source row', async () => {
    const wrapper = mount(ReferencePanel, {
      props: {
        sources: mockSources,
        keyword: 'S3',
      },
    });
    await flushAsyncUpdates();

    expect(wrapper.find('[data-testid="reference-hover-preview"]').exists()).toBe(false);

    await wrapper.get('[data-testid="reference-list-item"]').trigger('mouseenter');

    const preview = wrapper.get('[data-testid="reference-hover-preview"]');
    const previewComponent = preview.getComponent({ name: 'PreviewPageCard' });
    const previewCard = preview.get('[data-testid="preview-page-card"]');
    const previewActions = preview.get('[data-testid="preview-page-card-actions"]');
    const previewBreadcrumbs = preview.get('[data-testid="preview-page-card-breadcrumbs"]');

    expect(preview.classes()).toEqual(expect.arrayContaining(['absolute', 'right-full', 'pr-5']));
    expect(preview.classes()).not.toContain('mr-5');
    expect(previewComponent.props('isolateHover')).toBeUndefined();
    expect(previewComponent.classes()).toContain('group/preview-page');
    expect(previewCard.classes()).toContain('shadow-floating');
    expect(previewActions.classes()).toContain('group-hover/preview-page:opacity-100');
    expect(previewActions.classes()).not.toContain('group-hover:opacity-100');
    expect(previewBreadcrumbs.classes()).toContain('group-hover/preview-page:opacity-100');
    expect(previewBreadcrumbs.classes()).not.toContain('group-hover:opacity-100');
    expect(preview.find('[data-testid="preview-page-card-copy"]').exists()).toBe(true);
    expect(preview.find('[data-testid="preview-page-card-external"]').exists()).toBe(true);
    expect(preview.text()).not.toContain('Platform Team');
    expect(preview.text()).not.toContain('2026.04.15 게시됨');
    expect(preview.get('[data-testid="preview-page-card-body"]').classes()).not.toContain('mt-5');

    await wrapper.get('[data-testid="reference-list-item"]').trigger('mouseleave');

    expect(wrapper.find('[data-testid="reference-hover-preview"]').exists()).toBe(false);
  });

  it('closes the prior conversation reference panel when starting a new chat', async () => {
    const wrapper = mount(ChatPage, {
      global: {
        plugins: [createPinia(), router],
      },
    });
    await flushAsyncUpdates();

    await wrapper.get('[data-testid="source-button"]').trigger('click');
    await flushAsyncUpdates();

    expect(wrapper.get('[data-testid="reference-panel"]').attributes('aria-hidden')).toBe('false');

    await wrapper.findAll('[data-testid="collapsed-sidebar-action"]')[0].trigger('click');
    await flushAsyncUpdates();

    expect(router.currentRoute.value.fullPath).toBe('/chat');
    expect(wrapper.get('[data-testid="reference-panel"]').attributes('aria-hidden')).toBe('true');
  });

  it('switches between the source list and graph placeholder without rendering a graph early', async () => {
    const wrapper = mount(ReferencePanel, {
      props: {
        sources: mockSources,
        keyword: '',
      },
    });

    expect(wrapper.find('[data-testid="reference-list-item"]').exists()).toBe(true);

    await wrapper.get('[data-testid="reference-graph-tab"]').trigger('click');

    expect(wrapper.find('[data-testid="reference-list-item"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="reference-graph-placeholder"]').text()).toContain(
      '그래프 뷰는 준비 중입니다',
    );

    await wrapper.get('[data-testid="reference-list-tab"]').trigger('click');

    expect(wrapper.find('[data-testid="reference-list-item"]').exists()).toBe(true);
  });
});
