<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat SCR-410/420/600 대화 메시지 목록 렌더링.
          ChatPage shell에서 대화 화면의 메시지 리스트와 버블 책임을 분리한다.
작성일 : 2026-05-21
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-21, feature9 보강, ChatConversationView 최초 작성
  - 2026-05-22, feature9 보강, store에서 계산한 streaming status text 전달 추가
  - 2026-05-22, feature9 SSE 보강, 메시지별 statusMessage 렌더링으로 prop 제거
  - 2026-05-22, SCR-420 보강, 수정 재전송 메시지 버전 indicator 전달 추가
  - 2026-05-22, SCR-420 보강, 사용자 메시지 version 선택 이벤트 전달 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import MessageBubble from '@/features/chat/MessageBubble.vue';
import type { Message, Source } from '@/types/api';

type UserMessageVersionIndicator = {
  activeIndex: number;
  total: number;
};

defineProps<{
  messages: Message[];
  editingMessageId: string;
  editingContent: string;
  isStreaming: boolean;
  streamingMessageId: string;
  resentMessageIds: string[];
  userMessageVersionIndicators: Record<string, UserMessageVersionIndicator>;
}>();

defineEmits<{
  startEdit: [message: Message];
  cancelEdit: [];
  submitEdit: [messageId: string];
  updateEditingContent: [content: string];
  selectUserMessageVersion: [messageId: string, versionIndex: number];
  openSources: [sources: Source[] | undefined];
}>();
</script>

<template>
  <div
    data-testid="message-list"
    class="mx-auto flex w-full max-w-[900px] min-w-0 flex-col gap-5 overflow-x-clip px-6 py-6"
    aria-live="polite"
  >
    <MessageBubble
      v-for="message in messages"
      :key="message.messageId"
      :message="message"
      :editing-message-id="editingMessageId"
      :editing-content="editingContent"
      :is-streaming="isStreaming"
      :streaming-message-id="streamingMessageId"
      :show-user-version-indicator="resentMessageIds.includes(message.messageId)"
      :user-version-active-index="userMessageVersionIndicators[message.messageId]?.activeIndex ?? 0"
      :user-version-total="userMessageVersionIndicators[message.messageId]?.total ?? 1"
      @start-edit="$emit('startEdit', $event)"
      @cancel-edit="$emit('cancelEdit')"
      @submit-edit="$emit('submitEdit', $event)"
      @update-editing-content="$emit('updateEditingContent', $event)"
      @select-user-message-version="
        (messageId, versionIndex) => $emit('selectUserMessageVersion', messageId, versionIndex)
      "
      @open-sources="$emit('openSources', $event)"
    />
  </div>
</template>
