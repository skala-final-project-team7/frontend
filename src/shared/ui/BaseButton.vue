<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 텍스트 버튼 컴포넌트.
          주요 액션과 보조 액션의 기본 버튼 스타일 및 native button 속성을 통일한다.
작성일 : 2026-05-19
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-19, feature7 구현, BaseButton 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

type ButtonType = 'button' | 'submit' | 'reset';
type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const props = defineProps({
  variant: {
    type: String as PropType<ButtonVariant>,
    default: 'secondary',
    validator: (value: string) => ['primary', 'secondary', 'ghost'].includes(value),
  },
  type: {
    type: String as PropType<ButtonType>,
    default: 'button',
    validator: (value: string) => ['button', 'submit', 'reset'].includes(value),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits<{
  click: [event: MouseEvent];
}>();

const variantClass = computed(() => {
  if (props.variant === 'primary') {
    return 'border-primary bg-primary text-primary-white shadow-primary';
  }

  if (props.variant === 'ghost') {
    return 'border-overlay-white-80 bg-overlay-dark-80 text-primary-white';
  }

  return 'border-bg-300 bg-primary-white text-overlay-dark-80';
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex min-h-9 items-center justify-center gap-2 rounded-button border px-button py-button text-button font-bold transition hover:brightness-105 active:scale-[0.98] focus-visible:brightness-105 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100"
    :class="variantClass"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
