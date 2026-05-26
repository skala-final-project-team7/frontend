<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat SCR-500/510 우측 출처 패널 렌더링.
          검색 결과형 source 목록의 hover preview와 List/Graph 전환 상태를 관리한다.
작성일 : 2026-05-26
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-26, feature10 구현, ReferencePanel 최초 작성
  - 2026-05-26, feature10 UI 보정, 목록 행과 왼쪽 hover PreviewPageCard 구성
  - 2026-05-26, feature10 UI 보정, 오래된 문서 badge 제거
  - 2026-05-26, feature10 UI 보정, source URL action은 hover PreviewPageCard로 한정
  - 2026-05-26, feature10 UI 보정, 카드 공통 named hover scope 사용 및 팝오버 이동 hover 영역 연결
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { Clock3, FileText, UserRound, X } from '@lucide/vue';
import { computed, ref, watch } from 'vue';

import { getConfluencePagePreview } from '@/api';
import PreviewPageCard from '@/features/chat/PreviewPageCard.vue';
import type { ConfluencePagePreview, Source } from '@/types/api';

type HighlightSegment = {
  text: string;
  isHighlighted: boolean;
};

const props = defineProps<{
  sources: Source[];
  keyword: string;
}>();

defineEmits<{
  close: [];
}>();

const activeView = ref<'list' | 'graph'>('list');
const previewsByPageId = ref<Record<string, ConfluencePagePreview>>({});
const hoveredPageId = ref('');

const hoveredPreview = computed(() => previewsByPageId.value[hoveredPageId.value]);

watch(
  () => props.sources,
  async (sources) => {
    const previews = await Promise.all(
      sources.map(async (source) => {
        try {
          return [source.pageId, await getConfluencePagePreview(source.pageId)] as const;
        } catch {
          return undefined;
        }
      }),
    );

    previewsByPageId.value = Object.fromEntries(
      previews.filter((preview): preview is readonly [string, ConfluencePagePreview] => !!preview),
    );
  },
  { immediate: true },
);

function sourcePath(source: Source) {
  const preview = previewsByPageId.value[source.pageId];

  return preview?.breadcrumbs.length
    ? preview.breadcrumbs.join(' > ')
    : `${source.spaceName} > ${source.title}`;
}

function authorName(source: Source) {
  return previewsByPageId.value[source.pageId]?.authorName ?? '작성자 정보 없음';
}

function formatDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsedDate.getDate()}`.padStart(2, '0');

  return `${year}.${month}.${day}`;
}

function highlightSegments(value: string): HighlightSegment[] {
  const terms = [...new Set(props.keyword.trim().split(/\s+/).filter(Boolean))];

  if (terms.length === 0) {
    return [{ text: value, isHighlighted: false }];
  }

  const expression = new RegExp(
    `(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi',
  );

  return value
    .split(expression)
    .filter((segment) => segment.length > 0)
    .map((segment) => ({
      text: segment,
      isHighlighted: terms.some((term) => term.toLowerCase() === segment.toLowerCase()),
    }));
}
</script>

