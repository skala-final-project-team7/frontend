<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat 화면의 SCR-400 기본 화면 구성.
          Sidebar 기본 상태, ChatEmptyState, MessageInput, SettingsEntry를 배치한다.
작성일 : 2026-05-18
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-18, feature3 구현, Chat shell placeholder 영역 추가
  - 2026-05-20, feature8 구현, SCR-400 기본 채팅 화면으로 placeholder 교체
  - 2026-05-22, feature9 보강, SSE submit route fallback, 실패 toast, page-level scroll layout 적용
  - 2026-05-22, feature9 SSE 보강, meta.title 기반 대화 제목 갱신 추가
  - 2026-05-22, SCR-420 보강, 사용자 메시지 수정본 이전/현재 표시 전환 추가
  - 2026-05-26, feature9 회귀 수정, 지연된 메시지 이력 실패 시 현재 대화/스트림 보존
  - 2026-05-26, feature10 구현, 출처 패널 열기와 sidebar 닫기 상태 연결
  - 2026-05-26, feature10 UI 보정, 새 채팅 진입 시 출처 패널 초기화
  - 2026-06-01, feature10.1 구현, 대화 케밥 메뉴 표시와 기존 API 액션 연결
  - 2026-06-02, feature10.4 보강, assistant 피드백 모달과 submit API 연결
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import {
  HelpCircle,
  MessageCircle,
  PanelRightClose,
  PanelLeftClose,
  Search,
  Settings,
  SquarePen,
  User,
} from '@lucide/vue';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  createConversation,
  deleteConversation,
  getCurrentUser,
  listConversations,
  submitMessageFeedback,
  updateConversationTitle,
} from '@/api';
import ChatConversationView from '@/features/chat/ChatConversationView.vue';
import ChatEmptyState from '@/features/chat/ChatEmptyState.vue';
import ConversationSearchModal from '@/features/chat/ConversationSearchModal.vue';
import ConversationActionMenu from '@/features/chat/ConversationActionMenu.vue';
import FeedbackModal from '@/features/chat/FeedbackModal.vue';
import MessageInput from '@/features/chat/MessageInput.vue';
import ReferencePanel from '@/features/chat/ReferencePanel.vue';
import { mascotImageUrl } from '@/shared/assets';
import { BaseFloatingIconButton, BaseTooltip } from '@/shared';
import { useToast } from '@/composables/useToast';
import { useChatStore } from '@/stores';
import type { Conversation, FeedbackRating, Message, Source } from '@/types/api';

type UserMessageVersion = {
  userContent: string;
  assistantMessageId?: string;
  assistantContent?: string;
};

type UserMessageVersionState = {
  activeIndex: number;
  versions: UserMessageVersion[];
};

type FeedbackTarget = {
  messageId: string;
  rating: FeedbackRating;
};

const isSidebarOpen = ref(false);
const isSidebarMascotHovered = ref(false);
const isSidebarContentVisible = ref(false);
const route = useRoute();
const router = useRouter();
const userName = ref('00');
const profileImageUrl = ref('');
const hasProfileImageLoadFailed = ref(false);
const conversations = ref<Conversation[]>([]);
const editingMessageId = ref('');
const editingContent = ref('');
const resentMessageIds = ref<Set<string>>(new Set());
const userMessageVersionsById = ref<Record<string, UserMessageVersionState>>({});
const isReferencePanelOpen = ref(false);
const referenceSources = ref<Source[]>([]);
const hoveredConversationMenuId = ref('');
const openConversationMenuId = ref('');
const feedbackTarget = ref<FeedbackTarget | null>(null);
const isFeedbackSubmitting = ref(false);
const isSearchModalOpen = ref(false);
const isCollapsedConversationPopoverOpen = ref(false);
const chatStore = useChatStore();
const { showToast } = useToast();
let sidebarContentTimer: number | undefined;

