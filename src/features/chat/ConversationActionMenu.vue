<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat 대화 케밥 액션 메뉴.
          최근 채팅 리스트와 채팅 헤더가 동일한 메뉴 항목과 접근성 동작을 공유한다.
작성일 : 2026-06-01
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-01, feature10.1 구현, 고정/이름 변경/삭제 메뉴 컴포넌트 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { MoreVertical, Pencil, Pin, Trash2 } from '@lucide/vue';
import { nextTick, ref, watch } from 'vue';

defineOptions({
  name: 'ConversationActionMenu',
});

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    isPinned?: boolean;
    menuLabel?: string;
    triggerClass?: string;
    triggerTestId?: string;
  }>(),
  {
    isPinned: false,
    menuLabel: '대화 메뉴',
    triggerClass: '',
    triggerTestId: 'conversation-menu-trigger',
  },
);

const emit = defineEmits<{
  close: [];
  delete: [];
  pin: [];
  rename: [];
  toggle: [];
}>();

const firstMenuItem = ref<HTMLButtonElement | null>(null);

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      return;
    }

    await nextTick();
    firstMenuItem.value?.focus();
  },
);
</script>

<template>
  <div
    data-conversation-menu-root
    class="relative inline-flex"
    @click.stop
    @pointerdown.stop
    @keydown.esc.stop.prevent="emit('close')"
  >
    <button
      :data-testid="props.triggerTestId"
      type="button"
      aria-label="대화 메뉴 열기"
      aria-haspopup="menu"
      :aria-expanded="props.isOpen ? 'true' : 'false'"
      class="inline-flex items-center justify-center text-overlay-dark-80 transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
      :class="props.triggerClass"
      @click="emit('toggle')"
    >
      <MoreVertical aria-hidden="true" class="size-4" />
    </button>

    <div
      v-if="props.isOpen"
      data-testid="conversation-action-menu"
      role="menu"
      :aria-label="props.menuLabel"
      class="absolute right-0 top-[calc(100%+0.25rem)] z-40 w-36 overflow-hidden rounded-card border border-bg-300 bg-primary-white py-1 shadow-floating"
    >
      <button
        ref="firstMenuItem"
        data-testid="conversation-menu-pin"
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 px-3 py-2 text-left font-lina text-small text-overlay-dark-80 transition hover:bg-bg-100 focus-visible:bg-bg-100 focus-visible:outline-none"
        @click="emit('pin')"
      >
        <Pin aria-hidden="true" class="size-4" />
        <span>{{ props.isPinned ? '고정 해제' : '고정' }}</span>
      </button>
      <button
        data-testid="conversation-menu-rename"
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 px-3 py-2 text-left font-lina text-small text-overlay-dark-80 transition hover:bg-bg-100 focus-visible:bg-bg-100 focus-visible:outline-none"
        @click="emit('rename')"
      >
        <Pencil aria-hidden="true" class="size-4" />
        <span>이름 변경</span>
      </button>
      <button
        data-testid="conversation-menu-delete"
        type="button"
        role="menuitem"
        class="flex w-full items-center gap-2 px-3 py-2 text-left font-lina text-small text-status-error transition hover:bg-bg-100 focus-visible:bg-bg-100 focus-visible:outline-none"
        @click="emit('delete')"
      >
        <Trash2 aria-hidden="true" class="size-4" />
        <span>삭제</span>
      </button>
    </div>
  </div>
</template>
