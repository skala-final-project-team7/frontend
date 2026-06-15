<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat 대화 삭제 확인 중앙 모달.
          브라우저 기본 confirm 대신 앱 스타일 확인 흐름을 제공한다.
작성일 : 2026-06-12
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-12, 대화 삭제 확인 모달 신규 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
  conversationTitle: string;
  isSubmitting: boolean;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [];
}>();

const cancelButton = ref<HTMLButtonElement | null>(null);
const confirmButton = ref<HTMLButtonElement | null>(null);
let previousBodyOverflow = '';
let hasLockedBodyScroll = false;

function lockBodyScroll() {
  if (hasLockedBodyScroll) {
    return;
  }

  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  hasLockedBodyScroll = true;
}

function unlockBodyScroll() {
  if (!hasLockedBodyScroll) {
    return;
  }

  document.body.style.overflow = previousBodyOverflow;
  hasLockedBodyScroll = false;
}

function cancelDelete() {
  if (props.isSubmitting) {
    return;
  }

  emit('cancel');
}

function confirmDelete() {
  if (props.isSubmitting) {
    return;
  }

  emit('confirm');
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    cancelDelete();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  if (event.shiftKey && document.activeElement === cancelButton.value) {
    event.preventDefault();
    confirmButton.value?.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === confirmButton.value) {
    event.preventDefault();
    cancelButton.value?.focus();
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      unlockBodyScroll();
      return;
    }

    lockBodyScroll();
    await nextTick();
    cancelButton.value?.focus();
  },
  {
    immediate: true,
  },
);

onBeforeUnmount(() => {
  unlockBodyScroll();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="props.isOpen"
      data-testid="conversation-delete-modal-backdrop"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-overlay-dark-20 px-5"
      @click.self="cancelDelete"
    >
      <section
        data-testid="conversation-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversation-delete-title"
        class="w-full max-w-[480px] rounded-[24px] border border-bg-300 bg-primary-white px-7 py-6 shadow-[0_12px_36px_rgba(0,0,0,0.16)] outline-none"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <h2
          id="conversation-delete-title"
          data-testid="conversation-delete-title"
          class="font-lina text-[18px] leading-7 text-black"
        >
          채팅을 삭제하시겠습니까?
        </h2>
        <p
          data-testid="conversation-delete-description"
          class="mt-6 font-lina text-body leading-6 text-black"
        >
          <strong class="font-bold">삭제</strong> 버튼을 클릭할 경우
          <strong class="font-bold">{{ conversationTitle }}</strong
          >이(가) 삭제됩니다.
        </p>
        <div class="mt-7 flex justify-end gap-3">
          <button
            ref="cancelButton"
            data-testid="conversation-delete-cancel"
            type="button"
            class="inline-flex min-h-10 min-w-[64px] items-center justify-center rounded-full border border-bg-300 bg-primary-white px-5 font-lina text-body text-black transition hover:bg-bg-100 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50"
            :disabled="isSubmitting"
            @click="cancelDelete"
          >
            취소
          </button>
          <button
            ref="confirmButton"
            data-testid="conversation-delete-confirm"
            type="button"
            class="inline-flex min-h-10 min-w-[64px] items-center justify-center rounded-full bg-[#d43d32] px-5 font-lina text-body text-primary-white transition hover:brightness-105 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50 disabled:hover:brightness-100"
            :disabled="isSubmitting"
            @click="confirmDelete"
          >
            삭제
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