const pinnedConversations = computed(() =>
  conversations.value.filter((conversation) => conversation.isPinned),
);
const recentConversations = computed(() =>
  conversations.value.filter((conversation) => !conversation.isPinned),
);
const collapsedConversationPreviewList = computed(() => conversations.value.slice(0, 10));
const routeConversationId = computed(() => {
  const conversationId = route.params.conversationId;

  return typeof conversationId === 'string' ? conversationId : '';
});
const hasActiveConversation = computed(
  () => routeConversationId.value.length > 0 || chatStore.activeConversationId.length > 0,
);
const activeMessages = computed(() => {
  const messages = chatStore.activeMessages.map((message) => ({ ...message }));

  Object.entries(userMessageVersionsById.value).forEach(([messageId, versionState]) => {
    const version = versionState.versions[versionState.activeIndex];

    if (!version) {
      return;
    }

    const userMessage = messages.find((message) => message.messageId === messageId);

    if (userMessage) {
      userMessage.content = version.userContent;
    }

    if (!version.assistantMessageId) {
      return;
    }

    const assistantMessage = messages.find(
      (message) => message.messageId === version.assistantMessageId,
    );

    if (assistantMessage && version.assistantContent !== undefined) {
      assistantMessage.content = version.assistantContent;
    }
  });

  return messages;
});
const userMessageVersionIndicators = computed(() =>
  Object.fromEntries(
    Object.entries(userMessageVersionsById.value).map(([messageId, versionState]) => [
      messageId,
      {
        activeIndex: versionState.activeIndex,
        total: versionState.versions.length,
      },
    ]),
  ),
);
const currentConversationTitle = computed(() => {
  const conversationId = routeConversationId.value || chatStore.activeConversationId;
  const streamingTitle = chatStore.conversationTitlesById[conversationId];

  if (streamingTitle) {
    return streamingTitle;
  }

  const currentConversation = conversations.value.find(
    (conversation) => conversation.conversationId === conversationId,
  );

  return currentConversation?.title ?? '새 채팅';
});
const currentConversation = computed(() => {
  const conversationId = routeConversationId.value || chatStore.activeConversationId;

  return conversations.value.find((conversation) => conversation.conversationId === conversationId);
});
const currentConversationId = computed(
  () => currentConversation.value?.conversationId ?? routeConversationId.value,
);

/**
 * 사이드바 open/close 상태를 토글한다.
 */
function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

// 사이드바 텍스트는 width transition이 거의 끝난 뒤 노출시켜 레이아웃 흔들림을 줄인다.
watch(isSidebarOpen, (isOpen) => {
  if (sidebarContentTimer) {
    window.clearTimeout(sidebarContentTimer);
    sidebarContentTimer = undefined;
  }

  closeCollapsedConversationPopover();

  if (!isOpen) {
    isSidebarContentVisible.value = false;
    return;
  }

  sidebarContentTimer = window.setTimeout(() => {
    isSidebarContentVisible.value = true;
  }, 160);
});

/**
 * 채팅 검색 모달 진입점이다.
 */
function openSearchModal() {
  isSearchModalOpen.value = true;
}

/**
 * 채팅 검색 모달을 닫는다.
 */
function closeSearchModal() {
  isSearchModalOpen.value = false;
}

/**
 * 검색 결과로 선택한 대화 상세 라우트로 이동한다.
 *
 * @param conversationId 이동할 대화 ID
 */
async function selectSearchResult(conversationId: string) {
  closeSearchModal();
  await router.push({
    name: 'chat-conversation',
    params: {
      conversationId,
    },
  });
}

/**
 * 새 채팅 시작 시 /chat 라우트로 이동한다.
 */
async function startNewChat() {
  await router.push({
    name: 'chat',
  });
}

/**
 * 사이드바에서 선택한 conversation 상세 라우트로 이동한다.
 *
 * @param conversationId 이동할 대화 ID
 */
async function selectConversation(conversationId: string) {
  closeConversationMenu();
  closeCollapsedConversationPopover();
  await router.push({
    name: 'chat-conversation',
    params: {
      conversationId,
    },
  });
}

/**
 * 열린 대화 메뉴를 닫는다.
 */
function closeConversationMenu() {
  openConversationMenuId.value = '';
}

/**
 * 접힌 사이드바의 최근 대화 팝오버를 토글한다.
 */
function toggleCollapsedConversationPopover() {
  isCollapsedConversationPopoverOpen.value = !isCollapsedConversationPopoverOpen.value;
}

/**
 * 접힌 사이드바의 최근 대화 팝오버를 닫는다.
 */
function closeCollapsedConversationPopover() {
  isCollapsedConversationPopoverOpen.value = false;
}

/**
 * 대화 메뉴 열림 상태를 토글한다.
 *
 * @param conversationId 메뉴 대상 대화 ID
 */
function toggleConversationMenu(conversationId: string) {
  openConversationMenuId.value =
    openConversationMenuId.value === conversationId ? '' : conversationId;
}

/**
 * body pointerdown으로 메뉴 바깥 클릭을 감지해 열린 메뉴를 닫는다.
 *
 * @param event pointerdown 이벤트
 */
function closeConversationMenuFromOutside(event: PointerEvent) {
  const target = event.target;

  if (!(target instanceof Element)) {
    closeConversationMenu();
    closeCollapsedConversationPopover();
    return;
  }

  if (target.closest('[data-conversation-menu-root]')) {
    return;
  }

  if (target.closest('[data-collapsed-conversation-popover-root]')) {
    return;
  }

  closeConversationMenu();
  closeCollapsedConversationPopover();
}

