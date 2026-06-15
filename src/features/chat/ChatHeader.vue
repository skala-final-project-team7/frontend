<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat 상단 header 컴포넌트.
          empty/conversation header 분기와 프로필 affordance 렌더링을 담당한다.
작성일 : 2026-06-04
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-04, feature10.5 구현, ChatPage header 책임 분리
  - 2026-06-12, feature18 보정, 프로필 클릭 시 계정 관리 이동 연결
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { User } from '@lucide/vue';
import { ref, watch } from 'vue';

import ConversationActionMenu from '@/features/chat/ConversationActionMenu.vue';
import { BaseTooltip } from '@/shared';
import type { Conversation } from '@/types/api';

const props = defineProps<{
  currentConversation?: Conversation;
  currentConversationTitle: string;
  hasActiveConversation: boolean;
  openConversationMenuId: string;
  openConversationMenuSource: string;
  profileImageUrl: string;
}>();

const emit = defineEmits<{
  closeConversationMenu: [];
  openSettings: [];
  removeConversation: [conversation: Conversation];
  renameConversation: [conversation: Conversation];
  toggleConversationMenu: [conversationId: string];
  toggleConversationPin: [conversation: Conversation];
}>();

const hasProfileImageLoadFailed = ref(false);

watch(
  () => props.profileImageUrl,
  () => {
    hasProfileImageLoadFailed.value = false;
  },
);
</script>

<template>
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
          :is-open="
            openConversationMenuSource === 'header' &&
            openConversationMenuId === currentConversation.conversationId
          "
          :is-pinned="currentConversation.isPinned"
          menu-label="현재 대화 메뉴"
          trigger-class="size-10 rounded-full"
          trigger-test-id="conversation-menu-button"
          @close="emit('closeConversationMenu')"
          @delete="emit('removeConversation', currentConversation)"
          @pin="emit('toggleConversationPin', currentConversation)"
          @rename="emit('renameConversation', currentConversation)"
          @toggle="emit('toggleConversationMenu', currentConversation.conversationId)"
        />
        <BaseTooltip label="계정 관리" placement="left">
          <button
            data-testid="profile-entry"
            type="button"
            aria-label="계정 관리"
            class="inline-flex size-10 items-center justify-center rounded-full bg-bg-200 text-overlay-dark-80 transition hover:brightness-95 focus-visible:outline-none focus-visible:shadow-focus"
            @click="emit('openSettings')"
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
          @click="emit('openSettings')"
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
</template>
