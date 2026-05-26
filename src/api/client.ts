/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend API 레이어의 fetch wrapper 구현.
 *           Common Response wrapper 기반 JSON API와 wrapper 미적용 SSE 스트림을 분리한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature5 구현, apiRequest 및 streamRequest 추가
 *   - 2026-05-22, feature9 보강, SSE chat request에 AbortSignal 전달 추가
 *   - 2026-05-26, API 계약 정합성 수정, Common Response errorCode 예외 전달 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import type { ApiResponse, ChatQuestionRequest } from '@/types/api';

type QueryValue = string | number | boolean | null | undefined;

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: HeadersInit;
};

/**
 * Common Response wrapper를 사용하는 JSON API를 호출하고 성공 응답의 data를 반환한다.
 *
 * @param path /api로 시작하는 API 경로
 * @param options HTTP method, query, JSON body, headers
 * @returns wrapper 내부 data
 * @throws ApiClientError HTTP 실패 또는 Common Response 실패 응답 수신 시
 */
export async function apiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TData> {
  const response = await fetch(buildUrl(path, options.query), {
    method: options.method ?? 'GET',
    headers: buildJsonHeaders(options.headers, options.body),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const responseBody = (await response.json()) as ApiResponse<TData>;

  if (!response.ok || !responseBody.isSuccess) {
    const errorCode = responseBody.isSuccess ? 'HTTP_ERROR' : responseBody.errorCode;

    throw new ApiClientError(responseBody.message, responseBody.code, errorCode, response.status);
  }

  return responseBody.data;
}

/**
 * SSE chat endpoint를 호출하고 Response 스트림을 그대로 반환한다.
 *
 * @param conversationId 대화 ID
 * @param request 사용자 질문 payload
 * @param signal 스트림 취소에 사용할 AbortSignal
 * @returns text/event-stream Response
 */
export async function streamChatRequest(
  conversationId: string,
  request: ChatQuestionRequest,
  signal?: AbortSignal,
): Promise<Response> {
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  };

  if (signal) {
    requestInit.signal = signal;
  }

  return fetch(`/api/conversations/${encodeURIComponent(conversationId)}/chat`, requestInit);
}

export class ApiClientError extends Error {
  public readonly code: number;

  public readonly errorCode: string;

  public readonly status: number;

  constructor(message: string, code: number, errorCode: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.errorCode = errorCode;
    this.status = status;
  }
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  if (!query) {
    return path;
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();

  return queryString ? `${path}?${queryString}` : path;
}

function buildJsonHeaders(headers: HeadersInit | undefined, body: unknown): HeadersInit {
  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    baseHeaders['Content-Type'] = 'application/json';
  }

  return {
    ...baseHeaders,
    ...headers,
  };
}
