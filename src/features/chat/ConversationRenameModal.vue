<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat 대화 제목 수정 중앙 모달.
          브라우저 기본 prompt 대신 앱 스타일 입력/확인 흐름을 제공한다.
작성일 : 2026-06-18
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-18, 대화 제목 수정 모달 신규 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{
  conversationTitle: string;
  isSubmitting: boolean;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  cancel: [];
  confirm: [title: string];
}>();

const titleDraft = ref('');
const inputElement = ref<HTMLInputElement | null>(null);
const cancelButton = ref<HTMLButtonElement | null>(null);
const confirmButton = ref<HTMLButtonElement | null>(null);
let previousBodyOverflow = '';
let hasLockedBodyScroll = false;

const trimmedTitle = computed(() => titleDraft.value.trim());
const isConfirmDisabled = computed(
  () =>
    props.isSubmitting ||
    trimmedTitle.value.length === 0 ||
    trimmedTitle.value === props.conversationTitle,
);

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

function cancelRename() {
  if (props.isSubmitting) {
    return;
  }

  emit('cancel');
}

function confirmRename() {
  if (isConfirmDisabled.value) {
    return;
  }

  emit('confirm', trimmedTitle.value);
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    cancelRename();
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    confirmRename();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  if (event.shiftKey && document.activeElement === inputElement.value) {
    event.preventDefault();
    confirmButton.value?.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === confirmButton.value) {
    event.preventDefault();
    inputElement.value?.focus();
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      unlockBodyScroll();
      return;
    }

    titleDraft.value = props.conversationTitle;
    lockBodyScroll();
    await nextTick();
    inputElement.value?.focus();
    inputElement.value?.select();
  },
  {
    immediate: true,
  },
);

watch(
  () => props.conversationTitle,
  (conversationTitle) => {
    if (props.isOpen) {
      titleDraft.value = conversationTitle;
    }
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
      data-testid="conversation-rename-modal-backdrop"
      class="fixed inset-0 z-[70] flex items-center justify-center bg-overlay-dark-20 px-5"
      @click.self="cancelRename"
    >
      <section
        data-testid="conversation-rename-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conversation-rename-title"
        class="w-full max-w-[480px] rounded-[24px] border border-bg-300 bg-primary-white px-7 py-6 shadow-[0_12px_36px_rgba(0,0,0,0.16)] outline-none"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <h2
          id="conversation-rename-title"
          data-testid="conversation-rename-title"
          class="font-lina text-[18px] leading-7 text-black"
        >
          채팅 제목을 수정하시겠습니까?
        </h2>
        <input
          id="conversation-rename-input"
          ref="inputElement"
          v-model="titleDraft"
          data-testid="conversation-rename-input"
          type="text"
          class="mt-2 h-11 w-full rounded-button border border-bg-300 bg-primary-white px-4 font-lina text-body text-black outline-none transition focus:border-black disabled:opacity-50"
          :disabled="isSubmitting"
          maxlength="80"
        />
        <div class="mt-7 flex justify-end gap-3">
          <button
            ref="cancelButton"
            data-testid="conversation-rename-cancel"
            type="button"
            class="inline-flex min-h-10 min-w-[64px] items-center justify-center rounded-full border border-bg-300 bg-primary-white px-5 font-lina text-body text-black transition hover:bg-bg-100 focus-visible:outline-black disabled:opacity-50"
            :disabled="isSubmitting"
            @click="cancelRename"
          >
            취소
          </button>
          <button
            ref="confirmButton"
            data-testid="conversation-rename-confirm"
            type="button"
            class="inline-flex min-h-10 min-w-[64px] items-center justify-center rounded-full bg-black px-5 font-lina text-body text-primary-white transition hover:brightness-110 focus-visible:outline-black disabled:opacity-50 disabled:hover:brightness-100"
            :disabled="isConfirmDisabled"
            @click="confirmRename"
          >
            수정
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
