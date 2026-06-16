import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createConversation, getCurrentUser, listConversations } from '@/api';
import { mockServer } from '@/mocks/server';
import { mockWorker } from '@/mocks/browser';
import { isMockApiEnabled } from '@/mocks';
import { mockCurrentUser, mockHomeConfluencePages } from '@/mocks/data';

describe('feature6 Chat mock API foundation', () => {
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  it('defines VITE_USE_MOCK=true as the only enabled mock API toggle', () => {
    expect(isMockApiEnabled({ VITE_USE_MOCK: 'true' })).toBe(true);
    expect(isMockApiEnabled({ VITE_USE_MOCK: 'false' })).toBe(false);
    expect(isMockApiEnabled({ VITE_USE_MOCK: undefined })).toBe(false);
  });

  it('configures an MSW browser worker and Node test server from shared handlers', () => {
    expect(typeof mockWorker.start).toBe('function');
    expect(typeof mockWorker.stop).toBe('function');
    expect(typeof mockServer.listen).toBe('function');
    expect(typeof mockServer.resetHandlers).toBe('function');
    expect(existsSync(join(process.cwd(), 'public/mockServiceWorker.js'))).toBe(true);
  });

  it('mocks GET /api/conversations with the Common Response wrapper', async () => {
    const conversationList = await listConversations({ page: 0, size: 20 });

    expect(conversationList).toMatchObject({
      totalCount: 2,
      page: 0,
      size: 20,
    });
    expect(conversationList.conversations).toHaveLength(2);
    expect(conversationList.conversations[0]).toMatchObject({
      conversationId: 'conv-mock-001',
      title: 'S3 권한 오류 해결 방법',
    });
  });

  it('mocks POST /api/conversations for creating a new chat session', async () => {
    const createdConversation = await createConversation();

    expect(createdConversation).toMatchObject({
      conversationId: 'conv-mock-003',
      title: '새 대화',
      createdAt: '2026-05-21T19:00:00+09:00',
    });
  });

  it('mocks GET /api/users/me with the current user profile', async () => {
    const currentUser = await getCurrentUser();

    expect(currentUser).toEqual(mockCurrentUser);
    expect(currentUser).toMatchObject({
      userId: 'user-001',
      name: '이다연',
      email: 'dayeon@example.com',
      role: mockCurrentUser.role,
      profileImageUrl: mockCurrentUser.profileImageUrl,
      lastLoginAt: '2026-05-20T18:00:00+09:00',
    });
  });

  it('mocks GET /api/conversations/{conversationId}/messages with user and assistant history', async () => {
    const response = await fetch('http://localhost/api/conversations/conv-mock-001/messages');
    const body = await response.json();

    expect(body).toMatchObject({
      isSuccess: true,
      code: 200,
      data: {
        conversationId: 'conv-mock-001',
        messages: [
          {
            role: 'user',
            content: '지난번 S3 버킷 권한 오류 때 어떻게 해결했어?',
          },
          {
            role: 'assistant',
            verificationResult: 'SUPPORTED',
          },
        ],
      },
    });
    expect(body.data.messages[1].sources[0]).toMatchObject({
      title: 'S3 트러블슈팅 가이드',
      pageId: '12345',
      sourceUpdatedAt: '2026-04-15T18:30:00+09:00',
    });
    expect(body.data.messages.map((message: { createdAt: string }) => message.createdAt)).toEqual([
      '2026-05-06T19:00:00+09:00',
      '2026-05-06T19:00:05+09:00',
    ]);
  });

  it('prepares POST /api/conversations/{conversationId}/chat as a mock SSE stream', async () => {
    const response = await fetch('http://localhost/api/conversations/conv-mock-001/chat', {
      method: 'POST',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'S3 권한 오류 해결 방법 알려줘',
      }),
    });
    const streamText = await response.text();

    expect(response.headers.get('Content-Type')).toContain('text/event-stream');
    expect(streamText).toContain('event: token');
    expect(streamText).toContain('event: sources');
    expect(streamText).toContain('event: verification');
    expect(streamText).toContain('event: done');
    expect(streamText).toContain('"messageId":"msg-mock-assistant-stream"');
  });

  it('mocks GET /api/confluence/pages/preview?pageId={pageId} with sanitized-ready HTML', async () => {
    const response = await fetch('http://localhost/api/confluence/pages/preview?pageId=12345');
    const body = await response.json();

    expect(body).toMatchObject({
      isSuccess: true,
      code: 200,
      data: {
        pageId: '12345',
        title: 'S3 트러블슈팅 가이드',
        updatedAt: '2026-04-15T18:30:00+09:00',
        breadcrumbs: ['Cloud Control Center', 'AWS', 'S3', 'S3 트러블슈팅 가이드'],
        pageUrl: 'https://yhlee0332.atlassian.net/wiki/spaces/ai27Rev1/pages/491961/FAQ+-',
      },
    });
    expect(body.data.bodyViewValue).toContain('<h1>S3 트러블슈팅 가이드</h1>');
    expect(body.data.bodyViewValue).toContain('IAM 정책');
  });

  it('returns a Common Response error for unknown Confluence preview pages', async () => {
    const response = await fetch('http://localhost/api/confluence/pages/preview?pageId=unknown');
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      isSuccess: false,
      code: 404,
      errorCode: 'RESOURCE_NOT_FOUND',
      message: 'Confluence 페이지 미리보기를 찾을 수 없습니다',
    });
  });

  it('provides one or two Confluence page seeds for the Chat main screen preview', () => {
    expect(mockHomeConfluencePages.length).toBeGreaterThanOrEqual(1);
    expect(mockHomeConfluencePages.length).toBeLessThanOrEqual(2);
    expect(mockHomeConfluencePages[0]).toMatchObject({
      pageId: 'home-preview-001',
      title: '자주 묻는 질문 (FAQ) - 인프라 운영',
      authorName: '이현서',
      breadcrumbs: ['Cloud Control Center', 'AWS', 'FAQ', '자주 묻는 질문 (FAQ) - 인프라 운영'],
      pageUrl: 'https://yhlee0332.atlassian.net/wiki/spaces/ai27Rev1/pages/491961/FAQ+-',
    });
  });

  it('feature11-connected chat handlers have MOCK comments without TODO prefix', () => {
    const handlersSource = readFileSync(join(process.cwd(), 'src/mocks/handlers.ts'), 'utf8');

    // feature11 실제 API 연결 완료 — TODO 제거, MOCK 유지 사유 기록
    expect(handlersSource).toContain('MOCK: GET /api/conversations — feature11');
    expect(handlersSource).toContain('MOCK: GET /api/conversations/search — feature11');
    expect(handlersSource).toContain('MOCK: POST /api/conversations — feature11');
    expect(handlersSource).toContain(
      'MOCK: GET /api/conversations/{conversationId}/messages — feature11',
    );
    expect(handlersSource).toContain(
      'MOCK: POST /api/conversations/{conversationId}/chat — feature11',
    );
    expect(handlersSource).toContain(
      'MOCK: GET /api/confluence/pages/preview?pageId={pageId} — feature11',
    );

    // Chat 엔드포인트에 TODO(MOCK) 마커가 남아 있으면 안 된다
    expect(handlersSource).not.toContain('TODO(MOCK): GET /api/conversations\n');
    expect(handlersSource).not.toContain('TODO(MOCK): GET /api/conversations/search\n');
    expect(handlersSource).not.toContain('TODO(MOCK): POST /api/conversations\n');
    expect(handlersSource).not.toContain(
      'TODO(MOCK): GET /api/conversations/{conversationId}/messages\n',
    );
    expect(handlersSource).not.toContain(
      'TODO(MOCK): POST /api/conversations/{conversationId}/chat\n',
    );
    expect(handlersSource).not.toContain(
      'TODO(MOCK): GET /api/confluence/pages/preview?pageId={pageId}\n',
    );
  });

  it('auth endpoints use MOCK markers with explicit retention reasons after feature18.5', () => {
    const handlersSource = readFileSync(join(process.cwd(), 'src/mocks/handlers.ts'), 'utf8');

    expect(handlersSource).toContain('MOCK: POST /api/auth/logout');
    expect(handlersSource).toContain('MOCK: GET /api/users/me');
    expect(handlersSource).not.toContain('TODO(MOCK): POST /api/auth/logout');
    expect(handlersSource).not.toContain('TODO(MOCK): GET /api/users/me');
  });
});
