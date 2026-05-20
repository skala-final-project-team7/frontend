<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat SCR-400 첫 진입 빈 상태 화면 구현.
          ASK LINA 브랜딩, 환영 문구, 마스코트, Confluence 문서 미리보기 스택을 표시한다.
작성일 : 2026-05-20
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-20, feature8 구현, SCR-400 ChatEmptyState 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import PreviewPageCard from '@/features/chat/PreviewPageCard.vue';
import { mockHomeConfluencePages } from '@/mocks/data';
import { mascotRealizeImageUrl, searchImageUrl, skpSymbolImageUrl } from '@/shared/assets';

defineProps({
  userName: {
    type: String,
    default: '00',
  },
});
</script>

<template>
  <Transition
    appear
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="translate-y-6 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
  >
    <section
      data-testid="chat-empty-state"
      aria-label="새 채팅 시작"
      class="relative mx-auto flex min-h-0 w-full max-w-none flex-1 flex-col items-center justify-center overflow-hidden px-6 pb-6 pt-4"
    >
    <div
      data-testid="ask-lina-logo"
      class="absolute left-1/2 top-4 flex -translate-x-1/2 items-center justify-center gap-2"
    >
      <span class="font-lina text-[42px] font-bold leading-none text-overlay-dark-80">ASK</span>
      <span
        data-testid="skp-symbol-crop"
        class="inline-flex h-10 w-14 items-center justify-center overflow-hidden"
      >
        <img
          data-testid="skp-symbol"
          :src="skpSymbolImageUrl"
          alt="SKP"
          class="h-12 w-[180px] max-w-none object-cover drop-shadow-[0_1px_5px_var(--color-primary)]"
        />
      </span>
      <span class="font-lina text-[48px] font-bold leading-none text-primary">LINA</span>
    </div>

    <p class="mt-20 font-lina text-[26px] leading-9 text-overlay-dark-80">
      환영합니다. <span class="text-primary">{{ userName }}</span
      >님
    </p>

    <div
      data-testid="preview-page-stack"
      class="relative mt-10 h-[380px] w-full max-w-[740px] -translate-x-8"
      aria-label="문서 미리보기"
    >
      <PreviewPageCard
        :page="mockHomeConfluencePages[0]"
        class="absolute left-1/2 top-8 z-20 -translate-x-[62%]"
      />

      <PreviewPageCard
        :page="mockHomeConfluencePages[1]"
        class="absolute left-1/2 top-0 z-10 -translate-x-[4%]"
      />

      <img
        data-testid="chat-empty-mascot"
        :src="mascotRealizeImageUrl"
        alt=""
        class="absolute bottom-5 left-[4%] z-30 h-36 w-36 object-contain"
      />
      <img
        data-testid="chat-empty-search-image"
        :src="searchImageUrl"
        alt=""
        class="absolute right-[-15%] top-[-120px] z-30 h-[360px] w-[360px] object-contain opacity-80"
      />
    </div>
    </section>
  </Transition>
</template>
