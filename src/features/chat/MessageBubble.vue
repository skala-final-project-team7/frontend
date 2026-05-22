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
  - 2026-05-22, SCR-420 보강, 사용자 메시지 inline edit bubble UI 개선
  - 2026-05-22, SCR-420 보강, 사용자 메시지 하단 hover action과 수정본 indicator 추가
  - 2026-05-22, SCR-420 보강, 사용자 메시지 수정본 이전/다음 선택 이벤트 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Pencil,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
} from '@lucide/vue';
import { computed, nextTick, ref, watch } from 'vue';

import { BaseSpinner, BaseTooltip } from '@/shared';
import type { Message, Source } from '@/types/api';

const props = defineProps<{
  message: Message;
  editingMessageId: string;
  editingContent: string;
  isStreaming: boolean;
  streamingMessageId: string;
  showUserVersionIndicator?: boolean;
  userVersionActiveIndex?: number;
  userVersionTotal?: number;
}>();

const emit = defineEmits<{
  startEdit: [message: Message];
  cancelEdit: [];
  submitEdit: [messageId: string];
  updateEditingContent: [content: string];
  selectUserMessageVersion: [messageId: string, versionIndex: number];
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
const userVersionActiveIndex = computed(() => props.userVersionActiveIndex ?? 0);
const userVersionTotal = computed(() => props.userVersionTotal ?? 1);
const userVersionLabel = computed(
  () => `${userVersionActiveIndex.value + 1}/${userVersionTotal.value}`,
);
const canShowPreviousUserVersion = computed(() => userVersionActiveIndex.value > 0);
const canShowNextUserVersion = computed(
  () => userVersionActiveIndex.value < userVersionTotal.value - 1,
);
const editTextarea = ref<HTMLTextAreaElement | null>(null);

/**
 * 편집 textarea 높이를 현재 내용에 맞춰 갱신하되 CSS max-height 이상은 내부 스크롤로 넘긴다.
 */
function resizeEditTextarea() {
  const textarea = editTextarea.value;

  if (!textarea) {
    return;
  }

  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

watch(
  () => [isEditing.value, props.editingContent],
  async () => {
    if (!isEditing.value) {
      return;
    }

    await nextTick();
    resizeEditTextarea();
  },
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
  resizeEditTextarea();
}

/**
 * Enter는 수정 전송, Shift+Enter는 textarea 기본 줄바꿈으로 처리한다.
 *
 * @param event textarea keydown 이벤트
 */
function handleEditTextareaKeydown(event: KeyboardEvent) {
  event.preventDefault();
  emit('submitEdit', props.message.messageId);
}

//TODO: backend version 목록 계약이 없어서 messageBubble 수정 전/후 2개 버전을 프론트 로컬 상태로만 관리 중 -> 백엔드와 협의 후 구현
//TODO: 메시지 복사 구현 -> 클립보드 API 사용, 복사 완료 토스트 UI 연결
/**
 * 사용자 메시지 수정본 내비게이션 선택을 상위로 전달한다.
 *
 * @param versionIndex 선택할 version index
 */
function selectUserMessageVersion(versionIndex: number) {
  emit('selectUserMessageVersion', props.message.messageId, versionIndex);
}
</script>

<template>
  <article
    data-testid="message-bubble"
    class="group/message flex flex-col"
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
            ref="editTextarea"
            :value="editingContent"
            data-testid="message-edit-textarea"
            rows="1"
            class="max-h-40 min-h-7 w-full resize-none overflow-y-auto bg-transparent p-0 font-lina text-body leading-7 text-overlay-dark-80 outline-none placeholder:text-overlay-dark-40"
            @input="updateEditingContent"
            @keydown.enter.exact="handleEditTextareaKeydown"
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
              class="rounded-button bg-overlay-dark-80 px-3 py-1.5 text-small font-bold text-primary-white transition hover:brightness-110 focus-visible:outline-none focus-visible:shadow-focus"
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
      class="mt-2 flex min-h-5 items-center justify-end gap-3 text-overlay-dark-80"
    >
      <div
        data-testid="message-action-icons-user"
        class="flex items-center gap-3 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100"
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
        v-if="showUserVersionIndicator"
        data-testid="message-version-navigation"
        class="flex items-center gap-2 opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100"
      >
        <button
          data-testid="message-version-control"
          type="button"
          aria-label="이전 수정본 보기"
          :disabled="!canShowPreviousUserVersion"
          class="inline-flex size-8 items-center justify-center rounded-button bg-bg-200 text-overlay-dark-80 transition hover:bg-bg-300 focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:bg-transparent disabled:text-overlay-dark-40 disabled:hover:bg-transparent"
          @click="selectUserMessageVersion(userVersionActiveIndex - 1)"
        >
          <ChevronLeft aria-hidden="true" class="size-5" />
        </button>
        <span
          data-testid="message-version-indicator"
          class="font-lina text-body font-semibold leading-none text-overlay-dark-80"
        >
          {{ userVersionLabel }}
        </span>
        <button
          data-testid="message-version-control"
          type="button"
          aria-label="다음 수정본 보기"
          :disabled="!canShowNextUserVersion"
          class="inline-flex size-8 items-center justify-center rounded-button bg-bg-200 text-overlay-dark-80 transition hover:bg-bg-300 focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:bg-transparent disabled:text-overlay-dark-40 disabled:hover:bg-transparent"
          @click="selectUserMessageVersion(userVersionActiveIndex + 1)"
        >
          <ChevronRight aria-hidden="true" class="size-5" />
        </button>
      </div>
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
