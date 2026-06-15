/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat mock API에서 반환할 대화, 메시지, 출처 샘플 데이터 정의.
 *           feature8 이후 Chat UI가 실제 API 전환 전 동일한 타입으로 동작하도록 한다.
 * 작성일 : 2026-05-18
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-05-18, feature6 구현, Chat mock response seed data 추가
 *   - 2026-05-21, feature9 구현, conversation pinned 상태 mock data 추가
 *   - 2026-05-26, API 계약 정합성 수정, source 수정일 mock 필드를 sourceUpdatedAt으로 변경
 *   - 2026-05-26, API 계약 정합성 수정, response timestamp mock을 KST 표기로 통일
 *   - 2026-06-10, feature15 구현, mockAdminStats·mockAdminUsersData 추가
 *   - 2026-06-11, feature16 구현, mockAdminFeedbackData 추가
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import type {
  AdminDataOverview,
  AdminFeedbackResponse,
  AdminIngestStatusResponse,
  AdminKeyActivationResponse,
  AdminStats,
  AdminUsersResponse,
  StartAdminIngestResponse,
  AdminSyncHistoryResponse,
  ConfluencePagePreview,
  Conversation,
  ConversationSearchResponse,
  CurrentUser,
  Message,
  Source,
} from '@/types/api';

export const mockCurrentUser: CurrentUser = {
  userId: 'user-001',
  name: '이다연',
  email: 'dayeon@example.com',
  role: 'ADMIN',
  profileImageUrl:
    'https://mblogthumb-phinf.pstatic.net/MjAyNTA5MDNfMzEg/MDAxNzU2ODk5ODI4NTYx.VzhqoiUeu5-JgOSajxHFRO4o5Bh8LrowuEfxEPKVG6cg.RurBKZOGbgkY5ROekysZZSBL0fgKAB6itfMC3kGU-DIg.JPEG/IMG%EF%BC%BF3630.JPG?type=w800',
  lastLoginAt: '2026-05-20T18:00:00+09:00',
};

export const mockAdminDataOverview: AdminDataOverview = {
  totalSpaces: 6,
  totalPages: 2847,
  totalAttachments: 934,
  vectorDbSize: '3.8 GB',
  totalChunks: 18432,
  lastSyncAt: '2026-06-04T07:23:00+09:00',
};

export const mockAdminSyncHistory: AdminSyncHistoryResponse = {
  syncHistory: [
    {
      syncId: 'sync-001',
      status: 'COMPLETED',
      updatedPages: 15,
      deletedPages: 5,
      duration: 140,
      completedAt: '2026-06-04T10:23:00+09:00',
    },
    {
      syncId: 'sync-002',
      status: 'COMPLETED',
      updatedPages: 24,
      deletedPages: 6,
      duration: 55,
      completedAt: '2026-06-04T02:23:00+09:00',
    },
    {
      syncId: 'sync-003',
      status: 'COMPLETED',
      updatedPages: 79,
      deletedPages: 0,
      duration: 138,
      completedAt: '2026-06-03T18:23:00+09:00',
    },
    {
      syncId: 'sync-004',
      status: 'FAILED',
      updatedPages: 10,
      deletedPages: 1,
      duration: 67,
      completedAt: '2026-06-03T10:23:00+09:00',
    },
    {
      syncId: 'sync-005',
      status: 'COMPLETED',
      updatedPages: 5,
      deletedPages: 2,
      duration: 248,
      completedAt: '2026-06-03T02:23:00+09:00',
    },
  ],
};

export const mockAdminKeyActivation: AdminKeyActivationResponse = {
  activatedUntil: '2026-06-09T13:00:00+09:00',
};

export const mockAdminIngestStart: StartAdminIngestResponse = {
  jobId: 'job-uuid-001',
  status: 'STARTED',
  startedAt: '2026-06-09T12:00:00+09:00',
};

