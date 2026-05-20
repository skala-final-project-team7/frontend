<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat 화면의 SCR-400 기본 화면 구성.
          Sidebar 기본 상태, ChatEmptyState, MessageInput, SettingsEntry를 배치한다.
작성일 : 2026-05-18
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-18, feature3 구현, Chat shell placeholder 영역 추가
  - 2026-05-20, feature8 구현, SCR-400 기본 채팅 화면으로 placeholder 교체
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
  PanelLeft,
  PanelLeftClose,
  Search,
  Settings,
  SquarePen,
  User,
} from '@lucide/vue';
import { onMounted, ref } from 'vue';

import { getCurrentUser, listConversations } from '@/api';
import ChatEmptyState from '@/features/chat/ChatEmptyState.vue';
import MessageInput from '@/features/chat/MessageInput.vue';
import { mascotImageUrl } from '@/shared/assets';
import { BaseFloatingIconButton, BaseTooltip } from '@/shared';
import type { Conversation } from '@/types/api';

const isSidebarOpen = ref(false);
const isSidebarMascotHovered = ref(false);
const userName = ref('00');
const profileImageUrl = ref('');
const hasProfileImageLoadFailed = ref(false);
const recentConversations = ref<Conversation[]>([]);
const pinnedChatsPlaceholder = '고정 채팅 준비 중';
// TODO(feature8): 고정 채팅 API 명세가 정의되면 pinned conversations를 연결한다.

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
}

// TODO: 채팅 검색 모달 구현 (feature 예정)
function openSearchModal() {}

onMounted(async () => {
  try {
    const [currentUser, conversationList] = await Promise.all([
      getCurrentUser(),
      listConversations(),
    ]);

    userName.value = currentUser.name;
    profileImageUrl.value = currentUser.profileImageUrl;
    hasProfileImageLoadFailed.value = false;
    recentConversations.value = conversationList.conversations;
  } catch {
    userName.value = '00';
    profileImageUrl.value = '';
    hasProfileImageLoadFailed.value = false;
    recentConversations.value = [];
  }
});
</script>

<template>
  <main data-testid="chat-page" class="lina-app-layout max-h-screen overflow-hidden bg-bg-100">
    <div class="flex h-screen">
      <aside
        data-testid="chat-sidebar"
        :data-state="isSidebarOpen ? 'expanded' : 'collapsed'"
        aria-label="Chat sidebar"
        class="flex shrink-0 flex-col border-r border-bg-300 bg-primary-white transition-[width] duration-200"
        :class="isSidebarOpen ? 'w-[264px]' : 'w-[76px]'"
      >
        <div
          v-if="isSidebarOpen"
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
              <PanelLeft
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
          <div v-if="isSidebarOpen" class="space-y-3">
            <button
              data-testid="expanded-new-chat-button"
              type="button"
              class="inline-flex w-full items-center gap-3 rounded-button px-1 py-1.5 font-lina text-small text-overlay-dark-80 transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
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
              >
                <Search aria-hidden="true" class="size-4" />
              </button>
            </BaseTooltip>
            <BaseTooltip label="채팅 목록">
              <button
                data-testid="collapsed-sidebar-action"
                type="button"
                aria-label="채팅 목록"
                class="inline-flex size-8 shrink-0 items-center justify-center rounded-button border border-transparent bg-transparent text-overlay-dark-80 transition hover:bg-bg-200 active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-focus"
              >
                <MessageCircle aria-hidden="true" class="size-4" />
              </button>
            </BaseTooltip>
          </template>

          <div v-if="isSidebarOpen" class="mt-6 space-y-7">
            <section>
              <h2 class="font-lina text-small font-semibold text-overlay-dark-40">고정 채팅</h2>
              <p
                data-testid="pinned-chats-placeholder"
                class="mt-3 rounded-button bg-bg-100 px-3 py-2 font-lina text-small text-overlay-dark-40"
              >
                {{ pinnedChatsPlaceholder }}
              </p>
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
                <li v-for="conversation in recentConversations" :key="conversation.conversationId">
                  <p
                    class="rounded-button bg-bg-100 px-3 py-2 font-lina text-small text-overlay-dark-80"
                  >
                    {{ conversation.title }}
                  </p>
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
              :class="isSidebarOpen ? 'w-[calc(100%-2rem)] justify-start px-1 py-1.5' : 'size-8 justify-center'"
              aria-label="설정 및 도움말"
            >
              <Settings data-testid="settings-entry-icon" aria-hidden="true" class="size-4" />
              <span
                data-testid="settings-entry-label"
                :class="isSidebarOpen ? 'font-lina text-small text-overlay-dark-80' : 'sr-only'"
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
        class="relative flex min-w-0 flex-1 flex-col"
      >
        <header class="flex h-[76px] items-center justify-between px-6">
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
        </header>

        <div class="flex min-h-0 flex-1 flex-col">
          <ChatEmptyState :user-name="userName" />
          <MessageInput />
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

      <aside
        data-testid="reference-panel"
        aria-label="Reference panel"
        aria-hidden="true"
        class="hidden border-l border-bg-300 p-4"
      >
        <p class="lina-body font-medium text-overlay-dark-80">Reference panel</p>
      </aside>
    </div>
  </main>
</template>
