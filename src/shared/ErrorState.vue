<script setup lang="ts">
import BaseButton from './BaseButton.vue';

defineProps<{
  message: string;
}>();

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <section class="flex flex-col items-center justify-center gap-default text-center">
    <p class="text-body text-error">{{ message }}</p>
    <BaseButton @click="$emit('retry')">다시 시도</BaseButton>
  </section>
</template>