export const mockAdminIngestStatusSequence: AdminIngestStatusResponse[] = [
  {
    jobId: 'job-uuid-001',
    status: 'STARTED',
    totalPages: 150,
    processedPages: 0,
    failedPages: 0,
    startedAt: '2026-06-09T12:00:00+09:00',
  },
  {
    jobId: 'job-uuid-001',
    status: 'IN_PROGRESS',
    totalPages: 150,
    processedPages: 52,
    failedPages: 0,
    startedAt: '2026-06-09T12:00:00+09:00',
  },
  {
    jobId: 'job-uuid-001',
    status: 'IN_PROGRESS',
    totalPages: 150,
    processedPages: 109,
    failedPages: 1,
    startedAt: '2026-06-09T12:00:00+09:00',
  },
  {
    jobId: 'job-uuid-001',
    status: 'COMPLETED',
    totalPages: 150,
    processedPages: 150,
    failedPages: 2,
    startedAt: '2026-06-09T12:00:00+09:00',
  },
];

export const mockAdminStats: AdminStats = {
  dailyQueryCount: 1284,
  avgResponseTime: 3.4,
  totalConversations: 8741,
  hourlyAccessTrend: [
    { hour: 0, count: 3 },
    { hour: 1, count: 2 },
    { hour: 2, count: 5 },
    { hour: 3, count: 1 },
    { hour: 4, count: 0 },
    { hour: 5, count: 2 },
    { hour: 6, count: 8 },
    { hour: 7, count: 20 },
    { hour: 8, count: 35 },
    { hour: 9, count: 60 },
    { hour: 10, count: 85 },
    { hour: 11, count: 110 },
    { hour: 12, count: 95 },
    { hour: 13, count: 100 },
    { hour: 14, count: 75 },
    { hour: 15, count: 82 },
    { hour: 16, count: 90 },
    { hour: 17, count: 68 },
    { hour: 18, count: 42 },
    { hour: 19, count: 25 },
    { hour: 20, count: 18 },
    { hour: 21, count: 12 },
    { hour: 22, count: 7 },
    { hour: 23, count: 4 },
  ],
};

// totalUsers와 실제 목록 길이가 일치해야 pagination mock이 빈 페이지를 만들지 않는다.
const MOCK_ADMIN_USER_COUNT = 58;
// 최근성 dot(7일 이내/30일 이내/그 이상)이 한 페이지 안에서 골고루 보이도록
// 현재 시각 기준 경과시간을 6개 패턴(초록 2 / 노랑 2 / 회색 2)으로 순환시킨다.
const MOCK_ADMIN_USER_ACCESS_HOURS_AGO = [2, 50, 200, 400, 800, 1500];

function toKstIsoString(epochMs: number): string {
  return `${new Date(epochMs + 9 * 3600_000).toISOString().slice(0, 19)}+09:00`;
}

export const mockAdminUsersData: AdminUsersResponse = {
  totalUsers: MOCK_ADMIN_USER_COUNT,
  dailyActiveUsers: 23,
  users: Array.from({ length: MOCK_ADMIN_USER_COUNT }, (_, index) => ({
    userId: `user-dashboard-${String(index + 1).padStart(3, '0')}`,
    name: `사용자 ${index + 1}`,
    accessibleSpaceCount: (index % 5) + 1,
    accessiblePageCount: 37 + ((index * 13) % 130),
    accessibleAttachmentCount: 14 + ((index * 7) % 40),
    // 페이지(12명)마다 한 명은 페이지 평균 2배를 넘는 outlier가 되도록 가산해 강조 UI를 확인할 수 있게 한다.
    conversationCount: 11 + ((index * 17) % 110) + (index % 12 === 6 ? 120 : 0),
    lastAccessAt: toKstIsoString(
      Date.now() -
        (MOCK_ADMIN_USER_ACCESS_HOURS_AGO[index % MOCK_ADMIN_USER_ACCESS_HOURS_AGO.length] +
          index) *
          3_600_000,
    ),
  })),
};

