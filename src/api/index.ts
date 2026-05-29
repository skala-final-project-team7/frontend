/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend API 호출 레이어의 진입점 정의.
 *           컴포넌트와 store가 네트워크 호출 세부 구현에 직접 의존하지 않도록 API 함수를 제공한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature2 구현, API 레이어 경계 상수 추가
 *   - 2026-05-18, feature5 구현, conversations/messages/chat API 함수 골격 추가
 *   - 2026-05-18, feature6 보강, Confluence 페이지 미리보기 API 함수 추가
 *   - 2026-05-22, feature9 보강, SSE chat API에 AbortSignal 전달 경로 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import { apiRequest, streamChatRequest } from './client';
import type {
  ChatQuestionRequest,
  ConfluencePagePreview,
  ConversationList,
  ConversationMessages,
  CreateConversationResponse,
  CurrentUser,
  DeleteConversationResponse,
  Feedback,
  ListConversationsParams,
  SubmitFeedbackRequest,
  UpdateConversationTitleRequest,
  UpdateConversationTitleResponse,
} from '@/types/api';

export const API_LAYER_BOUNDARY = {
  allowedNetworkLayer: 'src/api',
  directFetchAllowedOutsideApi: false,
} as const;

/**
 * 현재 로그인한 사용자 정보를 조회한다.
 *
 * @returns 사용자 ID, 이름, 이메일, 권한, 프로필 이미지, 마지막 로그인 시각
 */
export function getCurrentUser(): Promise<CurrentUser> {
  return apiRequest<CurrentUser>('/api/users/me');
}

/**
 * 새 대화를 생성한다.
 *
 * @returns 생성된 대화 ID, 제목, 생성 시각
 */
export function createConversation(): Promise<CreateConversationResponse> {
  return apiRequest<CreateConversationResponse>('/api/conversations', {
    method: 'POST',
  });
}

/**
 * 사이드바에 표시할 대화 목록을 조회한다.
 *
 * @param params page, size pagination query
 * @returns 대화 목록과 pagination metadata
 */
export function listConversations(params: ListConversationsParams = {}): Promise<ConversationList> {
  return apiRequest<ConversationList>('/api/conversations', {
    query: params,
  });
}

/**
 * 특정 대화의 메시지 이력을 조회한다.
 *
 * @param conversationId 대화 ID
 * @returns 대화 ID와 메시지 배열
 */
export function getConversationMessages(conversationId: string): Promise<ConversationMessages> {
  return apiRequest<ConversationMessages>(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
}

/**
 * 특정 대화의 제목을 수정한다.
 *
 * @param conversationId 대화 ID
 * @param request 수정할 title payload
 * @returns 수정된 대화 ID, 제목, 수정 시각
 */
export function updateConversationTitle(
  conversationId: string,
  request: UpdateConversationTitleRequest,
): Promise<UpdateConversationTitleResponse> {
  return apiRequest<UpdateConversationTitleResponse>(
    `/api/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: 'PATCH',
      body: request,
    },
  );
}

/**
 * 특정 대화를 삭제한다.
 *
 * @param conversationId 대화 ID
 * @returns Common Response wrapper의 null data
 */
export function deleteConversation(conversationId: string): Promise<DeleteConversationResponse> {
  return apiRequest<DeleteConversationResponse>(
    `/api/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: 'DELETE',
    },
  );
}

/**
 * 답변 메시지에 대한 사용자 피드백을 등록한다.
 *
 * @param messageId 답변 메시지 ID
 * @param request rating과 선택 comment
 * @returns 생성된 feedback metadata
 */
export function submitMessageFeedback(
  messageId: string,
  request: SubmitFeedbackRequest,
): Promise<Feedback> {
  return apiRequest<Feedback>(`/api/messages/${encodeURIComponent(messageId)}/feedback`, {
    method: 'POST',
    body: request,
  });
}

/**
 * Confluence 원본 페이지 hover preview에 사용할 HTML 미리보기를 조회한다.
 *
 * @param pageId Confluence page ID
 * @returns BFF가 Confluence body.view.value를 포함해 반환한 preview payload
 */
export function getConfluencePagePreview(pageId: string): Promise<ConfluencePagePreview> {
  return apiRequest<ConfluencePagePreview>('/api/confluence/pages/preview', {
    query: {
      pageId,
    },
  });
}

/**
 * 사용자 질문을 SSE chat endpoint로 전송한다.
 *
 * @param conversationId 대화 ID
 * @param request 사용자 질문 payload
 * @param signal 스트림 취소에 사용할 AbortSignal
 * @returns wrapper를 적용하지 않은 text/event-stream Response
 */
export function streamConversationChat(
  conversationId: string,
  request: ChatQuestionRequest,
  signal?: AbortSignal,
): Promise<Response> {
  return streamChatRequest(conversationId, request, signal);
}

export { ApiClientError, apiRequest, streamChatRequest } from './client';
