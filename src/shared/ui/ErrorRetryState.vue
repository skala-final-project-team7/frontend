<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 Error + Retry 상태 표시 컴포넌트.
          비동기 실패 상태에서 에러 메시지와 재시도 액션을 일관된 패턴으로 제공한다.
작성일 : 2026-05-19
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-19, feature7 구현, ErrorRetryState 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { RefreshCw } from '@lucide/vue';

import BaseButton from './BaseButton.vue';

defineProps({
  title: {
    type: String,
    default: '오류가 발생했습니다',
  },
  message: {
    type: String,
    default: '잠시 후 다시 시도해 주세요.',
  },
  retryLabel: {
    type: String,
    default: '다시 시도',
  },
});

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <section role="alert" class="flex flex-col items-center justify-center gap-3 p-item text-center">
    <div class="space-y-1">
      <h2 class="lina-body font-semibold text-status-error">{{ title }}</h2>
      <p class="lina-body text-overlay-dark-40">{{ message }}</p>
    </div>

    <BaseButton variant="primary" class="gap-3" @click="$emit('retry')">
      <RefreshCw
        data-testid="error-retry-icon"
        aria-hidden="true"
        class="size-4"
        :stroke-width="2"
      />
      {{ retryLabel }}
    </BaseButton>
  </section>
</template>
