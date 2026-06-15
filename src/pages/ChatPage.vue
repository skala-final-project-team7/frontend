<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat 화면의 route/page shell 구성.
          sidebar/header/submission/route sync는 feature 컴포넌트와 composable에 위임한다.
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
  - 2026-06-04, feature10.5 구현, ChatPage 책임을 shell 조립 중심으로 분리
  - 2026-06-12, feature18 구현, Settings 모달 진입 상태 연결
  - 2026-06-12, feature18 보정, 프로필 클릭 설정 진입과 floating 도움말 버튼 모달 연결
  - 2026-06-12, feature18 보정, floating 도움말 버튼을 fixed z-30으로 올려 입력 영역에 가려지지 않게 수정
  - 2026-06-12, feature18 보정, floating 도움말 버튼을 새 대화 화면에서만 bottom-10 위치로 표시
  - 2026-06-12, 레이아웃 보정, 새 대화 화면 scroll-region을 viewport 높이로 고정해 불필요한 스크롤 제거
  - 2026-06-12, 레이아웃 보정, 빈 화면 scroll-region flex 스트레치 제거로 ASK LINA 상단 정렬 복원
  - 2026-06-15, feature11 구현, 대화 목록/메시지 이력 loading-error-retry 상태와 Bearer 인증 연동 UI 보강
  - 2026-06-15, feature11 구현, 첫 질문 대화 생성 실패용 retry error state 추가
  - 2026-06-15, feature11 구현, assistant 피드백 성공 후 선택 상태 고정 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { ArrowDown, HelpCircle } from '@lucide/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  deleteConversation,
  getCurrentUser,
  listConversations,
  submitMessageFeedback,
  updateConversationTitle,
} from '@/api';
import { useChatRouteSync } from '@/composables/useChatRouteSync';
import { useChatSubmission } from '@/composables/useChatSubmission';
import ChatConversationView from '@/features/chat/ChatConversationView.vue';
import ChatEmptyState from '@/features/chat/ChatEmptyState.vue';
import ChatHeader from '@/features/chat/ChatHeader.vue';
import ChatSidebar from '@/features/chat/ChatSidebar.vue';
import ConversationDeleteConfirmModal from '@/features/chat/ConversationDeleteConfirmModal.vue';
import ConversationSearchModal from '@/features/chat/ConversationSearchModal.vue';
import FeedbackModal from '@/features/chat/FeedbackModal.vue';
import MessageInput from '@/features/chat/MessageInput.vue';
import ReferencePanel from '@/features/chat/ReferencePanel.vue';
import SettingsHelpModal from '@/features/settings/SettingsHelpModal.vue';
import SettingsModal from '@/features/settings/SettingsModal.vue';
import { useToast } from '@/composables/useToast';
import { BaseFloatingIconButton, BaseSpinner, BaseTooltip, ErrorRetryState } from '@/shared';
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

type ConversationMenuSource = 'header' | 'sidebar';

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();
const { showToast } = useToast();

const isSidebarOpen = ref(false);
const isInitialLoading = ref(true);
const initialLoadErrorMessage = ref('');
const isMessageHistoryLoading = ref(false);
const messageHistoryErrorMessage = ref('');
const initialSubmitErrorMessage = ref('');
const pendingInitialSubmitQuestion = ref('');
const userName = ref('00');
const userLastLoginAt = ref('');
const profileImageUrl = ref('');
const conversations = ref<Conversation[]>([]);
const editingMessageId = ref('');
const editingContent = ref('');
const resentMessageIds = ref<Set<string>>(new Set());
const userMessageVersionsById = ref<Record<string, UserMessageVersionState>>({});
const isReferencePanelOpen = ref(false);
const referenceSources = ref<Source[]>([]);
const openConversationMenuId = ref('');
const openConversationMenuSource = ref<ConversationMenuSource | ''>('');
const feedbackTarget = ref<FeedbackTarget | null>(null);
const isFeedbackSubmitting = ref(false);
const pendingFeedbackMessageId = ref('');
const pendingFeedbackRating = ref<FeedbackRating | ''>('');
const selectedFeedbackRatingsByMessageId = ref<Record<string, FeedbackRating>>({});
const isSearchModalOpen = ref(false);
const isSettingsModalOpen = ref(false);
const isHelpModalOpen = ref(false);
const pendingDeleteConversation = ref<Conversation | null>(null);
const isDeleteConversationSubmitting = ref(false);
const isScrollToLatestVisible = ref(false);

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

function openSearchModal() {
  isSearchModalOpen.value = true;
}

function closeSearchModal() {
  isSearchModalOpen.value = false;
}

function openSettingsModal() {
  isSettingsModalOpen.value = true;
}

function closeSettingsModal() {
  isSettingsModalOpen.value = false;
}

