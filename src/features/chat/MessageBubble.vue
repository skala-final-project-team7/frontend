<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat SCR-410/420 메시지 버블과 하단 액션 아이콘 렌더링.
          사용자 메시지 편집 UI와 LINA 답변 출처/피드백 액션을 분리해 제공한다.
작성일 : 2026-05-21
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-21, feature9 보강, ChatPage에서 MessageBubble 컴포넌트 분리
  - 2026-05-22, feature9 보강, streaming status text 렌더링을 store getter 입력으로 변경
  - 2026-05-22, feature9 SSE 보강, message.statusMessage 직접 렌더링으로 변경
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { Copy, Pencil, RefreshCcw, ThumbsDown, ThumbsUp } from '@lucide/vue';
import { computed } from 'vue';

import { BaseSpinner, BaseTooltip } from '@/shared';
import type { Message, Source } from '@/types/api';

const props = defineProps<{
  message: Message;
  editingMessageId: string;
  editingContent: string;
  isStreaming: boolean;
  streamingMessageId: string;
}>();

const emit = defineEmits<{
  startEdit: [message: Message];
  cancelEdit: [];
  submitEdit: [messageId: string];
  updateEditingContent: [content: string];
  openSources: [sources: Source[] | undefined];
}>();

const isEditing = computed(
  () => props.message.role === 'user' && props.editingMessageId === props.message.messageId,
);
const isStreamingAssistantMessage = computed(
  () =>
    props.message.role === 'assistant' &&
    props.isStreaming &&
    props.streamingMessageId === props.message.messageId,
);

/**
 * assistant 답변 아래 source button에 노출할 레이블을 반환한다.
 *
 * @returns source button 텍스트
 */
function sourceLabel() {
  return '출처';
}

/**
 * 사용자 편집 textarea의 현재 값을 상위 컴포넌트로 전달한다.
 *
 * @param event textarea input 이벤트
 */
function updateEditingContent(event: Event) {
  emit('updateEditingContent', (event.target as HTMLTextAreaElement).value);
}
</script>

<template>
  <article
    data-testid="message-bubble"
    class="flex flex-col"
    :class="message.role === 'user' ? 'items-end' : 'items-start'"
  >
    <div
      :data-testid="message.role === 'user' ? 'message-bubble-user' : 'message-bubble-assistant'"
      class="min-w-0 max-w-[74%] whitespace-pre-line break-words font-lina text-body leading-7 text-overlay-dark-80"
      :class="
        message.role === 'user'
          ? 'rounded-card border border-bg-300 bg-bg-200 px-5 py-4 shadow-sm'
          : 'px-0 py-0'
      "
    >
      <template v-if="message.role === 'user'">
        <div v-if="isEditing" class="space-y-3">
          <textarea
            :value="editingContent"
            data-testid="message-edit-textarea"
            rows="3"
            class="w-full resize-none rounded-button border border-bg-300 bg-primary-white p-3 outline-none focus:shadow-focus"
            @input="updateEditingContent"
          />
          <div class="flex justify-end gap-2">
            <button
              data-testid="message-edit-cancel"
              type="button"
              class="rounded-button px-3 py-1.5 text-small text-overlay-dark-60 hover:bg-bg-200"
              @click="emit('cancelEdit')"
            >
              취소
            </button>
            <button
              data-testid="message-edit-submit"
              type="button"
              class="rounded-button bg-primary px-3 py-1.5 text-small font-bold text-primary-white"
              @click="emit('submitEdit', message.messageId)"
            >
              보내기
            </button>
          </div>
        </div>
        <p v-else>{{ message.content }}</p>
      </template>

      <template v-else>
        <div v-if="isStreamingAssistantMessage" data-testid="assistant-stream-loading" class="mb-3">
          <BaseSpinner :label="message.statusMessage ?? ''" />
        </div>
        <p v-if="message.content.length > 0">{{ message.content }}</p>
        <div class="mt-4 flex flex-wrap items-center gap-2 text-small">
          <button
            data-testid="source-button"
            type="button"
            class="rounded-full border border-bg-300 bg-primary-white px-4 py-1.5 font-semibold text-overlay-dark-80 transition hover:bg-bg-100 focus-visible:outline-none focus-visible:shadow-focus"
            @click="emit('openSources', message.sources)"
          >
            {{ sourceLabel() }}
          </button>
        </div>
      </template>
    </div>

    <div
      v-if="message.role === 'user' && !isEditing"
      data-testid="message-action-row-user"
      class="mt-2 flex items-center gap-3 text-overlay-dark-80"
    >
      <BaseTooltip label="메시지 복사" placement="bottom">
        <button
          data-testid="message-copy-button"
          type="button"
          aria-label="메시지 복사"
          class="inline-flex size-5 items-center justify-center rounded-button transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <Copy aria-hidden="true" class="size-4" />
        </button>
      </BaseTooltip>
      <BaseTooltip label="메시지 수정" placement="bottom">
        <button
          data-testid="message-edit-button"
          type="button"
          aria-label="메시지 수정"
          class="inline-flex size-5 items-center justify-center rounded-button transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
          @click="emit('startEdit', message)"
        >
          <Pencil aria-hidden="true" class="size-4" />
        </button>
      </BaseTooltip>
    </div>

    <div
      v-if="message.role === 'assistant'"
      data-testid="message-action-row-assistant"
      class="mt-3 flex items-center gap-4 text-overlay-dark-80"
    >
      <BaseTooltip label="응답 복사" placement="bottom">
        <button
          data-testid="assistant-copy-button"
          type="button"
          aria-label="응답 복사"
          class="inline-flex size-5 items-center justify-center rounded-button transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <Copy aria-hidden="true" class="size-4" />
        </button>
      </BaseTooltip>
      <BaseTooltip label="좋은 응답" placement="bottom">
        <button
          data-testid="assistant-like-button"
          type="button"
          aria-label="좋은 응답"
          class="inline-flex size-5 items-center justify-center rounded-button transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <ThumbsUp aria-hidden="true" class="size-4" />
        </button>
      </BaseTooltip>
      <BaseTooltip label="별로인 응답" placement="bottom">
        <button
          data-testid="assistant-dislike-button"
          type="button"
          aria-label="별로인 응답"
          class="inline-flex size-5 items-center justify-center rounded-button transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <ThumbsDown aria-hidden="true" class="size-4" />
        </button>
      </BaseTooltip>
      <BaseTooltip label="다시 시도" placement="bottom">
        <button
          data-testid="assistant-regenerate-button"
          type="button"
          aria-label="다시 시도"
          class="inline-flex size-5 items-center justify-center rounded-button transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <RefreshCcw aria-hidden="true" class="size-4" />
        </button>
      </BaseTooltip>
    </div>
  </article>
</template>
