<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 원형 floating icon button 컴포넌트.
          도움말, 하단으로 이동 등 화면 위에 뜨는 원형 아이콘 액션을 일관되게 표현한다.
작성일 : 2026-05-20
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-20, feature8 보정, BaseFloatingIconButton 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import type { PropType } from 'vue';

type FloatingIconButtonType = 'button' | 'submit' | 'reset';

defineProps({
  ariaLabel: {
    type: String,
    required: true,
  },
  type: {
    type: String as PropType<FloatingIconButtonType>,
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
    :aria-label="ariaLabel"
    :disabled="disabled"
    class="inline-flex size-12 shrink-0 items-center justify-center rounded-full border border-bg-300 bg-primary-white text-overlay-dark-80 shadow-floating transition hover:brightness-95 active:scale-[0.96] focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40 disabled:hover:brightness-100 disabled:active:scale-100"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
