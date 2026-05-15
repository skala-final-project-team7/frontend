<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: '검색 결과가 없습니다',
    description: '질문을 입력하면 LINA가 관련 문서와 출처를 찾아 답변합니다.',
  },
);
</script>

<template>
  <section class="flex flex-col items-center justify-center gap-default text-center">
    <img
      src="../../frontend/assets/mascot-realize-nobg.png"
      alt=""
      class="h-28 w-28 object-contain"
    />
    <div>
      <h2 class="text-heading font-semibold">{{ title }}</h2>
      <p class="mt-2 text-body text-black/70">{{ description }}</p>
    </div>
  </section>
</template>
