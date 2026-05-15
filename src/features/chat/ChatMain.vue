<script setup lang="ts">
import EmptyState from '@/shared/EmptyState.vue';
import type { ChatMessage } from '@/types/api';

defineProps<{
  messages: ChatMessage[];
}>();
</script>

<template>
  <main class="flex min-w-0 flex-1 flex-col bg-bg-100">
    <div class="flex-1 overflow-y-auto p-8">
      <EmptyState
        v-if="messages.length === 0"
        title="환영합니다. 사용자님"
        description="무엇이든 물어보면 관련 Confluence 문서 출처와 함께 답변합니다."
      />

      <div v-else class="mx-auto flex max-w-3xl flex-col gap-default">
        <article
          v-for="message in messages"
          :key="message.messageId"
          class="rounded-item p-card text-body"
          :class="message.role === 'user' ? 'ml-auto bg-primary text-white' : 'mr-auto bg-bg-200'"
        >
          <p class="whitespace-pre-wrap">{{ message.content }}</p>
          <footer
            v-if="message.role === 'assistant'"
            class="mt-3 flex flex-wrap gap-tight text-small text-black/60"
          >
            <span>출처 {{ message.sources?.length ?? 0 }}개</span>
            <span>작성자 정보 없음</span>
            <span>{{ message.sources?.[0]?.updatedAt ?? '최신성 정보 없음' }}</span>
          </footer>
        </article>
      </div>
    </div>
  </main>
</template>
