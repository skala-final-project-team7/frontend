<script setup lang="ts">
import { ref } from 'vue';

import BaseButton from '@/shared/BaseButton.vue';
import BaseIconButton from '@/shared/BaseIconButton.vue';

defineProps<{
  disabled?: boolean;
  isStreaming?: boolean;
}>();

const emit = defineEmits<{
  submit: [question: string];
  cancel: [];
}>();

const question = ref('');

function submitQuestion() {
  const trimmedQuestion = question.value.trim();

  if (!trimmedQuestion) {
    return;
  }

  emit('submit', trimmedQuestion);
  question.value = '';
}
</script>

<template>
  <form class="border-t border-dark-10 bg-primary-white p-card" @submit.prevent="submitQuestion">
    <label class="sr-only" for="message-input">질문 입력</label>
    <div class="mx-auto flex max-w-3xl items-end gap-default">
      <textarea
        id="message-input"
        v-model="question"
        class="max-h-40 min-h-12 flex-1 resize-none rounded-item border border-dark-10 px-4 py-3 text-body outline-none focus:border-primary"
        placeholder="무엇이든 물어보세요..."
        :disabled="disabled || isStreaming"
        rows="1"
        @keydown.enter.exact.prevent="submitQuestion"
      />
      <BaseIconButton label="질문 보내기" :disabled="disabled || isStreaming || !question.trim()">
        ↑
      </BaseIconButton>
      <BaseButton v-if="isStreaming" type="button" variant="ghost" @click="$emit('cancel')">
        취소
      </BaseButton>
    </div>
    <p class="mx-auto mt-2 max-w-3xl text-small text-black/50">
      LINA는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.
    </p>
  </form>
</template>
