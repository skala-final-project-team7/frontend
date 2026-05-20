<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 아이콘 전용 버튼 컴포넌트.
          아이콘만 보이는 액션에 필수 aria-label을 적용해 접근성 기준을 강제한다.
작성일 : 2026-05-19
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-19, feature7 구현, BaseIconButton 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

type IconButtonType = 'button' | 'submit' | 'reset';
type IconButtonVariant = 'primary' | 'secondary' | 'ghost';

const props = defineProps({
  ariaLabel: {
    type: String,
    required: true,
  },
  variant: {
    type: String as PropType<IconButtonVariant>,
    default: 'secondary',
    validator: (value: string) => ['primary', 'secondary', 'ghost'].includes(value),
  },
  type: {
    type: String as PropType<IconButtonType>,
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
    :aria-label="ariaLabel"
    :disabled="disabled"
    class="inline-flex size-9 shrink-0 items-center justify-center rounded-button border text-button font-bold transition hover:brightness-105 active:scale-[0.96] focus-visible:brightness-105 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100"
    :class="variantClass"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
