/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Frontend API 응답과 Chat 도메인 타입 정의.
 *           docs/api-spec.md의 Common Response wrapper와 SSE 이벤트 계약을 표현한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature2 구현, API 타입 모듈 골격 추가
 *   - 2026-05-18, feature5 구현, Common Response 및 Chat API 타입 추가
 *   - 2026-05-18, feature6 보강, Confluence 페이지 미리보기 타입 추가
 *   - 2026-05-21, feature9 구현, Conversation 고정 상태 필드 추가
 *   - 2026-05-22, feature9 보강, ChatStreamingPhase 타입 추가
 *   - 2026-05-22, feature9 SSE 보강, status event와 message status state 추가
 *   - 2026-05-22, RAG status 계약 반영, meta event와 확장 가능한 status phase 처리 추가
 *   - 2026-05-26, API 계약 정합성 수정, Source 수정일 필드를 sourceUpdatedAt으로 일치
 *   - 2026-05-26, API 계약 정합성 수정, Common Response 실패 payload의 errorCode 반영
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
export type ApiSuccessResponse<TData> = {
  isSuccess: true;
  code: number;
  message: string;
  data: TData;
};

export type ApiErrorResponse = {
  isSuccess: false;
  code: number;
  errorCode: string;
  message: string;
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export type Conversation = {
  conversationId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
  messageCount?: number;
  isPinned?: boolean;
};

export type ConversationList = {
  conversations: Conversation[];
  totalCount: number;
  page: number;
  size: number;
};

export type ListConversationsParams = {
  page?: number;
  size?: number;
};

export type Source = {
  title: string;
  pageId: string;
  spaceId: string;
  spaceName: string;
  url: string;
  sourceUpdatedAt: string;
  relevanceScore: number;
};

export type ConfluencePagePreview = {
  pageId: string;
  title: string;
  spaceName: string;
  authorName: string;
  updatedAt: string;
  breadcrumbs: string[];
  pageUrl: string;
  bodyViewValue: string;
};

export type CurrentUserRole = 'USER' | 'ADMIN';

export type CurrentUser = {
  userId: string;
  name: string;
  email: string;
  role: CurrentUserRole;
  profileImageUrl: string;
  lastLoginAt: string;
};

export type VerificationResult = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED';

export type MessageRole = 'user' | 'assistant';

export type Message = {
  messageId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  phase?: ChatStreamingPhase;
  statusMessage?: string;
  error?: string;
  sources?: Source[];
  confidenceScore?: number;
  verificationResult?: VerificationResult;
};

export type ConversationMessages = {
  conversationId: string;
  messages: Message[];
};

export type FeedbackRating = 'like' | 'dislike';

export type Feedback = {
  feedbackId: string;
  messageId: string;
  rating: FeedbackRating;
  createdAt: string;
};

export type CreateConversationResponse = Pick<
  Conversation,
  'conversationId' | 'title' | 'createdAt'
>;

export type UpdateConversationTitleRequest = {
  title: string;
};

export type UpdateConversationTitleResponse = Pick<
  Conversation,
  'conversationId' | 'title' | 'updatedAt'
>;

export type DeleteConversationResponse = null;

export type ChatQuestionRequest = {
  question: string;
};

export type SubmitFeedbackRequest = {
  rating: FeedbackRating;
  comment?: string;
};

export type ChatStreamingPhase =
  | 'idle'
  | 'connecting'
  | 'acl_filtering'
  | 'searching'
  | 'answering'
  | 'streaming'
  | 'verifying'
  | 'formatting'
  | 'done'
  | 'error';

export type ChatStatusEvent = {
  event: 'status';
  data: {
    phase: ChatStreamingPhase | string;
    message: string;
  };
};

export type ChatTokenEvent = {
  event: 'token';
  data: {
    content: string;
  };
};

export type ChatSourcesEvent = {
  event: 'sources';
  data: {
    sources: Source[];
  };
};

export type ChatVerificationEvent = {
  event: 'verification';
  data: {
    confidenceScore: number;
    verificationResult: VerificationResult;
  };
};

export type ChatMetaEvent = {
  event: 'meta';
  data: {
    intent: string;
    used_llm: string;
    feedback_enabled: boolean;
    latency_ms: number;
    title?: string;
  };
};

export type ChatDoneEvent = {
  event: 'done';
  data: {
    messageId: string;
  };
};

export type ChatErrorEvent = {
  event: 'error';
  data: {
    code: string;
    message: string;
  };
};

export type ChatSseEvent =
  | ChatStatusEvent
  | ChatTokenEvent
  | ChatSourcesEvent
  | ChatVerificationEvent
  | ChatMetaEvent
  | ChatDoneEvent
  | ChatErrorEvent;
