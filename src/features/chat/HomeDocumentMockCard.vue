<!--
--------------------------------------------------
작성자 : Codex
작성목적 : Chat 첫 진입 빈 화면에서만 사용할 고정 Confluence 문서 mock 카드.
          실제 preview API/hover 액션 없이 정적 screenshot 비주얼만 노출한다.
작성일 : 2026-06-16
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
defineProps<{
  imageUrl: string;
  title: string;
}>();
</script>

<template>
  <article
    data-testid="home-document-mock-card"
    :aria-label="title"
    class="overflow-hidden rounded-[24px] border border-bg-300/60 bg-primary-white shadow-floating"
  >
    <img
      data-testid="home-document-mock-card-image"
      :src="imageUrl"
      :alt="title"
      class="block h-full w-full object-cover object-top"
    />
  </article>
</template>
