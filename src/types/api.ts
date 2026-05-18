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
  message: string;
  data: null;
};

export type ApiResponse<TData> = ApiSuccessResponse<TData> | ApiErrorResponse;

export type Conversation = {
  conversationId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
  lastMessageAt?: string;
  messageCount?: number;
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
  updatedAt: string;
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

export type VerificationResult = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED';

export type MessageRole = 'user' | 'assistant';

export type Message = {
  messageId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
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
  | ChatTokenEvent
  | ChatSourcesEvent
  | ChatVerificationEvent
  | ChatDoneEvent
  | ChatErrorEvent;