<template>
  <aside
    data-testid="reference-panel"
    aria-label="Reference panel"
    aria-hidden="false"
    class="sticky top-0 flex h-screen w-[376px] shrink-0 flex-col border-l border-bg-300 bg-primary-white"
  >
    <header class="flex h-[76px] shrink-0 items-center justify-between border-b border-bg-300 px-5">
      <h2 class="font-lina text-body font-semibold text-overlay-dark-80">
        검색 결과 ({{ sources.length }}개)
      </h2>
      <button
        type="button"
        aria-label="출처 패널 닫기"
        class="inline-flex size-9 items-center justify-center rounded-button text-overlay-dark-60 transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
        @click="$emit('close')"
      >
        <X aria-hidden="true" class="size-5" />
      </button>
    </header>

    <div class="p-5">
      <div
        class="grid grid-cols-2 rounded-full bg-bg-200 p-1 font-lina text-small font-semibold"
        role="tablist"
        aria-label="출처 보기 방식"
      >
        <button
          data-testid="reference-list-tab"
          type="button"
          role="tab"
          :aria-selected="activeView === 'list'"
          class="rounded-full py-2 transition"
          :class="activeView === 'list' ? 'bg-primary text-primary-white' : 'text-overlay-dark-40'"
          @click="activeView = 'list'"
        >
          List
        </button>
        <button
          data-testid="reference-graph-tab"
          type="button"
          role="tab"
          :aria-selected="activeView === 'graph'"
          class="rounded-full py-2 transition"
          :class="activeView === 'graph' ? 'bg-primary text-primary-white' : 'text-overlay-dark-40'"
          @click="activeView = 'graph'"
        >
          Graph
        </button>
      </div>
    </div>

    <div v-if="activeView === 'list'" class="flex-1 px-5 pb-5">
      <article
        v-for="source in sources"
        :key="source.pageId"
        data-testid="reference-list-item"
        tabindex="0"
        class="group relative border-b border-bg-300 py-4 outline-none transition hover:bg-bg-100 focus-visible:bg-bg-100 focus-visible:shadow-focus"
        @mouseenter="hoveredPageId = source.pageId"
        @mouseleave="hoveredPageId = ''"
        @focusin="hoveredPageId = source.pageId"
        @focusout="hoveredPageId = ''"
      >
        <div
          v-if="hoveredPageId === source.pageId && hoveredPreview"
          data-testid="reference-hover-preview"
          class="absolute right-full top-0 z-40 pr-5"
        >
          <div class="relative">
            <PreviewPageCard :page="hoveredPreview" />
          </div>
        </div>

        <div>
          <div class="min-w-0">
            <div class="flex items-start gap-2">
              <FileText
                data-testid="reference-source-icon"
                aria-hidden="true"
                class="mt-1 size-4 shrink-0 text-overlay-dark-40"
              />
              <p class="font-lina text-body font-semibold leading-6 text-overlay-dark-80">
                <template
                  v-for="(segment, index) in highlightSegments(source.title)"
                  :key="`${segment.text}-${index}`"
                >
                  <mark v-if="segment.isHighlighted" class="rounded bg-primary-50 text-inherit">
                    {{ segment.text }}
                  </mark>
                  <template v-else>{{ segment.text }}</template>
                </template>
              </p>
            </div>
            <p class="mt-2 truncate pl-6 font-lina text-small text-overlay-dark-40">
              <template
                v-for="(segment, index) in highlightSegments(sourcePath(source))"
                :key="`${segment.text}-${index}`"
              >
                <mark v-if="segment.isHighlighted" class="rounded bg-primary-50 text-inherit">
                  {{ segment.text }}
                </mark>
                <template v-else>{{ segment.text }}</template>
              </template>
            </p>
          </div>
        </div>

        <div class="mt-3 pl-6">
          <div class="flex items-center gap-3 font-lina text-small text-overlay-dark-40">
            <span class="inline-flex items-center gap-1">
              <UserRound data-testid="reference-author-icon" aria-hidden="true" class="size-3.5" />
              {{ authorName(source) }}
            </span>
            <span class="inline-flex items-center gap-1">
              <Clock3 data-testid="reference-date-icon" aria-hidden="true" class="size-3.5" />
              <time :datetime="source.sourceUpdatedAt">{{
                formatDate(source.sourceUpdatedAt)
              }}</time>
            </span>
          </div>
        </div>
      </article>
    </div>
    <div
      v-else
      data-testid="reference-graph-placeholder"
      class="mx-5 flex flex-1 items-center justify-center rounded-item border border-dashed border-bg-300 bg-bg-100 p-6 text-center font-lina text-small text-overlay-dark-60"
    >
      그래프 뷰는 준비 중입니다. 출처 관계 시각화는 feature16에서 제공됩니다.
    </div>
  </aside>
</template>
