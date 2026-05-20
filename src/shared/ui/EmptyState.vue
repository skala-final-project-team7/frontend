<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 Empty 상태 표시 컴포넌트.
          검색 결과, 대화 이력 등 비어 있는 상태의 제목/설명/액션 영역을 제공한다.
작성일 : 2026-05-19
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-19, feature7 구현, EmptyState 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { mascotWrongImageUrl } from '@/shared/assets';

defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <section
    data-testid="empty-state"
    class="flex flex-col items-center justify-center gap-3 p-item text-center"
  >
    <img
      data-testid="empty-state-mascot"
      :src="mascotWrongImageUrl"
      alt=""
      aria-hidden="true"
      class="h-32 w-32 object-contain"
    />

    <div class="space-y-1">
      <h2 class="lina-body font-semibold text-overlay-dark-80">{{ title }}</h2>
      <p v-if="description" class="lina-body text-overlay-dark-40">{{ description }}</p>
    </div>

    <div v-if="$slots.action" class="mt-1">
      <slot name="action" />
    </div>
  </section>
</template>
