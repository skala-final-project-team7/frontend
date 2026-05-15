<script setup lang="ts">
import type { Source } from '@/types/api';

defineProps<{
  sources: Source[];
}>();
</script>

<template>
  <aside class="hidden w-80 border-l border-dark-10 bg-primary-white p-card xl:block">
    <header class="flex items-center justify-between">
      <h2 class="text-body font-semibold">검색 결과 ({{ sources.length }}개)</h2>
      <div class="flex rounded-button bg-bg-200 p-1 text-small" aria-label="출처 보기 방식">
        <button type="button" class="rounded-button bg-primary-white px-2 py-1">List</button>
        <button type="button" class="rounded-button px-2 py-1 text-black/50">Graph</button>
      </div>
    </header>

    <div class="mt-default flex flex-col gap-default">
      <article
        v-for="source in sources"
        :key="source.pageId"
        role="article"
        tabindex="0"
        class="rounded-item border border-dark-10 p-card text-body focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <h3 class="font-semibold">{{ source.title }}</h3>
        <p class="mt-1 text-small text-black/60">{{ source.spaceName }} &gt; {{ source.pageId }}</p>
        <dl class="mt-2 grid grid-cols-1 gap-tight text-small text-black/60">
          <div>
            <dt class="inline">작성자</dt>
            <dd class="inline">정보 없음</dd>
          </div>
          <div>
            <dt class="inline">작성일자</dt>
            <dd class="inline">{{ source.updatedAt }}</dd>
          </div>
          <div>
            <dt class="inline">관련도</dt>
            <dd class="inline">{{ Math.round(source.relevanceScore * 100) }}%</dd>
          </div>
        </dl>
      </article>
    </div>
  </aside>
</template>
