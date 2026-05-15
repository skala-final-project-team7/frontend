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

export type ConversationSummary = {
  conversationId: string;
  title: string;
  lastMessageAt?: string;
  messageCount: number;
};

export type ConversationListData = {
  conversations: ConversationSummary[];
  totalCount: number;
  page: number;
  size: number;
};

export type CreateConversationData = {
  conversationId: string;
  title: string;
  createdAt: string;
};

export type ChatRole = 'user' | 'assistant';

export type Source = {
  title: string;
  pageId: string;
  spaceId: string;
  spaceName: string;
  url: string;
  updatedAt: string;
  relevanceScore: number;
};

export type VerificationResult = 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED';

export type ChatMessage = {
  messageId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  sources?: Source[];
  confidenceScore?: number;
  verificationResult?: VerificationResult;
};

export type ConversationMessagesData = {
  conversationId: string;
  messages: ChatMessage[];
};

export type FeedbackRating = 'like' | 'dislike';

export type FeedbackData = {
  feedbackId: string;
  messageId: string;
  rating: FeedbackRating;
  createdAt: string;
};

export type ChatStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'sources'; sources: Source[] }
  | { type: 'verification'; confidenceScore: number; verificationResult: VerificationResult }
  | { type: 'done'; messageId: string }
  | { type: 'error'; code: string; message: string };
