<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend 공통 tooltip wrapper 컴포넌트.
          아이콘 전용 컨트롤의 hover/focus 설명을 일관되게 제공한다.
작성일 : 2026-05-20
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-20, feature8 보정, BaseTooltip 최초 작성
  - 2026-05-26, SCR-400 보정, body portal 및 fixed positioning으로 sidebar clipping 방지
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { onBeforeUnmount, ref, type PropType } from 'vue';

type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

const SIDE_OFFSET = 12;

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  placement: {
    type: String as PropType<TooltipPlacement>,
    default: 'right',
    validator: (value: string) => ['top', 'right', 'bottom', 'left'].includes(value),
  },
});

const triggerElement = ref<HTMLElement>();
const isVisible = ref(false);
const tooltipStyle = ref<Record<string, string>>({});

function updatePosition() {
  const trigger = triggerElement.value;

  if (!trigger) {
    return;
  }

  const rect = trigger.getBoundingClientRect();

  if (props.placement === 'left') {
    tooltipStyle.value = {
      left: `${rect.left - SIDE_OFFSET}px`,
      top: `${rect.top + rect.height / 2}px`,
    };
    return;
  }

  if (props.placement === 'top') {
    tooltipStyle.value = {
      left: `${rect.left + rect.width / 2}px`,
      top: `${rect.top - SIDE_OFFSET}px`,
    };
    return;
  }

  if (props.placement === 'bottom') {
    tooltipStyle.value = {
      left: `${rect.left + rect.width / 2}px`,
      top: `${rect.bottom + SIDE_OFFSET}px`,
    };
    return;
  }

  tooltipStyle.value = {
    left: `${rect.right + SIDE_OFFSET}px`,
    top: `${rect.top + rect.height / 2}px`,
  };
}

function showTooltip() {
  isVisible.value = true;
  updatePosition();
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
}

function hideTooltip() {
  isVisible.value = false;
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
}

function handleFocusOut(event: FocusEvent) {
  if (!triggerElement.value?.contains(event.relatedTarget as Node | null)) {
    hideTooltip();
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
});
</script>

<template>
  <span
    ref="triggerElement"
    data-testid="base-tooltip"
    :aria-label="props.label"
    class="inline-flex items-center"
    @mouseenter="showTooltip"
    @mouseleave="hideTooltip"
    @focusin="showTooltip"
    @focusout="handleFocusOut"
  >
    <slot />
    <Teleport to="body">
      <span
        v-if="isVisible"
        role="tooltip"
        :data-side="props.placement"
        data-align="center"
        :data-side-offset="SIDE_OFFSET"
        :style="tooltipStyle"
        class="pointer-events-none fixed z-[9999] whitespace-nowrap rounded-button bg-overlay-dark-80 px-2.5 py-1.5 font-lina text-small text-primary-white shadow-floating"
        :class="{
          '-translate-y-1/2': props.placement === 'right',
          '-translate-x-full -translate-y-1/2': props.placement === 'left',
          '-translate-x-1/2 -translate-y-full': props.placement === 'top',
          '-translate-x-1/2': props.placement === 'bottom',
        }"
      >
        {{ props.label }}
      </span>
    </Teleport>
  </span>
</template>
