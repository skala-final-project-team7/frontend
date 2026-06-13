<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat sidebar 컴포넌트.
          sidebar 렌더링, 열림/닫힘 UI 상태, 접힌 최근 대화 팝오버를 담당한다.
작성일 : 2026-06-04
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-04, feature10.5 구현, ChatPage sidebar 책임 분리
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import {
  MessageCircle,
  PanelLeftClose,
  PanelRightClose,
  Search,
  Settings,
  SquarePen,
} from '@lucide/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import ConversationActionMenu from '@/features/chat/ConversationActionMenu.vue';
import { mascotImageUrl } from '@/shared/assets';
import { BaseTooltip } from '@/shared';
import type { Conversation } from '@/types/api';

const props = defineProps<{
  activeConversationId: string;
  conversations: Conversation[];
  isOpen: boolean;
  openConversationMenuId: string;
  openConversationMenuSource: string;
}>();

const emit = defineEmits<{
  closeConversationMenu: [];
  openSettings: [];
  openSearchModal: [];
  removeConversation: [conversation: Conversation];
  renameConversation: [conversation: Conversation];
  selectConversation: [conversationId: string];
  startNewChat: [];
  toggleConversationMenu: [conversationId: string];
  toggleConversationPin: [conversation: Conversation];
  'update:isOpen': [isOpen: boolean];
}>();

const isSidebarMascotHovered = ref(false);
const isSidebarContentVisible = ref(false);
const hoveredConversationMenuId = ref('');
const isCollapsedConversationPopoverOpen = ref(false);
const route = useRoute();
const router = useRouter();
let sidebarContentTimer: number | undefined;

const pinnedConversations = computed(() =>
  props.conversations.filter((conversation) => conversation.isPinned),
);
const recentConversations = computed(() =>
  props.conversations.filter((conversation) => !conversation.isPinned),
);
const collapsedConversationPreviewList = computed(() => props.conversations.slice(0, 10));

function getConversationRouteId(conversation: Conversation): string {
  return conversation.conversationId;
}

function getConversationRoutePath(conversation: Conversation): string {
  const conversationId = getConversationRouteId(conversation);

  return conversationId ? `/chat/${encodeURIComponent(conversationId)}` : '/chat';
}

function toggleSidebar() {
  emit('update:isOpen', !props.isOpen);
}

function startNewChat() {
  closeCollapsedConversationPopover();
  emit('startNewChat');
}

function openSearchModal() {
  emit('openSearchModal');
}

function openSettings() {
  emit('openSettings');
}

function selectConversation(conversationId: string) {
  closeCollapsedConversationPopover();
  emit('selectConversation', conversationId);
}

async function handleSelectCollapsedConversation(conversationId: string, event?: Event) {
  event?.preventDefault();

  if (!conversationId) {
    return;
  }

  try {
    await router.push({
      name: 'chat-conversation',
      params: {
        conversationId,
      },
    });
  } catch {
    // Vue Router may ignore duplicated navigation; the visible state is handled by route watcher.
  }
}

function getEventTargetElement(event: Event): Element | null {
  const target = event.target;

  if (target instanceof Element) {
    return target;
  }

  if (target instanceof Node) {
    return target.parentElement;
  }

  return null;
}

function closeCollapsedConversationPopover() {
  isCollapsedConversationPopoverOpen.value = false;
}

function toggleCollapsedConversationPopover() {
  isCollapsedConversationPopoverOpen.value = !isCollapsedConversationPopoverOpen.value;
}

function closeConversationMenuFromOutside(event: PointerEvent) {
  const target = getEventTargetElement(event);

  if (!target) {
    emit('closeConversationMenu');
    return;
  }

  if (target.closest('[data-conversation-menu-root]')) {
    return;
  }

  if (target.closest('[data-collapsed-conversation-popover-root]')) {
    return;
  }

  emit('closeConversationMenu');
}

function closeCollapsedConversationPopoverFromOutside(event: MouseEvent) {
  const target = getEventTargetElement(event);

  if (!target) {
    closeCollapsedConversationPopover();
    return;
  }

  if (target.closest('[data-collapsed-conversation-popover-root]')) {
    return;
  }

  closeCollapsedConversationPopover();
}

function closeCollapsedConversationPopoverOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeCollapsedConversationPopover();
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
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
  },
);

watch(
  () => route.fullPath,
  async () => {
    await nextTick();
    closeCollapsedConversationPopover();
  },
);

onMounted(() => {
  document.addEventListener('pointerdown', closeConversationMenuFromOutside);
  document.addEventListener('click', closeCollapsedConversationPopoverFromOutside);
  document.addEventListener('keydown', closeCollapsedConversationPopoverOnEscape);
});

onBeforeUnmount(() => {
  if (sidebarContentTimer) {
    window.clearTimeout(sidebarContentTimer);
  }

  document.removeEventListener('pointerdown', closeConversationMenuFromOutside);
  document.removeEventListener('click', closeCollapsedConversationPopoverFromOutside);
  document.removeEventListener('keydown', closeCollapsedConversationPopoverOnEscape);
});
</script>

