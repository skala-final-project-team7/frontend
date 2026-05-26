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
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Vite 5.4.x 기준
 * --------------------------------------------------
 */
import type {
  ConfluencePagePreview,
  Conversation,
  CurrentUser,
  Message,
  Source,
} from '@/types/api';

export const mockCurrentUser: CurrentUser = {
  userId: 'user-001',
  name: '이다연',
  email: 'dayeon@example.com',
  role: 'USER',
  profileImageUrl:
    'https://mblogthumb-phinf.pstatic.net/MjAyNTA5MDNfMzEg/MDAxNzU2ODk5ODI4NTYx.VzhqoiUeu5-JgOSajxHFRO4o5Bh8LrowuEfxEPKVG6cg.RurBKZOGbgkY5ROekysZZSBL0fgKAB6itfMC3kGU-DIg.JPEG/IMG%EF%BC%BF3630.JPG?type=w800',
  lastLoginAt: '2026-05-20T09:00:00Z',
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
    updatedAt: '2026-04-15T09:30:00Z',
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
    updatedAt: '2026-05-07T09:10:00Z',
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
    updatedAt: '2026-05-19T09:30:00Z',
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
    updatedAt: '2026-05-19T10:00:00Z',
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
    createdAt: '2026-05-06T10:00:00Z',
    lastMessageAt: '2026-05-06T10:05:00Z',
    messageCount: 4,
    isPinned: true,
  },
  {
    conversationId: 'conv-mock-002',
    title: 'Confluence 문서 동기화 상태 확인',
    createdAt: '2026-05-07T09:00:00Z',
    lastMessageAt: '2026-05-07T09:12:00Z',
    messageCount: 2,
    isPinned: false,
  },
];

export const mockMessagesByConversationId: Record<string, Message[]> = {
  'conv-mock-001': [
    {
      messageId: 'msg-mock-user-001',
      role: 'user',
      content: '지난번 S3 버킷 권한 오류 때 어떻게 해결했어?',
      createdAt: '2026-05-06T10:00:00Z',
    },
    {
      messageId: 'msg-mock-assistant-001',
      role: 'assistant',
      content: 'S3 권한 오류는 IAM 정책의 버킷 접근 권한을 보강해 해결했습니다.',
      sources: mockSources,
      confidenceScore: 0.85,
      verificationResult: 'SUPPORTED',
      createdAt: '2026-05-06T10:00:05Z',
    },
  ],
  'conv-mock-002': [
    {
      messageId: 'msg-mock-user-002',
      role: 'user',
      content: '문서 동기화가 마지막으로 언제 성공했어?',
      createdAt: '2026-05-07T09:00:00Z',
    },
    {
      messageId: 'msg-mock-assistant-002',
      role: 'assistant',
      content: '최근 동기화는 2026-05-07 09:10 UTC에 성공했습니다.',
      sources: mockSources,
      confidenceScore: 0.78,
      verificationResult: 'PARTIALLY_SUPPORTED',
      createdAt: '2026-05-07T09:12:00Z',
    },
  ],
};