/**
 * ESC 입력 시 접힌 사이드바의 최근 대화 팝오버를 닫는다.
 *
 * @param event keydown 이벤트
 */
function closeCollapsedConversationPopoverOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeCollapsedConversationPopover();
  }
}

/**
 * 메뉴 액션 후 응답 conversation payload를 로컬 목록에 반영한다.
 *
 * @param nextConversation 갱신된 대화 정보
 */
function replaceConversation(nextConversation: Conversation) {
  conversations.value = conversations.value.map((conversation) =>
    conversation.conversationId === nextConversation.conversationId
      ? {
          ...conversation,
          ...nextConversation,
        }
      : conversation,
  );
}

/**
 * 대화 고정 상태를 토글한다.
 *
 * @param conversation 메뉴 액션 대상 대화
 */
async function toggleConversationPin(conversation: Conversation) {
  try {
    const nextConversation = await updateConversationTitle(conversation.conversationId, {
      isPinned: !conversation.isPinned,
    });

    replaceConversation(nextConversation);
  } catch {
    showToast('대화 고정 상태를 변경하지 못했습니다.', {
      variant: 'error',
    });
  } finally {
    closeConversationMenu();
  }
}

/**
 * 대화 이름 변경 입력을 받아 기존 PATCH API로 반영한다.
 *
 * @param conversation 메뉴 액션 대상 대화
 */
async function renameConversation(conversation: Conversation) {
  const nextTitle = window.prompt('대화 이름을 입력하세요.', conversation.title)?.trim();

  if (!nextTitle) {
    closeConversationMenu();
    return;
  }

  try {
    const nextConversation = await updateConversationTitle(conversation.conversationId, {
      title: nextTitle,
    });

    replaceConversation(nextConversation);
  } catch {
    showToast('대화 이름을 변경하지 못했습니다.', {
      variant: 'error',
    });
  } finally {
    closeConversationMenu();
  }
}

/**
 * 삭제 확인 후 기존 DELETE API로 대화를 삭제하고, 현재 대화 삭제 시 새 채팅으로 이동한다.
 *
 * @param conversation 메뉴 액션 대상 대화
 */
async function removeConversation(conversation: Conversation) {
  if (!window.confirm('이 대화를 삭제할까요?')) {
    closeConversationMenu();
    return;
  }

  try {
    await deleteConversation(conversation.conversationId);
    conversations.value = conversations.value.filter(
      (currentConversation) => currentConversation.conversationId !== conversation.conversationId,
    );

    if (currentConversationId.value === conversation.conversationId) {
      await startNewChat();
    }
  } catch {
    showToast('대화를 삭제하지 못했습니다.', {
      variant: 'error',
    });
  } finally {
    closeConversationMenu();
  }
}

/**
 * route가 가리키는 conversation의 메시지 이력을 Pinia store에 로드한다.
 *
 * @param conversationId 메시지를 조회할 대화 ID
 */
async function loadConversationMessages(conversationId: string) {
  editingMessageId.value = '';
  editingContent.value = '';
  resentMessageIds.value = new Set();
  userMessageVersionsById.value = {};

  try {
    await chatStore.loadConversationMessages(conversationId);
  } catch {
    // 지연된 조회 실패가 현재 화면에 이미 추가된 로컬/SSE 메시지를 제거하지 않도록 보존한다.
  }
}

/**
 * 사용자가 입력한 질문을 현재 대화에 스트리밍 전송한다.
 *
 * @param question MessageInput에서 제출된 사용자 질문
 */
async function submitMessage(question: string) {
  let conversationId = chatStore.activeConversationId || routeConversationId.value;

  if (chatStore.isStreaming) {
    return;
  }

  try {
    if (!conversationId) {
      const createdConversation = await createConversation();
      conversationId = createdConversation.conversationId;

      if (
        !conversations.value.some((conversation) => conversation.conversationId === conversationId)
      ) {
        conversations.value = [createdConversation, ...conversations.value];
      }

      await router.push({
        name: 'chat-conversation',
        params: {
          conversationId,
        },
      });
    }

    await chatStore.streamMessage(conversationId, question);
  } catch {
    showToast('메시지를 전송하지 못했습니다. 연결 상태를 확인해 주세요.', {
      variant: 'error',
    });
  }
}

/**
 * 진행 중인 스트리밍을 취소하고 입력창의 cancel 상태를 해제한다.
 */
function cancelStreaming() {
  chatStore.cancelStreaming();
}

/**
 * 사용자 메시지 편집 상태를 활성화한다.
 *
 * @param message 편집을 시작할 대상 사용자 메시지
 */