<template>
  <aside
    data-testid="chat-sidebar"
    :data-state="isOpen ? 'expanded' : 'collapsed'"
    aria-label="Chat sidebar"
    class="sticky top-0 z-50 flex h-screen shrink-0 flex-col border-r border-bg-300 transition-[width] duration-200"
    :class="isOpen ? 'w-[264px] bg-bg-100' : 'w-[76px] bg-primary-white'"
  >
    <div
      v-if="isOpen && isSidebarContentVisible"
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
      <div v-if="isOpen && isSidebarContentVisible" class="space-y-3">
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
            class="absolute left-12 top-0 z-[80] w-[264px] rounded-card border border-bg-300 bg-primary-white px-4 py-4 shadow-floating"
            @click.stop
            @mousedown.stop
            @pointerdown.stop
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
                <RouterLink v-slot="{ href }" custom :to="getConversationRoutePath(conversation)">
                  <a
                    data-testid="collapsed-conversation-popover-item"
                    :href="href"
                    role="menuitem"
                    class="block w-full truncate rounded-button px-2 py-2 text-left font-lina text-small text-overlay-dark-80 transition hover:bg-bg-100 focus-visible:outline-none focus-visible:shadow-focus"
                    @click.stop.prevent="
                      handleSelectCollapsedConversation(
                        getConversationRouteId(conversation),
                        $event,
                      )
                    "
                    @mousedown.stop.prevent="
                      handleSelectCollapsedConversation(
                        getConversationRouteId(conversation),
                        $event,
                      )
                    "
                    @pointerdown.stop.prevent="
                      handleSelectCollapsedConversation(
                        getConversationRouteId(conversation),
                        $event,
                      )
                    "
                  >
                    {{ conversation.title }}
                  </a>
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>
      </template>

      <div v-if="isOpen && isSidebarContentVisible" class="mt-6 space-y-7">
        <section v-if="pinnedConversations.length > 0">
          <h2 class="font-lina text-small font-semibold text-overlay-dark-40">고정 채팅</h2>
          <ul data-testid="pinned-chat-list" class="mt-3 space-y-2">
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
                  activeConversationId === conversation.conversationId
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
                  (openConversationMenuSource === 'sidebar' &&
                    openConversationMenuId === conversation.conversationId)
                "
                class="absolute right-1 top-1"
              >
                <ConversationActionMenu
                  :is-open="
                    openConversationMenuSource === 'sidebar' &&
                    openConversationMenuId === conversation.conversationId
                  "
                  :is-pinned="conversation.isPinned"
                  menu-label="고정 채팅 메뉴"
                  trigger-class="size-8 rounded-button"
                  trigger-test-id="conversation-menu-trigger"
                  @close="emit('closeConversationMenu')"
                  @delete="emit('removeConversation', conversation)"
                  @pin="emit('toggleConversationPin', conversation)"
                  @rename="emit('renameConversation', conversation)"
                  @toggle="emit('toggleConversationMenu', conversation.conversationId)"
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
                  activeConversationId === conversation.conversationId
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
                  (openConversationMenuSource === 'sidebar' &&
                    openConversationMenuId === conversation.conversationId)
                "
                class="absolute right-1 top-1"
              >
                <ConversationActionMenu
                  :is-open="
                    openConversationMenuSource === 'sidebar' &&
                    openConversationMenuId === conversation.conversationId
                  "
                  :is-pinned="conversation.isPinned"
                  menu-label="최근 채팅 메뉴"
                  trigger-class="size-8 rounded-button"
                  trigger-test-id="conversation-menu-trigger"
                  @close="emit('closeConversationMenu')"
                  @delete="emit('removeConversation', conversation)"
                  @pin="emit('toggleConversationPin', conversation)"
                  @rename="emit('renameConversation', conversation)"
                  @toggle="emit('toggleConversationMenu', conversation.conversationId)"
                />
              </div>
            </li>
          </ul>
        </section>
      </div>
    </nav>

    <div data-testid="sidebar-footer" class="mt-auto shrink-0">
      <component :is="isOpen ? 'div' : BaseTooltip" label="설정 및 도움말">
        <button
          data-testid="settings-entry"
          type="button"
          class="m-4 inline-flex items-center gap-3 rounded-button font-lina text-small text-overlay-dark-80 transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
          :class="
            isOpen ? 'w-[calc(100%-2rem)] justify-start px-1 py-1.5' : 'size-8 justify-center'
          "
          aria-label="설정 및 도움말"
          @click="openSettings"
        >
          <Settings data-testid="settings-entry-icon" aria-hidden="true" class="size-4" />
          <span
            data-testid="settings-entry-label"
            :class="
              isOpen && isSidebarContentVisible
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
</template>