// 부정 피드백 원문 총 건수는 dislikeCount와 일치해야 pagination mock이 빈 페이지를 만들지 않는다.
const MOCK_ADMIN_NEGATIVE_FEEDBACK_COUNT = 47;
const MOCK_ADMIN_FEEDBACK_COMMENTS = [
  '답변이 너무 길어요',
  '관련 없는 내용이 포함됐어요',
  '정확하지 않아요',
  '출처가 질문과 관련 없었어요',
];
const MOCK_ADMIN_FEEDBACK_QUESTIONS = [
  'Confluence에서 특정 스페이스의 하위 페이지까지 재수집했는데 검색 결과에는 이전 버전 문서가 계속 노출됩니다. 증분 수집이 반영됐는지 확인하려면 어떤 로그와 상태값을 봐야 하나요?',
  'Admin Key를 활성화한 뒤에도 제한된 페이지가 검색 결과에 포함되지 않는 경우, OAuth 토큰 문제인지 Confluence 권한 설정 문제인지 구분하는 절차가 궁금합니다.',
  '사용자가 같은 질문을 했을 때 어떤 경우에는 최신 운영 가이드가 나오고 어떤 경우에는 오래된 장애 대응 문서가 먼저 나옵니다. 출처 우선순위는 어떻게 결정되나요?',
  '첨부 파일이 많은 페이지를 수집한 뒤 답변에 파일 내용이 일부만 반영되는 것 같습니다. 첨부 파일 본문 추출 실패 여부를 관리 화면에서 확인할 수 있나요?',
  '사내 VPN 접속 정책 문서를 검색했는데 답변이 사용자 권한 범위를 넘어선 다른 팀 문서를 참고한 것처럼 보입니다. ACL 필터링이 적용됐는지 확인하고 싶습니다.',
];
const MOCK_ADMIN_FEEDBACK_ANSWERS = [
  '관리자 화면의 동기화 이력에서 해당 ingest job의 상태와 완료 시각을 먼저 확인한 뒤, 동일 jobId로 생성된 completion event와 벡터 저장소 반영 시각을 함께 비교해야 합니다. 증분 수집은 변경된 페이지와 삭제된 페이지를 기준으로 반영되므로, 페이지 updatedAt이 이전 수집 시각보다 이후인지도 확인하는 것이 좋습니다.',
  '먼저 Admin Key 활성화 만료 시각을 확인하고, 이후 Confluence API 호출에서 제한 페이지가 200으로 조회되는지 확인해야 합니다. Admin Key는 활성화되어 있지만 특정 페이지가 누락된다면 스페이스 권한, 페이지 제한, 그룹 매핑이 모두 현재 사용자 계정 기준으로 일치하는지 점검해야 합니다.',
  '검색 결과 우선순위는 질문과 문서 chunk 간의 유사도, 권한 필터링 결과, 문서 최신성 메타데이터를 함께 사용해 결정됩니다. 최신 문서가 항상 우선되는 것은 아니며, 오래된 문서가 질문과 더 강하게 매칭되면 상단에 노출될 수 있습니다.',
  '첨부 파일 본문 추출 여부는 수집 로그의 attachment 처리 단계에서 확인할 수 있습니다. 파일 형식이 지원되지 않거나 OCR 대상 문서가 너무 큰 경우 일부 내용만 색인될 수 있으며, 이 경우 해당 attachmentId와 실패 사유가 동기화 이력의 상세 로그에 남아야 합니다.',
  'ACL 필터링은 질의 요청에 포함된 userId와 groupId를 기준으로 벡터 검색 전 단계에서 적용됩니다. 권한 밖 문서가 출처로 보인다면 먼저 해당 사용자의 Confluence groupId 동기화 상태와 페이지 제한 메타데이터가 최신으로 적재됐는지 확인해야 합니다.',
];

export const mockAdminFeedbackData: AdminFeedbackResponse = {
  totalCount: 359,
  likeCount: 312,
  dislikeCount: MOCK_ADMIN_NEGATIVE_FEEDBACK_COUNT,
  positiveRatio: 0.87,
  trend: [
    { date: '2026-06-03', likeCount: 38, dislikeCount: 7 },
    { date: '2026-06-04', likeCount: 52, dislikeCount: 11 },
    { date: '2026-06-05', likeCount: 27, dislikeCount: 4 },
    { date: '2026-06-06', likeCount: 19, dislikeCount: 2 },
    { date: '2026-06-07', likeCount: 33, dislikeCount: 6 },
    { date: '2026-06-08', likeCount: 57, dislikeCount: 9 },
    { date: '2026-06-09', likeCount: 44, dislikeCount: 8 },
  ],
  negativeFeedbacks: Array.from({ length: MOCK_ADMIN_NEGATIVE_FEEDBACK_COUNT }, (_, index) => ({
    feedbackId: `fb-mock-${String(index + 1).padStart(3, '0')}`,
    messageId: `msg-mock-${String(index + 1).padStart(3, '0')}`,
    comment: MOCK_ADMIN_FEEDBACK_COMMENTS[index % MOCK_ADMIN_FEEDBACK_COMMENTS.length],
    question: MOCK_ADMIN_FEEDBACK_QUESTIONS[index % MOCK_ADMIN_FEEDBACK_QUESTIONS.length],
    answer: MOCK_ADMIN_FEEDBACK_ANSWERS[index % MOCK_ADMIN_FEEDBACK_ANSWERS.length],
    createdAt: toKstIsoString(Date.now() - (index + 1) * 7 * 3_600_000),
  })),
  page: 0,
  size: 20,
};

