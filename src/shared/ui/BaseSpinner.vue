<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 로딩 상태 표시 컴포넌트.
          비동기 UI의 Loading 상태를 접근 가능한 role=status 패턴으로 제공한다.
작성일 : 2026-05-19
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-19, feature7 구현, BaseSpinner 최초 작성
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
    default: 'Loading',
  },
});
</script>

<template>
  <div
    role="status"
    aria-live="polite"
    class="inline-flex items-center gap-2 text-small text-overlay-dark-40"
  >
    <span aria-hidden="true" class="inline-flex items-center gap-4">
      <span
        data-testid="base-spinner-dot"
        class="lina-spinner-dot size-3 rounded-full"
        style="animation-delay: 0ms"
      />
      <span
        data-testid="base-spinner-dot"
        class="lina-spinner-dot size-3 rounded-full"
        style="animation-delay: 180ms"
      />
      <span
        data-testid="base-spinner-dot"
        class="lina-spinner-dot size-3 rounded-full"
        style="animation-delay: 360ms"
      />
    </span>
    <span class="lina-body text-small">{{ label }}</span>
  </div>
</template>

<style scoped>
.lina-spinner-dot {
  animation: lina-spinner-dot-pulse 1080ms ease-in-out infinite;
  background: var(--color-bg-300);
}

@keyframes lina-spinner-dot-pulse {
  0%,
  100% {
    background: var(--color-bg-300);
    transform: scale(1);
  }

  30% {
    background: var(--color-dark-40);
    transform: scale(1.04);
  }

  60% {
    background: var(--color-bg-300);
    transform: scale(1);
  }
}
</style>
