<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 toast 렌더링 컴포넌트.
          App 최상단에 한 번 마운트되어 useToast 큐를 화면 하단에 표시한다.
작성일 : 2026-05-20
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-20, feature8 보정, BaseToast 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { Check, Info, XCircle } from '@lucide/vue';

import { useToast } from '@/composables/useToast';

const { toasts } = useToast();
</script>

<template>
  <Teleport to="body">
    <div
      data-testid="toast-container"
      class="pointer-events-none fixed left-1/2 top-8 z-[100] flex -translate-x-1/2 flex-col items-center gap-2"
      aria-live="polite"
      aria-atomic="true"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          data-testid="toast-item"
          role="status"
          :data-variant="toast.variant"
          class="pointer-events-auto flex items-center gap-2 rounded-button bg-overlay-dark-80 px-4 py-2.5 font-lina text-small text-primary-white shadow-floating"
        >
          <Check v-if="toast.variant === 'success'" aria-hidden="true" class="size-4" />
          <XCircle v-else-if="toast.variant === 'error'" aria-hidden="true" class="size-4" />
          <Info v-else aria-hidden="true" class="size-4" />
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