export const mockSources: Source[] = [
  {
    title: 'S3 트러블슈팅 가이드',
    pageId: '12345',
    spaceId: '98310',
    spaceName: 'Cloud Control Center',
    url: 'https://yhlee0332.atlassian.net/wiki/spaces/ai27Rev1/pages/557209/macOS',
    sourceUpdatedAt: '2026-04-15T18:30:00+09:00',
    relevanceScore: 0.92,
  },
];

export const mockConfluencePreviewPages: Record<string, ConfluencePagePreview> = {
  '12345': {
    pageId: '12345',
    title: 'S3 트러블슈팅 가이드',
    spaceName: 'Cloud Control Center',
    authorName: 'Platform Team',
    updatedAt: '2026-04-15T18:30:00+09:00',
    breadcrumbs: ['Cloud Control Center', 'AWS', 'S3', 'S3 트러블슈팅 가이드'],
    pageUrl: 'https://yhlee0332.atlassian.net/wiki/spaces/ai27Rev1/pages/491961/FAQ+-',
    bodyViewValue: [
      '<article>',
      '<h1>S3 트러블슈팅 가이드</h1>',
      '<p>S3 권한 오류는 버킷 정책과 IAM 정책의 접근 범위를 함께 확인해야 합니다.</p>',
      '<h2>해결 절차</h2>',
      '<ol>',
      '<li>CloudTrail에서 AccessDenied 이벤트를 확인합니다.</li>',
      '<li>사용자 또는 Role에 연결된 IAM 정책을 검토합니다.</li>',
      '<li>버킷 정책의 Principal과 Action 범위를 보강합니다.</li>',
      '</ol>',
      '</article>',
    ].join(''),
  },
  '67890': {
    pageId: '67890',
    title: 'Confluence 문서 동기화 운영 Runbook',
    spaceName: 'LINA Operations',
    authorName: 'Search Platform Team',
    updatedAt: '2026-05-07T18:10:00+09:00',
    breadcrumbs: ['LINA Operations', '데이터 파이프라인', '동기화 운영 Runbook'],
    pageUrl: 'https://yhlee0332.atlassian.net/wiki/spaces/ai27Rev1/pages/557209/macOS',
    bodyViewValue: [
      '<article>',
      '<h1>Confluence 문서 동기화 운영 Runbook</h1>',
      '<p>동기화 작업은 변경 문서 감지, chunking, embedding 순서로 진행됩니다.</p>',
      '<h2>점검 항목</h2>',
      '<ul>',
      '<li>최근 sync job 상태가 SUCCESS인지 확인합니다.</li>',
      '<li>실패 작업은 DLQ에서 원인을 확인한 뒤 재시도합니다.</li>',
      '</ul>',
      '</article>',
    ].join(''),
  },
};

