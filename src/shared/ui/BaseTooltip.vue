<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 tooltip wrapper 컴포넌트.
          아이콘 전용 컨트롤의 hover/focus 설명을 일관되게 제공한다.
작성일 : 2026-05-20
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-20, feature8 보정, BaseTooltip 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
defineProps({
  label: {
    type: String,
    required: true,
  },
  placement: {
    type: String,
    default: 'right',
    validator: (value: string) => ['top', 'right', 'bottom', 'left'].includes(value),
  },
});
</script>

<template>
  <span
    data-testid="base-tooltip"
    :aria-label="label"
    class="group/tooltip relative inline-flex items-center"
  >
    <slot />
    <span
      role="tooltip"
      class="pointer-events-none absolute z-50 whitespace-nowrap rounded-button bg-overlay-dark-80 px-2.5 py-1.5 font-lina text-small text-primary-white opacity-0 shadow-floating transition group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      :class="{
        'left-full top-1/2 ml-2 -translate-y-1/2': placement === 'right',
        'right-full top-1/2 mr-2 -translate-y-1/2': placement === 'left',
        'bottom-full left-1/2 mb-2 -translate-x-1/2': placement === 'top',
        'left-1/2 top-full mt-2 -translate-x-1/2': placement === 'bottom',
      }"
    >
      {{ label }}
    </span>
  </span>
</template>
