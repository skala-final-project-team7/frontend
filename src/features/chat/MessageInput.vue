<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat SCR-400 기본 메시지 입력 컴포넌트 구현.
          빈 입력/스트리밍 비활성 상태와 Enter 전송, Shift+Enter 줄바꿈을 처리한다.
작성일 : 2026-05-20
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-20, feature8 구현, MessageInput 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { SendHorizontal } from '@lucide/vue';
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

const isSendDisabled = computed(
  () => props.disabled || props.isStreaming || message.value.trim().length === 0,
);

function submitMessage() {
  const trimmedMessage = message.value.trim();

  if (isSendDisabled.value || trimmedMessage.length === 0) {
    return;
  }

  emit('submit', trimmedMessage);
  message.value = '';
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
        @keydown.enter.exact.prevent="submitMessage"
      />
      <BaseTooltip label="메시지 보내기" placement="top">
        <button
          data-testid="message-send-button"
          type="submit"
          aria-label="메시지 보내기"
          :disabled="isSendDisabled"
          class="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-white shadow-primary transition hover:brightness-95 active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-focus disabled:bg-bg-400 disabled:text-overlay-dark-40 disabled:opacity-60 disabled:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
        >
          <SendHorizontal aria-hidden="true" class="size-6" />
        </button>
      </BaseTooltip>
      <button
        v-if="isStreaming"
        data-testid="message-cancel-button"
        type="button"
        class="rounded-button border border-bg-300 bg-primary-white px-4 py-2 text-button font-bold text-overlay-dark-80 transition hover:brightness-105 focus-visible:outline-none focus-visible:shadow-focus"
        @click="$emit('cancel')"
      >
        취소
      </button>
    </div>

    <p class="text-center font-lina text-small text-overlay-dark-80">
      By messaging LINA, you agree to out
      <a href="/terms" class="underline underline-offset-2">Terms</a>
      and have read our
      <a href="/privacy" class="underline underline-offset-2">Privacy Policy</a>.
    </p>
  </form>
</template>