function startEditing(message: Message) {
  editingMessageId.value = message.messageId;
  editingContent.value = message.content;
}

/**
 * 메시지 편집 상태를 종료하고 임시 입력값을 비운다.
 */
function cancelEditing() {
  editingMessageId.value = '';
  editingContent.value = '';
}

/**
 * 사용자 메시지 수정 내용을 Pinia store에 반영한다.
 *
 * @param messageId 수정할 메시지 ID
 */
function submitEditedMessage(messageId: string) {
  const nextContent = editingContent.value.trim();

  if (nextContent.length === 0) {
    return;
  }

  const messages = chatStore.activeMessages;
  const messageIndex = messages.findIndex((message) => message.messageId === messageId);
  const currentUserMessage = messages[messageIndex];
  const nextAssistantMessage = messages
    .slice(messageIndex + 1)
    .find((message) => message.role === 'assistant');

  if (!currentUserMessage) {
    return;
  }

  const previousVersion = userMessageVersionsById.value[messageId]?.versions[0] ?? {
    userContent: currentUserMessage.content,
    assistantMessageId: nextAssistantMessage?.messageId,
    assistantContent: nextAssistantMessage?.content,
  };
  const nextVersion = {
    userContent: nextContent,
    assistantMessageId: nextAssistantMessage?.messageId,
    assistantContent: nextAssistantMessage?.content,
  };

  chatStore.updateUserMessage(messageId, nextContent);
  userMessageVersionsById.value = {
    ...userMessageVersionsById.value,
    [messageId]: {
      activeIndex: 1,
      versions: [previousVersion, nextVersion],
    },
  };
  resentMessageIds.value = new Set([...resentMessageIds.value, messageId]);
  cancelEditing();
}

/**
 * 사용자 메시지 수정본 내비게이션에서 선택된 버전으로 화면 표시를 전환한다.
 *
 * @param messageId version을 전환할 사용자 메시지 ID
 * @param versionIndex 선택할 version index
 */
function selectUserMessageVersion(messageId: string, versionIndex: number) {
  const versionState = userMessageVersionsById.value[messageId];

  if (!versionState) {
    return;
  }

  const nextIndex = Math.min(Math.max(versionIndex, 0), versionState.versions.length - 1);

  userMessageVersionsById.value = {
    ...userMessageVersionsById.value,
    [messageId]: {
      ...versionState,
      activeIndex: nextIndex,
    },
  };
}

/**
 * 출처 버튼 클릭 시 reference panel로 넘길 sources를 받는다.
 *
 * @param sources assistant 답변에 연결된 출처 목록
 */
function openReferencePanelFromSourceButton(sources: Source[] | undefined) {
  if (!sources?.length) {
    return;
  }

  referenceSources.value = sources;
  isReferencePanelOpen.value = true;
  isSidebarOpen.value = false;
}

/**
 * 열린 출처 패널을 닫고 표시 중인 source 선택을 초기화한다.
 */
function closeReferencePanel() {
  isReferencePanelOpen.value = false;
  referenceSources.value = [];
}

function openFeedbackModal(message: Message, rating: FeedbackRating) {
  feedbackTarget.value = {
    messageId: message.messageId,
    rating,
  };
}

function closeFeedbackModal() {
  if (isFeedbackSubmitting.value) {
    return;
  }

  feedbackTarget.value = null;
}

async function submitFeedback(comment: string) {
  const target = feedbackTarget.value;

  if (!target) {
    return;
  }

  isFeedbackSubmitting.value = true;

  try {
    await submitMessageFeedback(target.messageId, {
      rating: target.rating,
      comment,
    });
    feedbackTarget.value = null;
  } catch {
    showToast('피드백 제출에 실패했습니다', { variant: 'error' });
  } finally {
    isFeedbackSubmitting.value = false;
  }
}

// 현재 사용자와 대화 목록을 초기에 불러와 사이드바와 상단 프로필을 채운다.
onMounted(async () => {
  document.addEventListener('pointerdown', closeConversationMenuFromOutside);
  document.addEventListener('keydown', closeCollapsedConversationPopoverOnEscape);

  try {
    const [currentUser, conversationList] = await Promise.all([
      getCurrentUser(),
      listConversations(),
    ]);

    userName.value = currentUser.name;
    profileImageUrl.value = currentUser.profileImageUrl;
    hasProfileImageLoadFailed.value = false;
    conversations.value = conversationList.conversations;
  } catch {
    userName.value = '00';
    profileImageUrl.value = '';
    hasProfileImageLoadFailed.value = false;
    conversations.value = [];
  }
});

