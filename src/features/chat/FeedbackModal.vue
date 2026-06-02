<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA assistant 답변 피드백 사유와 comment 입력 모달.
          thumbs up/down 선택 후 feedback API에 전달할 comment payload를 구성한다.
작성일 : 2026-06-02
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-02, feature10.4 보강, 피드백 사유/comment 모달 최초 작성
  - 2026-06-02, feature10.4 보정, 사유 또는 comment 중 하나만 있어도 제출 가능하도록 수정
  - 2026-06-02, feature10.4 UI 보정, 닫기 버튼 hover/focus 주황색 테두리 적용
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { X } from '@lucide/vue';
import { computed, ref } from 'vue';

import type { FeedbackRating } from '@/types/api';

type FeedbackReason = {
  id: string;
  label: string;
};

const props = defineProps<{
  rating: FeedbackRating;
  isSubmitting: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [comment: string];
}>();

const selectedReason = ref('');
const commentDetail = ref('');

const reasons = computed<FeedbackReason[]>(() =>
  props.rating === 'LIKE'
    ? [
        { id: 'helpful', label: '도움이 됨' },
        { id: 'accurate', label: '정확함' },
        { id: 'clear', label: '이해하기 쉬움' },
        { id: 'sources', label: '출처가 유용함' },
        { id: 'other', label: '기타' },
      ]
    : [
        { id: 'incorrect', label: '올바르지 않거나 끝까지 작성되지 않음' },
        { id: 'off_target', label: '요청한 내용이 아님' },
        { id: 'slow_or_buggy', label: '느리거나 버그가 있음' },
        { id: 'style', label: '스타일 또는 어조' },
        { id: 'safety', label: '안전 또는 법적 우려' },
        { id: 'other', label: '기타' },
      ],
);
const trimmedCommentDetail = computed(() => commentDetail.value.trim());
const canSubmit = computed(
  () =>
    (selectedReason.value.length > 0 || trimmedCommentDetail.value.length > 0) &&
    !props.isSubmitting,
);

function selectReason(reason: FeedbackReason) {
  selectedReason.value = reason.label;
}

function submitFeedback() {
  if (!canSubmit.value) {
    return;
  }

  const detail = trimmedCommentDetail.value;
  const comment =
    selectedReason.value && detail
      ? `[${selectedReason.value}] ${detail}`
      : selectedReason.value || detail;

  emit('submit', comment);
}
</script>

<template>
  <div
    data-testid="feedback-modal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-overlay-dark-80/30 px-6"
    role="presentation"
    @keydown.esc="emit('close')"
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      class="w-full max-w-[720px] rounded-card border border-bg-300 bg-primary-white p-8 shadow-floating"
    >
      <div class="mb-7 flex items-start justify-between gap-4">
        <h2
          id="feedback-modal-title"
          class="font-lina text-[24px] font-bold leading-tight text-overlay-dark-80"
        >
          피드백 공유
        </h2>
        <button
          data-testid="feedback-close-button"
          type="button"
          aria-label="피드백 닫기"
          class="inline-flex size-11 shrink-0 items-center justify-center rounded-button border border-primary text-overlay-dark-80 transition hover:border-status-error hover:bg-bg-100 focus-visible:border-status-error focus-visible:outline-none focus-visible:shadow-focus"
          @click="emit('close')"
        >
          <X aria-hidden="true" class="size-6" />
        </button>
      </div>

      <div class="mb-7 flex flex-wrap gap-3">
        <button
          v-for="reason in reasons"
          :key="reason.id"
          :data-testid="`feedback-reason-${reason.id}`"
          type="button"
          class="rounded-full border px-5 py-3 font-lina text-body transition focus-visible:outline-none focus-visible:shadow-focus"
          :class="
            selectedReason === reason.label
              ? 'border-primary bg-primary text-primary-white'
              : 'border-bg-300 bg-primary-white text-overlay-dark-80 hover:bg-bg-100'
          "
          @click="selectReason(reason)"
        >
          {{ reason.label }}
        </button>
      </div>

      <label class="sr-only" for="feedback-comment-input">공유 세부 정보</label>
      <textarea
        id="feedback-comment-input"
        v-model="commentDetail"
        data-testid="feedback-comment-input"
        rows="5"
        placeholder="공유 세부 정보(선택)"
        class="mb-6 min-h-[132px] w-full resize-y rounded-card border border-bg-300 bg-primary-white px-5 py-4 font-lina text-body text-overlay-dark-80 outline-none placeholder:text-overlay-dark-40 focus:shadow-focus"
      />

      <div class="mb-7 rounded-card bg-bg-200 px-5 py-4 font-lina text-small text-overlay-dark-60">
        피드백에 대화가 포함되어 LINA 개선에 도움을 줍니다.
      </div>

      <div class="flex justify-end">
        <button
          data-testid="feedback-submit-button"
          type="button"
          :disabled="!canSubmit"
          class="rounded-full bg-overlay-dark-80 px-7 py-4 font-lina text-body font-bold text-primary-white transition hover:brightness-110 focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:bg-bg-400 disabled:text-overlay-dark-40 disabled:hover:brightness-100"
          @click="submitFeedback"
        >
          {{ isSubmitting ? '제출 중' : '제출' }}
        </button>
      </div>
    </section>
  </div>
</template>