function openHelpModal() {
  isHelpModalOpen.value = true;
}

function closeHelpModal() {
  isHelpModalOpen.value = false;
}

function getDocumentScrollHeight() {
  return Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight,
  );
}

function updateScrollToLatestVisibility() {
  if (!hasActiveConversation.value) {
    isScrollToLatestVisible.value = false;
    return;
  }

  const distanceFromBottom = getDocumentScrollHeight() - (window.scrollY + window.innerHeight);

  isScrollToLatestVisible.value = distanceFromBottom > 180;
}

function scrollToLatestMessage() {
  window.scrollTo({
    behavior: 'smooth',
    top: getDocumentScrollHeight(),
  });
}

async function selectSearchResult(conversationId: string) {
  closeSearchModal();
  await router.push({
    name: 'chat-conversation',
    params: {
      conversationId,
    },
  });
}

async function startNewChat() {
  await router.push({
    name: 'chat',
  });
}

async function selectConversation(conversationId: string) {
  closeConversationMenu();
  await router.push({
    name: 'chat-conversation',
    params: {
      conversationId,
    },
  });
}

function closeConversationMenu() {
  openConversationMenuId.value = '';
  openConversationMenuSource.value = '';
}

function toggleConversationMenu(conversationId: string, source: ConversationMenuSource) {
  const isSameMenu =
    openConversationMenuId.value === conversationId && openConversationMenuSource.value === source;

  openConversationMenuId.value = isSameMenu ? '' : conversationId;
  openConversationMenuSource.value = isSameMenu ? '' : source;
}

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

async function removeConversation(conversation: Conversation) {
  pendingDeleteConversation.value = conversation;
  closeConversationMenu();
}

function closeDeleteConversationModal() {
  if (isDeleteConversationSubmitting.value) {
    return;
  }

  pendingDeleteConversation.value = null;
}

async function confirmRemoveConversation() {
  const conversation = pendingDeleteConversation.value;

  if (!conversation || isDeleteConversationSubmitting.value) {
    return;
  }

  isDeleteConversationSubmitting.value = true;

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
    isDeleteConversationSubmitting.value = false;
    pendingDeleteConversation.value = null;
    closeConversationMenu();
  }
}

function resetMessageDraftState() {
  editingMessageId.value = '';
  editingContent.value = '';
  resentMessageIds.value = new Set();
  userMessageVersionsById.value = {};
}

function clearInitialSubmitError() {
  initialSubmitErrorMessage.value = '';
  pendingInitialSubmitQuestion.value = '';
}

