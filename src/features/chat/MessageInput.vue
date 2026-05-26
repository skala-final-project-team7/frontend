<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat SCR-400 기본 메시지 입력 컴포넌트 구현.
          빈 입력/스트리밍 비활성 상태와 Enter 전송, Shift+Enter 줄바꿈을 처리한다.
작성일 : 2026-05-20
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-20, feature8 구현, MessageInput 최초 작성
  - 2026-05-22, feature9 보강, IME 조합 중 Enter 전송 방지 처리 추가
  - 2026-05-22, 스트리밍 중 원형 중단 버튼으로 cancel 동작 통합
  - 2026-05-26, feature11.5 고려, backend streaming 중단 정책 확정 TODO 기록
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { CircleStop, SendHorizontal } from '@lucide/vue';
import { computed, ref } from 'vue';

import { mascotSearchImageUrl } from '@/shared/assets';
import { BaseTooltip } from '@/shared';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  isStreaming: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  submit: [message: string];
  cancel: [];
}>();

const message = ref('');
const isComposing = ref(false);

const isSendDisabled = computed(
  () => props.disabled || props.isStreaming || message.value.trim().length === 0,
);

const actionButtonLabel = computed(() => (props.isStreaming ? '응답 중단' : '메시지 보내기'));
const actionButtonType = computed(() => (props.isStreaming ? 'button' : 'submit'));
const actionButtonIcon = computed(() => (props.isStreaming ? CircleStop : SendHorizontal));
const isActionDisabled = computed(() => !props.isStreaming && isSendDisabled.value);
const actionButtonClass = computed(() => [
  'inline-flex size-12 shrink-0 items-center justify-center rounded-full shadow-primary transition focus-visible:outline-none focus-visible:shadow-focus',
  props.isStreaming
    ? 'bg-bg-400 text-overlay-dark-40 shadow-none hover:brightness-95 active:scale-[0.96]'
    : 'bg-primary text-primary-white hover:brightness-95 active:scale-[0.96] disabled:bg-bg-400 disabled:text-overlay-dark-40 disabled:opacity-60 disabled:shadow-none disabled:hover:brightness-100 disabled:active:scale-100',
]);

/**
 * 한글/일본어 등 IME 조합 시작 상태를 기록한다.
 */
function startComposition() {
  isComposing.value = true;
}

/**
 * IME 조합 종료 후 textarea의 확정 문자열을 local state에 반영한다.
 *
 * @param event textarea compositionend 이벤트
 */
function endComposition(event: Event) {
  isComposing.value = false;
  message.value = (event.target as HTMLTextAreaElement).value;
}

/**
 * Enter 전송을 처리하되, IME 조합 중 Enter는 문자 확정 동작으로 남긴다.
 *
 * @param event textarea keydown 이벤트
 */
function handleTextareaKeydown(event: KeyboardEvent) {
  if (event.isComposing || event.keyCode === 229 || isComposing.value) {
    return;
  }

  event.preventDefault();
  submitMessage();
}

/**
 * 현재 입력된 메시지를 제출하고 입력값을 초기화한다.
 */
function submitMessage() {
  const trimmedMessage = message.value.trim();

  if (isSendDisabled.value || trimmedMessage.length === 0) {
    return;
  }

  emit('submit', trimmedMessage);
  message.value = '';
}

/**
 * 스트리밍 중에는 같은 원형 버튼을 응답 중단 액션으로 사용한다.
 */
function handleActionButtonClick() {
  if (!props.isStreaming) {
    return;
  }

  // TODO(feature11.5): SSE abort 이후 BFF/RAG 취소 전파와 partial assistant 응답 저장 정책을 확정한다.
  emit('cancel');
}
</script>

<template>
  <form
    data-testid="message-input"
    aria-label="Message input"
    class="mx-auto flex w-full max-w-[820px] flex-col items-center gap-4 px-6 pb-3"
    @submit.prevent="submitMessage"
  >
    <div
      class="flex min-h-[84px] w-full items-center gap-4 rounded-card bg-primary-white px-4 py-4 shadow-floating transition-shadow focus-within:shadow-focus"
    >
      <img :src="mascotSearchImageUrl" alt="" class="size-10 shrink-0 object-contain" />
      <label class="sr-only" for="lina-message-input">메시지 입력</label>
      <textarea
        id="lina-message-input"
        v-model="message"
        :disabled="disabled || isStreaming"
        rows="1"
        placeholder="무엇이든 물어보세요..."
        class="min-h-10 flex-1 resize-none bg-transparent font-lina text-body text-overlay-dark-80 outline-none placeholder:text-overlay-dark-40 disabled:cursor-not-allowed"
        @compositionstart="startComposition"
        @compositionend="endComposition"
        @keydown.enter.exact="handleTextareaKeydown"
      />
      <BaseTooltip :label="actionButtonLabel" placement="top">
        <button
          data-testid="message-send-button"
          :type="actionButtonType"
          :aria-label="actionButtonLabel"
          :disabled="isActionDisabled"
          :class="actionButtonClass"
          @click="handleActionButtonClick"
        >
          <component :is="actionButtonIcon" aria-hidden="true" class="size-6" />
        </button>
      </BaseTooltip>
    </div>

    <p class="text-center font-lina text-small text-overlay-dark-80">
      By messaging LINA, you agree to out
      <a href="/terms" class="underline underline-offset-2">Terms</a>
      and have read our
      <a href="/privacy" class="underline underline-offset-2">Privacy Policy</a>.
    </p>
  </form>
</template>
