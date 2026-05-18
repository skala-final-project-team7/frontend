import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { listConversations } from '@/api';
import { mockServer } from '@/mocks/server';
import { mockWorker } from '@/mocks/browser';
import { isMockApiEnabled } from '@/mocks';
import { mockHomeConfluencePages } from '@/mocks/data';

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
      messageCount: 4,
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
    });
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

  it('mocks GET /api/confluence/pages/preview?page_id={pageId} with sanitized-ready HTML', async () => {
    const response = await fetch('http://localhost/api/confluence/pages/preview?page_id=12345');
    const body = await response.json();

    expect(body).toMatchObject({
      isSuccess: true,
      code: 200,
      data: {
        pageId: '12345',
        title: 'S3 트러블슈팅 가이드',
        breadcrumbs: ['Cloud Control Center', 'AWS', 'S3', 'S3 트러블슈팅 가이드'],
        pageUrl: 'https://confluence.example.com/pages/12345',
      },
    });
    expect(body.data.bodyViewValue).toContain('<h1>S3 트러블슈팅 가이드</h1>');
    expect(body.data.bodyViewValue).toContain('IAM 정책');
  });

  it('returns a Common Response error for unknown Confluence preview pages', async () => {
    const response = await fetch('http://localhost/api/confluence/pages/preview?page_id=unknown');
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      isSuccess: false,
      code: 404,
      message: 'Confluence 페이지 미리보기를 찾을 수 없습니다',
      data: null,
    });
  });

  it('provides one or two Confluence page seeds for the Chat main screen preview', () => {
    expect(mockHomeConfluencePages.length).toBeGreaterThanOrEqual(1);
    expect(mockHomeConfluencePages.length).toBeLessThanOrEqual(2);
    expect(mockHomeConfluencePages[0]).toMatchObject({
      pageId: '12345',
      title: 'S3 트러블슈팅 가이드',
      breadcrumbs: ['Cloud Control Center', 'AWS', 'S3', 'S3 트러블슈팅 가이드'],
      pageUrl: 'https://confluence.example.com/pages/12345',
    });
  });

  it('keeps TODO(MOCK) markers on each mock endpoint handler', () => {
    const handlersSource = readFileSync(join(process.cwd(), 'src/mocks/handlers.ts'), 'utf8');

    expect(handlersSource).toContain('TODO(MOCK): GET /api/conversations');
    expect(handlersSource).toContain(
      'TODO(MOCK): GET /api/conversations/{conversationId}/messages',
    );
    expect(handlersSource).toContain('TODO(MOCK): POST /api/conversations/{conversationId}/chat');
    expect(handlersSource).toContain(
      'TODO(MOCK): GET /api/confluence/pages/preview?page_id={pageId}',
    );
  });
});
