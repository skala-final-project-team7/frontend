import type { ApiResponse } from '@/types/api';

export class ApiClientError extends Error {
  readonly code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

/**
 * Common Response wrapper를 처리하는 fetch 기반 API client.
 *
 * @param path BFF API path
 * @param options fetch option과 JSON body
 * @returns Wrapper 내부 data
 * @throws ApiClientError HTTP 실패 또는 wrapper 실패 응답 시
 */
export async function requestJson<TData>(
  path: string,
  options: RequestOptions = {},
): Promise<TData> {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = (await response.json()) as ApiResponse<TData>;

  if (!response.ok || !payload.isSuccess) {
    throw new ApiClientError(payload.message || 'API 요청에 실패했습니다.', payload.code);
  }

  return payload.data;
}