onBeforeUnmount(() => {
  if (sidebarContentTimer) {
    window.clearTimeout(sidebarContentTimer);
  }

  document.removeEventListener('pointerdown', closeConversationMenuFromOutside);
  document.removeEventListener('keydown', closeCollapsedConversationPopoverOnEscape);
});

// route가 바뀔 때마다 해당 conversation의 메시지 이력을 다시 로드한다.
watch(
  routeConversationId,
  async (conversationId) => {
    if (!conversationId) {
      chatStore.clearActiveConversation();
      closeReferencePanel();
      closeConversationMenu();
      editingMessageId.value = '';
      editingContent.value = '';
      resentMessageIds.value = new Set();
      userMessageVersionsById.value = {};
      return;
    }

    await loadConversationMessages(conversationId);
    closeConversationMenu();
  },
  {
    immediate: true,
  },
);

watch(
  () => ({ ...chatStore.conversationTitlesById }),
  (conversationTitlesById) => {
    conversations.value = conversations.value.map((conversation) => {
      const title = conversationTitlesById[conversation.conversationId];

      return title ? { ...conversation, title } : conversation;
    });
  },
);
</script>

<template>
  <main data-testid="chat-page" class="lina-app-layout min-h-screen overflow-x-clip bg-bg-100">
    <div class="flex min-h-screen items-start">
      <aside
        data-testid="chat-sidebar"
        :data-state="isSidebarOpen ? 'expanded' : 'collapsed'"
        aria-label="Chat sidebar"
        class="sticky top-0 flex h-screen shrink-0 flex-col border-r border-bg-300 transition-[width] duration-200"
        :class="isSidebarOpen ? 'w-[264px] bg-bg-100' : 'w-[76px] bg-primary-white'"
      >
        <div
          v-if="isSidebarOpen && isSidebarContentVisible"
          data-testid="sidebar-expanded-header"
          class="flex h-[76px] items-center justify-between border-b border-bg-300 px-5"
        >
          <div class="flex items-center gap-3">
            <img :src="mascotImageUrl" alt="" class="size-10 object-contain" />
            <p class="font-lina text-heading font-bold">LINA</p>
          </div>
          <BaseTooltip label="사이드바 닫기">
            <button
              data-testid="sidebar-close-toggle"
              type="button"
              aria-label="사이드바 닫기"
              class="inline-flex size-8 items-center justify-center rounded-button text-overlay-dark-80 transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
              @click="toggleSidebar"
            >
              <PanelLeftClose
                data-testid="sidebar-hover-toggle-icon"
                aria-hidden="true"
                class="size-4"
              />
            </button>
          </BaseTooltip>
        </div>
        <div v-else class="flex h-[76px] items-center justify-center border-b border-bg-300">
          <BaseTooltip label="사이드바 열기">
            <button
              data-testid="sidebar-mascot-toggle"
              type="button"
              aria-label="사이드바 열기"
              class="relative inline-flex size-12 items-center justify-center rounded-button transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
              @mouseenter="isSidebarMascotHovered = true"
              @mouseleave="isSidebarMascotHovered = false"
              @focus="isSidebarMascotHovered = true"
              @blur="isSidebarMascotHovered = false"
              @click="toggleSidebar"
            >
              <img
                data-testid="sidebar-mascot-icon"
                :src="mascotImageUrl"
                alt=""
                class="absolute size-10 object-contain transition-opacity"
                :class="isSidebarMascotHovered ? 'opacity-0' : 'opacity-100'"
              />
              <PanelRightClose
                data-testid="sidebar-hover-toggle-icon"
                aria-hidden="true"
                class="absolute size-4 text-overlay-dark-80 transition-opacity"
                :class="isSidebarMascotHovered ? 'opacity-100' : 'opacity-0'"
              />
            </button>
          </BaseTooltip>
        </div>

        <nav
          data-testid="chat-sidebar-nav"
          class="flex flex-1 flex-col gap-3 px-5 py-7"
          aria-label="Chat navigation"
        >
          <div v-if="isSidebarOpen && isSidebarContentVisible" class="space-y-3">
            <button
              data-testid="expanded-new-chat-button"
              type="button"
              class="inline-flex w-full items-center gap-3 rounded-button px-1 py-1.5 font-lina text-small text-overlay-dark-80 transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
              @click="startNewChat"
            >
              <SquarePen aria-hidden="true" class="size-4" />
              <span>새 채팅</span>
            </button>
            <div
              data-testid="chat-search-inline-wrapper"
              class="relative inline-flex w-full cursor-pointer items-center gap-3 rounded-button px-1 py-1.5 transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
              @click="openSearchModal"
            >
              <Search
                data-testid="chat-search-inline-icon"
                aria-hidden="true"
                class="size-4 shrink-0 text-overlay-dark-80"
              />
              <label class="sr-only" for="chat-search-inline">채팅 검색</label>
              <input
                id="chat-search-inline"
                data-testid="chat-search-inline"
                placeholder="채팅 검색"
                readonly
                class="pointer-events-none w-full bg-transparent font-lina text-small text-overlay-dark-80 outline-none placeholder:text-overlay-dark-80"
              />
            </div>
          </div>
          <template v-else>
            <BaseTooltip label="새 채팅">
              <button
                data-testid="collapsed-sidebar-action"
                type="button"
                aria-label="새 채팅"
                class="inline-flex size-8 shrink-0 items-center justify-center rounded-button border border-transparent bg-transparent text-overlay-dark-80 transition hover:bg-bg-200 active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-focus"
                @click="startNewChat"
              >
                <SquarePen aria-hidden="true" class="size-4" />
              </button>
            </BaseTooltip>
            <BaseTooltip label="채팅 검색">
              <button
                data-testid="collapsed-sidebar-action"
                type="button"
                aria-label="채팅 검색"
                class="inline-flex size-8 shrink-0 items-center justify-center rounded-button border border-transparent bg-transparent text-overlay-dark-80 transition hover:bg-bg-200 active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-focus"
                @click="openSearchModal"
              >
                <Search aria-hidden="true" class="size-4" />
              </button>
            </BaseTooltip>
            <div data-collapsed-conversation-popover-root class="relative">
              <BaseTooltip label="채팅 목록">
                <button
                  data-testid="collapsed-sidebar-action"
                  type="button"
                  aria-label="채팅 목록"
                  aria-haspopup="menu"
                  :aria-expanded="isCollapsedConversationPopoverOpen"
                  class="inline-flex size-8 shrink-0 items-center justify-center rounded-button border border-transparent bg-transparent text-overlay-dark-80 transition hover:bg-bg-200 active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-focus"
                  @click="toggleCollapsedConversationPopover"
                >
                  <MessageCircle aria-hidden="true" class="size-4" />
                </button>
              </BaseTooltip>
              <div
                v-if="isCollapsedConversationPopoverOpen"
                data-testid="collapsed-conversation-popover"
                role="menu"
                aria-label="최근 채팅"
                class="absolute left-12 top-0 z-50 w-[264px] rounded-card border border-bg-300 bg-primary-white px-4 py-4 shadow-floating"
              >
                <p class="mb-3 font-lina text-small font-bold text-overlay-dark-80">최근 채팅</p>
                <p
                  v-if="collapsedConversationPreviewList.length === 0"
                  class="py-2 font-lina text-small text-overlay-dark-60"
                >
                  새 대화를 시작하세요
                </p>
                <ul v-else class="space-y-1">
                  <li
                    v-for="conversation in collapsedConversationPreviewList"
                    :key="conversation.conversationId"
                  >
                    <button
                      data-testid="collapsed-conversation-popover-item"
                      type="button"
                      role="menuitem"
                      class="w-full truncate rounded-button px-2 py-2 text-left font-lina text-small text-overlay-dark-80 transition hover:bg-bg-100 focus-visible:outline-none focus-visible:shadow-focus"
                      @click="selectConversation(conversation.conversationId)"
                    >
                      {{ conversation.title }}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </template>

          <div v-if="isSidebarOpen && isSidebarContentVisible" class="mt-6 space-y-7">
            <section>
              <h2 class="font-lina text-small font-semibold text-overlay-dark-40">고정 채팅</h2>
              <p
                v-if="pinnedConversations.length === 0"
                class="mt-3 rounded-button bg-bg-100 px-3 py-2 font-lina text-small text-overlay-dark-40"
              >
                고정 채팅 준비 중
              </p>
              <ul v-else data-testid="pinned-chat-list" class="mt-3 space-y-2">
                <li
                  v-for="conversation in pinnedConversations"
                  :key="conversation.conversationId"
                  data-testid="pinned-conversation-list-item"
                  class="relative"
                  @mouseenter="hoveredConversationMenuId = conversation.conversationId"
                  @mouseleave="hoveredConversationMenuId = ''"
                >
                  <button
                    data-testid="conversation-list-item"
                    type="button"
                    class="w-full rounded-button py-2 pl-3 pr-10 text-left font-lina text-small transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
                    :class="
                      chatStore.activeConversationId === conversation.conversationId
                        ? 'bg-primary-50 text-primary'
                        : 'bg-bg-100 text-overlay-dark-80'
                    "
                    @click="selectConversation(conversation.conversationId)"
                  >
                    {{ conversation.title }}
                  </button>
                  <div
                    v-if="
                      hoveredConversationMenuId === conversation.conversationId ||
                      openConversationMenuId === conversation.conversationId
                    "
                    class="absolute right-1 top-1"
                  >
                    <ConversationActionMenu
                      :is-open="openConversationMenuId === conversation.conversationId"
                      :is-pinned="conversation.isPinned"
                      menu-label="고정 채팅 메뉴"
                      trigger-class="size-8 rounded-button"
                      trigger-test-id="conversation-menu-trigger"
                      @close="closeConversationMenu"
                      @delete="removeConversation(conversation)"
                      @pin="toggleConversationPin(conversation)"
                      @rename="renameConversation(conversation)"
                      @toggle="toggleConversationMenu(conversation.conversationId)"
                    />
                  </div>
                </li>
              </ul>
            </section>
            <section>
              <h2 class="font-lina text-small font-semibold text-overlay-dark-40">최근 채팅</h2>
              <p
                v-if="recentConversations.length === 0"
                class="mt-3 rounded-button bg-bg-100 px-3 py-2 font-lina text-small text-overlay-dark-40"
              >
                새 대화를 시작하세요
              </p>
              <ul v-else class="mt-3 space-y-2">
                <li
                  v-for="conversation in recentConversations"
                  :key="conversation.conversationId"
                  data-testid="recent-conversation-list-item"
                  class="relative"
                  @mouseenter="hoveredConversationMenuId = conversation.conversationId"
                  @mouseleave="hoveredConversationMenuId = ''"
                >
                  <button
                    data-testid="conversation-list-item"
                    type="button"
                    class="w-full rounded-button py-2 pl-3 pr-10 text-left font-lina text-small transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
                    :class="
                      chatStore.activeConversationId === conversation.conversationId
                        ? 'bg-primary-50 text-primary'
                        : 'bg-bg-100 text-overlay-dark-80'
                    "
                    @click="selectConversation(conversation.conversationId)"
                  >
                    {{ conversation.title }}
                  </button>
                  <div
                    v-if="
                      hoveredConversationMenuId === conversation.conversationId ||
                      openConversationMenuId === conversation.conversationId
                    "
                    class="absolute right-1 top-1"
                  >
                    <ConversationActionMenu
                      :is-open="openConversationMenuId === conversation.conversationId"
                      :is-pinned="conversation.isPinned"
                      menu-label="최근 채팅 메뉴"
                      trigger-class="size-8 rounded-button"
                      trigger-test-id="conversation-menu-trigger"
                      @close="closeConversationMenu"
                      @delete="removeConversation(conversation)"
                      @pin="toggleConversationPin(conversation)"
                      @rename="renameConversation(conversation)"
                      @toggle="toggleConversationMenu(conversation.conversationId)"
                    />
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </nav>

        <div data-testid="sidebar-footer" class="mt-auto shrink-0">
          <component :is="isSidebarOpen ? 'div' : BaseTooltip" label="설정 및 도움말">
            <button
              data-testid="settings-entry"
              type="button"
              class="m-4 inline-flex items-center gap-3 rounded-button font-lina text-small text-overlay-dark-80 transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
              :class="
                isSidebarOpen
                  ? 'w-[calc(100%-2rem)] justify-start px-1 py-1.5'
                  : 'size-8 justify-center'
              "
              aria-label="설정 및 도움말"
            >
              <Settings data-testid="settings-entry-icon" aria-hidden="true" class="size-4" />
              <span
                data-testid="settings-entry-label"
                :class="
                  isSidebarOpen && isSidebarContentVisible
                    ? 'font-lina text-small text-overlay-dark-80'
                    : 'sr-only'
                "
              >
                설정 및 도움말
              </span>
            </button>
          </component>
        </div>
      </aside>

      <section
        data-testid="chat-main"
        aria-label="Chat main"
        class="relative flex min-h-screen min-w-0 flex-1 flex-col"
      >
        <header
          class="sticky top-0 z-30 flex h-[76px] shrink-0 items-center justify-between bg-bg-100/95 px-6 backdrop-blur"
          :class="hasActiveConversation ? 'border-b border-bg-300' : 'border-b border-transparent'"
        >
          <template v-if="hasActiveConversation">
            <div class="min-w-0">
              <p
                data-testid="conversation-title"
                class="truncate font-lina text-[18px] font-bold leading-6 text-overlay-dark-80"
              >
                {{ currentConversationTitle }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <ConversationActionMenu
                v-if="currentConversation"
                :is-open="openConversationMenuId === currentConversation.conversationId"
                :is-pinned="currentConversation.isPinned"
                menu-label="현재 대화 메뉴"
                trigger-class="size-10 rounded-full"
                trigger-test-id="conversation-menu-button"
                @close="closeConversationMenu"
                @delete="removeConversation(currentConversation)"
                @pin="toggleConversationPin(currentConversation)"
                @rename="renameConversation(currentConversation)"
                @toggle="toggleConversationMenu(currentConversation.conversationId)"
              />
              <BaseTooltip label="계정 관리" placement="left">
                <button
                  data-testid="profile-entry"
                  type="button"
                  aria-label="계정 관리"
                  class="inline-flex size-10 items-center justify-center rounded-full bg-bg-200 text-overlay-dark-80 transition hover:brightness-95 focus-visible:outline-none focus-visible:shadow-focus"
                >
                  <img
                    v-if="profileImageUrl && !hasProfileImageLoadFailed"
                    data-testid="profile-entry-image"
                    :src="profileImageUrl"
                    alt=""
                    class="size-full rounded-full object-cover"
                    @error="hasProfileImageLoadFailed = true"
                  />
                  <User v-else data-testid="profile-entry-icon" aria-hidden="true" class="size-5" />
                </button>
              </BaseTooltip>
            </div>
          </template>
          <template v-else>
            <p class="font-lina text-heading font-bold text-overlay-dark-80">LINA</p>
            <BaseTooltip label="계정 관리" placement="left">
              <button
                data-testid="profile-entry"
                type="button"
                aria-label="계정 관리"
                class="inline-flex size-10 items-center justify-center rounded-full bg-bg-200 text-overlay-dark-80 transition hover:brightness-95 focus-visible:outline-none focus-visible:shadow-focus"
              >
                <img
                  v-if="profileImageUrl && !hasProfileImageLoadFailed"
                  data-testid="profile-entry-image"
                  :src="profileImageUrl"
                  alt=""
                  class="size-full rounded-full object-cover"
                  @error="hasProfileImageLoadFailed = true"
                />
                <User v-else data-testid="profile-entry-icon" aria-hidden="true" class="size-5" />
              </button>
            </BaseTooltip>
          </template>
        </header>

        <div class="flex flex-col">
          <div data-testid="chat-scroll-region" class="w-full overflow-x-clip pb-[220px]">
            <ChatEmptyState v-if="!hasActiveConversation" :user-name="userName" />
            <ChatConversationView
              v-else
              :messages="activeMessages"
              :editing-message-id="editingMessageId"
              :editing-content="editingContent"
              :is-streaming="chatStore.isStreaming"
              :streaming-message-id="chatStore.streamingMessageId"
              :resent-message-ids="[...resentMessageIds]"
              :user-message-version-indicators="userMessageVersionIndicators"
              @start-edit="startEditing"
              @cancel-edit="cancelEditing"
              @submit-edit="submitEditedMessage"
              @update-editing-content="editingContent = $event"
              @select-user-message-version="selectUserMessageVersion"
              @open-sources="openReferencePanelFromSourceButton"
              @open-feedback="openFeedbackModal"
            />
          </div>
          <div
            data-testid="chat-input-region"
            class="fixed bottom-0 z-20 shrink-0 bg-gradient-to-t from-bg-100 via-bg-100 to-transparent pt-4 transition-[left,right] duration-200"
            :class="[
              isSidebarOpen ? 'left-[264px]' : 'left-[76px]',
              isReferencePanelOpen ? 'right-[376px]' : 'right-0',
            ]"
          >
            <MessageInput
              :is-streaming="chatStore.isStreaming"
              @submit="submitMessage"
              @cancel="cancelStreaming"
            />
          </div>
        </div>

        <div data-testid="floating-help-wrapper" class="absolute bottom-6 right-6">
          <BaseTooltip label="도움말 열기" placement="left">
            <BaseFloatingIconButton
              data-testid="floating-help-button"
              v-bind="{ ariaLabel: '도움말 열기' }"
            >
              <HelpCircle aria-hidden="true" class="size-5" />
            </BaseFloatingIconButton>
          </BaseTooltip>
        </div>
      </section>

      <ReferencePanel
        v-if="isReferencePanelOpen"
        :sources="referenceSources"
        @close="closeReferencePanel"
      />
      <aside
        v-else
        data-testid="reference-panel"
        aria-label="Reference panel"
        aria-hidden="true"
        class="hidden border-l border-bg-300 p-4"
      >
        <p class="lina-body font-medium text-overlay-dark-80">Reference panel</p>
      </aside>
      <FeedbackModal
        v-if="feedbackTarget"
        :rating="feedbackTarget.rating"
        :is-submitting="isFeedbackSubmitting"
        @close="closeFeedbackModal"
        @submit="submitFeedback"
      />
      <ConversationSearchModal
        v-if="isSearchModalOpen"
        @close="closeSearchModal"
        @select="selectSearchResult"
      />
    </div>
  </main>
</template>
