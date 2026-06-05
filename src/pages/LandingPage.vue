<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Auth 흐름의 SCR-100 Landing 화면.
          Continue with Confluence CTA를 LoginPage 진입으로 연결한다.
작성일 : 2026-06-05
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-05, feature12 구현, LandingPage 최초 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { useRouter } from 'vue-router';

import { mascotImageUrl } from '@/shared';

const router = useRouter();

function enterLogin() {
  void router.push('/login');
}
</script>

<template>
  <main
    data-testid="landing-page"
    class="relative flex min-h-screen flex-col overflow-hidden bg-bg-100 text-overlay-dark-80"
  >
    <header class="flex items-center gap-3 px-8 py-7">
      <img class="size-9 object-contain" :src="mascotImageUrl" alt="" aria-hidden="true" />
      <span class="text-xl font-bold">LINA</span>
    </header>

    <section
      class="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-24 text-center"
    >
      <p class="mb-6 text-heading font-semibold text-overlay-dark-80">LINA</p>
      <h1 class="max-w-2xl text-[40px] font-semibold leading-tight text-overlay-dark-80">
        Ask, search, and verify knowledge across your workspace.
      </h1>
      <button
        type="button"
        data-testid="landing-continue-button"
        class="mt-10 inline-flex min-h-12 items-center justify-center rounded-button border border-bg-300 bg-primary-white px-8 text-button font-bold text-overlay-dark-80 shadow-floating transition hover:brightness-105 focus-visible:outline-none focus-visible:shadow-focus"
        @click="enterLogin"
      >
        Continue with Confluence
      </button>
    </section>

    <footer
      class="absolute inset-x-0 bottom-8 text-center text-button font-bold text-overlay-dark-40"
    >
      ©2026 LINA | SKALA
    </footer>
  </main>
</template>
