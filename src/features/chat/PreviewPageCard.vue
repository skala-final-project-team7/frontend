<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat/Reference에서 재사용할 Confluence 페이지 미리보기 카드 구현.
          SCR-400 문서 스택과 향후 출처 패널 hover preview의 공통 시각 요소로 사용한다.
작성일 : 2026-05-20
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-20, feature8 보정, PreviewPageCard 최초 작성
  - 2026-05-20, feature8 보정, hover 시 URL 복사/외부 이동 액션과 breadcrumbs 표시 추가
  - 2026-05-20, feature8 보정, 툴팁이 카드 overflow-hidden에 잘리지 않도록 wrapper 분리
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { ArrowUpRight, Link2 } from '@lucide/vue';
import DOMPurify from 'dompurify';
import { computed, type PropType } from 'vue';

import { useToast } from '@/composables/useToast';
import { BaseTooltip } from '@/shared';
import type { ConfluencePagePreview } from '@/types/api';

const { showToast } = useToast();

const props = defineProps({
  page: {
    type: Object as PropType<ConfluencePagePreview>,
    required: true,
  },
});

const formatUpdatedLabel = (updatedAt: string) => {
  const parsedDate = new Date(updatedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsedDate.getDate()}`.padStart(2, '0');

  return `${year}.${month}.${day} 게시됨`;
};

const sanitizedBodyViewValue = computed(() =>
  DOMPurify.sanitize(props.page.bodyViewValue, {
    USE_PROFILES: {
      html: true,
    },
  }),
);

async function copyPageUrl() {
  try {
    await navigator.clipboard.writeText(props.page.pageUrl);
    showToast('원본 URL이 복사되었습니다');
  } catch {
    showToast('URL 복사에 실패했습니다', { variant: 'error' });
  }
}
</script>

<template>
  <div class="group">
    <article
      data-testid="preview-page-card"
      role="article"
      tabindex="0"
      class="aspect-[166/191] w-[208px] overflow-hidden rounded-item bg-primary-white p-5 text-overlay-dark-80 shadow-floating outline-none transition-shadow group-hover:shadow-card-press focus-visible:shadow-focus sm:w-[272px]"
    >
      <p class="text-small text-overlay-dark-40">
        {{ formatUpdatedLabel(props.page.updatedAt) }} · {{ props.page.authorName }} 작성
      </p>
      <!-- eslint-disable vue/no-v-html -->
      <div
        data-testid="preview-page-card-body"
        class="preview-page-card-body mt-5 text-small"
        v-html="sanitizedBodyViewValue"
      />
      <!-- eslint-enable vue/no-v-html -->
    </article>

    <div
      data-testid="preview-page-card-actions"
      class="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    >
      <BaseTooltip label="원본 URL 복사" placement="top">
        <button
          data-testid="preview-page-card-copy"
          type="button"
          aria-label="원본 URL 복사"
          class="inline-flex size-7 items-center justify-center rounded-button bg-primary-white/90 text-overlay-dark-80 shadow-sm transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
          @click.stop="copyPageUrl"
        >
          <Link2 aria-hidden="true" class="size-4" />
        </button>
      </BaseTooltip>
      <BaseTooltip label="원본 새 탭으로 열기" placement="top">
        <a
          data-testid="preview-page-card-external"
          :href="props.page.pageUrl"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="원본 새 탭으로 열기"
          class="inline-flex size-7 items-center justify-center rounded-button bg-primary-white/90 text-overlay-dark-80 shadow-sm transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
          @click.stop
        >
          <ArrowUpRight aria-hidden="true" class="size-4" />
        </a>
      </BaseTooltip>
    </div>

    <nav
      v-if="props.page.breadcrumbs.length > 0"
      data-testid="preview-page-card-breadcrumbs"
      aria-label="페이지 경로"
      class="pointer-events-none absolute bottom-5 left-5 right-5 truncate text-small text-overlay-dark-40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    >
      <template v-for="(crumb, index) in props.page.breadcrumbs" :key="`${index}-${crumb}`">
        <span v-if="index > 0" aria-hidden="true" class="mx-1">&gt;</span>
        <span>{{ crumb }}</span>
      </template>
    </nav>
  </div>
</template>
