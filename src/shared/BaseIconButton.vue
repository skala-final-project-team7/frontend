<script setup lang="ts">
const props = defineProps<{
  label: string;
  disabled?: boolean;
}>();
</script>

<template>
  <button
    type="button"
    :aria-label="props.label"
    :disabled="disabled"
    class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_4px_var(--color-primary)] transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-bg-400 disabled:text-black disabled:opacity-50"
  >
    <slot />
  </button>
</template>
