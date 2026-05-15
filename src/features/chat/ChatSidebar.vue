<script setup lang="ts">
import type { ConversationSummary } from '@/types/api';

defineProps<{
  conversations: ConversationSummary[];
  activeConversationId: string | null;
}>();

defineEmits<{
  select: [conversationId: string];
}>();
</script>

<template>
  <aside class="flex h-full w-72 flex-col border-r border-dark-10 bg-bg-200 p-card">
    <div class="flex items-center justify-between gap-default">
      <strong class="text-body font-semibold">ASK LINA</strong>
      <span class="text-small text-black/50">Chat</span>
    </div>

    <label class="mt-default text-small text-black/60" for="chat-search">채팅 검색</label>
    <input
      id="chat-search"
      class="mt-1 rounded-button border border-dark-10 bg-primary-white px-3 py-2 text-body outline-none focus:border-primary"
      placeholder="채팅 검색"
      type="search"
    />

    <nav class="mt-default flex flex-1 flex-col gap-tight" aria-label="채팅 목록">
      <button
        v-for="conversation in conversations"
        :key="conversation.conversationId"
        type="button"
        class="rounded-item px-3 py-2 text-left text-body transition hover:bg-dark-04 focus:outline-none focus:ring-2 focus:ring-primary"
        :class="{
          'bg-primary-light': conversation.conversationId === activeConversationId,
        }"
        @click="$emit('select', conversation.conversationId)"
      >
        <span class="block truncate font-semibold">{{ conversation.title }}</span>
        <span class="block text-small text-black/50">
          메시지 {{ conversation.messageCount }}개
        </span>
      </button>
    </nav>

    <button
      type="button"
      class="mt-default rounded-button border border-dark-10 bg-primary-white px-3 py-2 text-left text-body"
    >
      설정 및 도움말
    </button>
  </aside>
</template>
