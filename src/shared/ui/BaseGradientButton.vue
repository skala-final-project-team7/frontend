<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 그라데이션 CTA 버튼 컴포넌트.
          Figma의 작은 orange-red pill CTA 스타일을 재사용 가능한 버튼으로 제공한다.
작성일 : 2026-05-19
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-19, shared UI 보강, BaseGradientButton 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import type { PropType } from 'vue';

type GradientButtonType = 'button' | 'submit' | 'reset';

defineProps({
  type: {
    type: String as PropType<GradientButtonType>,
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
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex h-[30.46px] w-[130.53px] items-center justify-center rounded-full bg-gradient-to-r from-[#F79140] to-[#FF4A19] text-[10px] font-bold leading-3 text-white shadow-none transition hover:brightness-105 active:scale-[0.98] focus-visible:brightness-105 focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
