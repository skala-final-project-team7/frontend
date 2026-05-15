import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { ApiClientError, requestJson } from '@/api/client';
import { server } from '@/mocks/server';

describe('requestJson', () => {
  it('returns data from a successful wrapper response', async () => {
    server.use(
      http.get('/api/test-success', () =>
        HttpResponse.json({
          isSuccess: true,
          code: 200,
          message: 'ok',
          data: { value: 'wrapped' },
        }),
      ),
    );

    await expect(requestJson<{ value: string }>('/api/test-success')).resolves.toEqual({
      value: 'wrapped',
    });
  });

  it('throws ApiClientError for a failed wrapper response', async () => {
    server.use(
      http.get('/api/test-error', () =>
        HttpResponse.json(
          {
            isSuccess: false,
            code: 404,
            message: 'not found',
            data: null,
          },
          { status: 404 },
        ),
      ),
    );

    await expect(requestJson('/api/test-error')).rejects.toBeInstanceOf(ApiClientError);
  });
});
