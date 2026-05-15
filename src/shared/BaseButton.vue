<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit';
    variant?: 'primary' | 'ghost';
    disabled?: boolean;
  }>(),
  {
    type: 'button',
    variant: 'primary',
    disabled: false,
  },
);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex min-h-10 items-center justify-center rounded-button px-button py-2 text-button font-bold transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
    :class="{
      'bg-primary text-white shadow-[0_0_4px_var(--color-primary)] hover:bg-primary-hover':
        variant === 'primary',
      'border border-white-80 bg-dark-80 text-white hover:bg-dark-40': variant === 'ghost',
    }"
  >
    <slot />
  </button>
</template>