const { submitMessage } = useChatSubmission({
  chatStore,
  conversations,
  onInitialConversationCreateError: (question) => {
    pendingInitialSubmitQuestion.value = question;
    initialSubmitErrorMessage.value = '대화를 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  },
  onSubmitStart: clearInitialSubmitError,
  onSubmitSuccess: clearInitialSubmitError,
  routeConversationId,
  router,
  showToast,
});

async function retryInitialSubmit() {
  if (!pendingInitialSubmitQuestion.value) {
    return;
  }

  await submitMessage(pendingInitialSubmitQuestion.value);
}

const { reloadRouteConversationMessages } = useChatRouteSync({
  chatStore,
  closeConversationMenu,
  closeReferencePanel,
  onConversationCleared: () => {
    isMessageHistoryLoading.value = false;
    messageHistoryErrorMessage.value = '';
  },
  onConversationLoadError: () => {
    isMessageHistoryLoading.value = false;
    messageHistoryErrorMessage.value =
      '메시지 이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
  },
  onConversationLoadStart: () => {
    isMessageHistoryLoading.value = true;
    messageHistoryErrorMessage.value = '';
  },
  onConversationLoadSuccess: () => {
    isMessageHistoryLoading.value = false;
    messageHistoryErrorMessage.value = '';
  },
  resetMessageDraftState,
  routeConversationId,
});

function startEditing(message: Message) {
  editingMessageId.value = message.messageId;
  editingContent.value = message.content;
}

function cancelEditing() {
  editingMessageId.value = '';
  editingContent.value = '';
}

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

async function retryAssistantMessage(message: Message) {
  const assistantMessageIndex = activeMessages.value.findIndex(
    (currentMessage) => currentMessage.messageId === message.messageId,
  );

  if (assistantMessageIndex <= 0) {
    return;
  }

  const previousUserMessage = [...activeMessages.value]
    .slice(0, assistantMessageIndex)
    .reverse()
    .find((currentMessage) => currentMessage.role === 'user');

  if (!previousUserMessage) {
    return;
  }

  await submitMessage(previousUserMessage.content);
}

function openReferencePanelFromSourceButton(sources: Source[] | undefined) {
  if (!sources?.length) {
    return;
  }

  referenceSources.value = sources;
  isReferencePanelOpen.value = true;
  isSidebarOpen.value = false;
}

function closeReferencePanel() {
  isReferencePanelOpen.value = false;
  referenceSources.value = [];
}

async function openFeedbackModal(message: Message, rating: FeedbackRating) {
  if (rating === 'LIKE') {
    if (isFeedbackSubmitting.value) {
      return;
    }

    isFeedbackSubmitting.value = true;
    pendingFeedbackMessageId.value = message.messageId;
    pendingFeedbackRating.value = rating;

    try {
      await submitMessageFeedback(message.messageId, {
        rating: 'LIKE',
      });
      selectedFeedbackRatingsByMessageId.value = {
        ...selectedFeedbackRatingsByMessageId.value,
        [message.messageId]: 'LIKE',
      };
    } catch {
      showToast('피드백 제출에 실패했습니다', { variant: 'error' });
    } finally {
      isFeedbackSubmitting.value = false;
      pendingFeedbackMessageId.value = '';
      pendingFeedbackRating.value = '';
    }

    return;
  }

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
  pendingFeedbackMessageId.value = target.messageId;
  pendingFeedbackRating.value = target.rating;

  try {
    await submitMessageFeedback(target.messageId, {
      rating: target.rating,
      comment,
    });
    selectedFeedbackRatingsByMessageId.value = {
      ...selectedFeedbackRatingsByMessageId.value,
      [target.messageId]: target.rating,
    };
    feedbackTarget.value = null;
  } catch {
    showToast('피드백 제출에 실패했습니다', { variant: 'error' });
  } finally {
    isFeedbackSubmitting.value = false;
    pendingFeedbackMessageId.value = '';
    pendingFeedbackRating.value = '';
  }
}

async function loadInitialChatData() {
  isInitialLoading.value = true;
  initialLoadErrorMessage.value = '';

  try {
    const [currentUser, conversationList] = await Promise.all([
      getCurrentUser(),
      listConversations(),
    ]);

    userName.value = currentUser.name;
    userLastLoginAt.value = currentUser.lastLoginAt;
    profileImageUrl.value = currentUser.profileImageUrl;
    conversations.value = conversationList.conversations;
  } catch {
    userName.value = '00';
    userLastLoginAt.value = '';
    profileImageUrl.value = '';
    conversations.value = [];
    initialLoadErrorMessage.value =
      '대화 목록을 불러오지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.';
  } finally {
    isInitialLoading.value = false;
  }
}

onMounted(async () => {
  window.addEventListener('scroll', updateScrollToLatestVisibility, { passive: true });
  window.addEventListener('resize', updateScrollToLatestVisibility);

  await loadInitialChatData();
  await nextTick();
  updateScrollToLatestVisibility();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrollToLatestVisibility);
  window.removeEventListener('resize', updateScrollToLatestVisibility);
});

watch(
  () => ({ ...chatStore.conversationTitlesById }),
  (conversationTitlesById) => {
    conversations.value = conversations.value.map((conversation) => {
      const title = conversationTitlesById[conversation.conversationId];

      return title ? { ...conversation, title } : conversation;
    });
  },
);

watch(
  () => [hasActiveConversation.value, activeMessages.value.length],
  async () => {
    await nextTick();
    updateScrollToLatestVisibility();
  },
);
</script>