export const mockHomeConfluencePages: ConfluencePagePreview[] = [
  {
    pageId: 'home-preview-001',
    title: '자주 묻는 질문 (FAQ) - 인프라 운영',
    spaceName: 'Cloud Control Center',
    authorName: '이현서',
    updatedAt: '2026-05-19T18:30:00+09:00',
    breadcrumbs: ['Cloud Control Center', 'AWS', 'FAQ', '자주 묻는 질문 (FAQ) - 인프라 운영'],
    pageUrl: 'https://yhlee0332.atlassian.net/wiki/spaces/ai27Rev1/pages/491961/FAQ+-',
    bodyViewValue: [
      '<article>',
      '<h1>자주 묻는 질문 (FAQ) - 인프라 운영</h1>',
      '<h2>AWS 관련</h2>',
      '<p>Q. AWS 콘솔 접속은 어떻게 하나요?</p>',
      '<p>A. SSO 포털에서 회사 계정으로 로그인합니다.</p>',
      '<p>Q. 프로덕션 환경에 직접 접근할 수 있나요?</p>',
      '</article>',
    ].join(''),
  },
  {
    pageId: 'home-preview-002',
    title: '자주 묻는 질문 (FAQ) - 인프라 운영',
    spaceName: 'LINA Operations',
    authorName: '김민준',
    updatedAt: '2026-05-19T19:00:00+09:00',
    breadcrumbs: ['LINA Operations', '접속', '자주 묻는 질문 (FAQ) - 인프라 운영'],
    pageUrl: 'https://yhlee0332.atlassian.net/wiki/spaces/ai27Rev1/pages/491961/FAQ+-',
    bodyViewValue: [
      '<article>',
      '<h1>자주 묻는 질문 (FAQ) - 인프라 운영</h1>',
      '<h2>접속은 어떻게 하나요?</h2>',
      '<p>https://skax.awsapps.com에서 회사 계정으로 로그인합니다.</p>',
      '<p>최초 접속 시 SSO 등록을 요청해야 합니다.</p>',
      '<p>Slack #infra-support 채널에 문의할 수 있습니다.</p>',
      '</article>',
    ].join(''),
  },
];

export const mockConversations: Conversation[] = [
  {
    conversationId: 'conv-mock-001',
    title: 'S3 권한 오류 해결 방법',
    createdAt: '2026-05-06T19:00:00+09:00',
    lastMessageAt: '2026-05-06T19:05:00+09:00',
    isPinned: true,
  },
  {
    conversationId: 'conv-mock-002',
    title: 'Confluence 문서 동기화 상태 확인',
    createdAt: '2026-05-07T18:00:00+09:00',
    lastMessageAt: '2026-05-07T18:12:00+09:00',
    isPinned: false,
  },
];

export const mockMessagesByConversationId: Record<string, Message[]> = {
  'conv-mock-001': [
    {
      messageId: 'msg-mock-user-001',
      role: 'user',
      content: '지난번 S3 버킷 권한 오류 때 어떻게 해결했어?',
      createdAt: '2026-05-06T19:00:00+09:00',
    },
    {
      messageId: 'msg-mock-assistant-001',
      role: 'assistant',
      content: 'S3 권한 오류는 IAM 정책의 버킷 접근 권한을 보강해 해결했습니다.',
      sources: mockSources,
      confidenceScore: 0.85,
      verificationResult: 'SUPPORTED',
      createdAt: '2026-05-06T19:00:05+09:00',
    },
  ],
  'conv-mock-002': [
    {
      messageId: 'msg-mock-user-002',
      role: 'user',
      content: '문서 동기화가 마지막으로 언제 성공했어?',
      createdAt: '2026-05-07T18:00:00+09:00',
    },
    {
      messageId: 'msg-mock-assistant-002',
      role: 'assistant',
      content: '최근 동기화는 2026-05-07 09:10 UTC에 성공했습니다.',
      sources: mockSources,
      confidenceScore: 0.78,
      verificationResult: 'PARTIALLY_SUPPORTED',
      createdAt: '2026-05-07T18:12:00+09:00',
    },
  ],
};

export const mockConversationSearchResponse: ConversationSearchResponse = {
  results: [
    {
      conversationId: 'conv-mock-001',
      title: 'S3 권한 오류 해결 방법',
      lastMessageAt: '2026-05-06T19:05:00+09:00',
      isPinned: true,
      matchedMessages: [
        {
          messageId: 'msg-mock-assistant-001',
          role: 'assistant',
          snippet: 'IAM 정책을 수정하여 S3 권한 오류를 해결했습니다.',
          matchPositions: [[13, 18]],
          createdAt: '2026-05-06T19:00:05+09:00',
        },
      ],
      matchCount: 1,
    },
  ],
  totalCount: 1,
  page: 0,
  size: 20,
};