<template>
  <main data-testid="chat-page" class="lina-app-layout min-h-screen overflow-x-clip bg-bg-100">
    <div class="flex min-h-screen items-start">
      <ChatSidebar
        v-model:is-open="isSidebarOpen"
        :active-conversation-id="chatStore.activeConversationId"
        :conversations="conversations"
        :open-conversation-menu-id="openConversationMenuId"
        :open-conversation-menu-source="openConversationMenuSource"
        @close-conversation-menu="closeConversationMenu"
        @open-settings="openSettingsModal"
        @open-search-modal="openSearchModal"
        @remove-conversation="removeConversation"
        @rename-conversation="renameConversation"
        @select-conversation="selectConversation"
        @start-new-chat="startNewChat"
        @toggle-conversation-menu="
          (conversationId) => toggleConversationMenu(conversationId, 'sidebar')
        "
        @toggle-conversation-pin="toggleConversationPin"
      />

      <section
        data-testid="chat-main"
        aria-label="Chat main"
        class="relative flex min-h-screen min-w-0 flex-1 flex-col"
      >
        <ChatHeader
          :current-conversation="currentConversation"
          :current-conversation-title="currentConversationTitle"
          :has-active-conversation="hasActiveConversation"
          :open-conversation-menu-id="openConversationMenuId"
          :open-conversation-menu-source="openConversationMenuSource"
          :profile-image-url="profileImageUrl"
          @close-conversation-menu="closeConversationMenu"
          @open-settings="openSettingsModal"
          @remove-conversation="removeConversation"
          @rename-conversation="renameConversation"
          @toggle-conversation-menu="
            (conversationId) => toggleConversationMenu(conversationId, 'header')
          "
          @toggle-conversation-pin="toggleConversationPin"
        />

        <div class="flex flex-col">
          <div
            data-testid="chat-scroll-region"
            class="w-full overflow-x-clip"
            :class="hasActiveConversation ? 'pb-[220px]' : 'h-[calc(100vh-76px)] overflow-y-hidden'"
          >
            <div
              v-if="isInitialLoading && !hasActiveConversation"
              class="flex min-h-[calc(100vh-76px)] items-center justify-center px-6"
            >
              <BaseSpinner label="대화 목록을 불러오고 있어요" />
            </div>
            <ErrorRetryState
              v-else-if="initialLoadErrorMessage && !hasActiveConversation"
              data-testid="chat-initial-load-error"
              title="대화 목록을 불러오지 못했습니다"
              :message="initialLoadErrorMessage"
              retry-label="다시 불러오기"
              @retry="loadInitialChatData"
            />
            <ErrorRetryState
              v-else-if="initialSubmitErrorMessage && !hasActiveConversation"
              data-testid="chat-start-submit-error"
              title="메시지를 전송하지 못했습니다"
              :message="initialSubmitErrorMessage"
              retry-label="다시 시도"
              @retry="retryInitialSubmit"
            />
            <div
              v-else-if="
                hasActiveConversation && isMessageHistoryLoading && activeMessages.length === 0
              "
              class="flex min-h-[calc(100vh-76px)] items-center justify-center px-6"
            >
              <BaseSpinner label="메시지 이력을 불러오고 있어요" />
            </div>
            <ErrorRetryState
              v-else-if="
                hasActiveConversation && messageHistoryErrorMessage && activeMessages.length === 0
              "
              data-testid="chat-message-history-error"
              title="메시지 이력을 불러오지 못했습니다"
              :message="messageHistoryErrorMessage"
              retry-label="다시 불러오기"
              @retry="reloadRouteConversationMessages"
            />
            <ChatEmptyState v-else-if="!hasActiveConversation" :user-name="userName" />
            <ChatConversationView
              v-else
              :messages="activeMessages"
              :editing-message-id="editingMessageId"
              :editing-content="editingContent"
              :pending-feedback-message-id="pendingFeedbackMessageId"
              :pending-feedback-rating="pendingFeedbackRating"
              :selected-feedback-ratings-by-message-id="selectedFeedbackRatingsByMessageId"
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
              @retry-assistant-message="retryAssistantMessage"
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
            <MessageInput :is-streaming="chatStore.isStreaming" @submit="submitMessage" />
          </div>
          <div
            v-if="hasActiveConversation && isScrollToLatestVisible"
            data-testid="scroll-to-latest-wrapper"
            class="pointer-events-none fixed bottom-[148px] z-30 flex justify-center transition-[left,right] duration-200"
            :class="[
              isSidebarOpen ? 'left-[264px]' : 'left-[76px]',
              isReferencePanelOpen ? 'right-[376px]' : 'right-0',
            ]"
          >
            <BaseTooltip label="최신 메시지로 이동" placement="top">
              <button
                data-testid="scroll-to-latest-button"
                type="button"
                aria-label="최신 메시지로 이동"
                class="pointer-events-auto inline-flex size-11 items-center justify-center rounded-full border border-bg-300 bg-primary-white text-overlay-dark-80 shadow-floating transition hover:bg-bg-100 focus-visible:outline-none focus-visible:shadow-focus"
                @click="scrollToLatestMessage"
              >
                <ArrowDown aria-hidden="true" class="size-5" />
              </button>
            </BaseTooltip>
          </div>
        </div>

        <div
          v-if="!hasActiveConversation"
          data-testid="floating-help-wrapper"
          class="fixed bottom-10 right-6 z-30"
        >
          <BaseTooltip label="도움말" placement="left">
            <BaseFloatingIconButton
              data-testid="floating-help-button"
              v-bind="{ ariaLabel: '도움말' }"
              @click="openHelpModal"
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
      <SettingsModal
        :current-user-last-login-at="userLastLoginAt"
        :current-user-name="userName"
        :is-open="isSettingsModalOpen"
        @close="closeSettingsModal"
      />
      <SettingsHelpModal :is-open="isHelpModalOpen" @close="closeHelpModal" />
      <ConversationDeleteConfirmModal
        :conversation-title="pendingDeleteConversation?.title ?? ''"
        :is-open="pendingDeleteConversation !== null"
        :is-submitting="isDeleteConversationSubmitting"
        @cancel="closeDeleteConversationModal"
        @confirm="confirmRemoveConversation"
      />
    </div>
  </main>
</template>
