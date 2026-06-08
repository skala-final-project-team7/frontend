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
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confluenceIconImageUrl, logoLinaCuteImageUrl, mascotImageUrl } from '@/shared';

const router = useRouter();
const loginPanelRef = ref<HTMLElement | null>(null);

// 장식용 정적 그래프다. 실제 데이터 탐색/확장 기능이 생기면 Cytoscape.js나 force-graph로 교체한다.
const graphNodes = [
  {
    label: 'Confluence',
    x: 50,
    y: 8,
    color: 'var(--color-graph-blue)',
    halo: 'color-mix(in srgb, var(--color-graph-blue) 36%, transparent)',
  },
  {
    label: 'Jira',
    x: 72,
    y: 18,
    color: 'var(--color-graph-sky)',
    halo: 'color-mix(in srgb, var(--color-graph-sky) 35%, transparent)',
  },
  {
    label: 'Figma',
    x: 28,
    y: 20,
    color: 'var(--color-graph-purple)',
    halo: 'color-mix(in srgb, var(--color-graph-purple) 34%, transparent)',
  },
  {
    label: 'Project Wiki',
    x: 84,
    y: 36,
    color: 'var(--color-graph-indigo)',
    halo: 'color-mix(in srgb, var(--color-graph-indigo) 32%, transparent)',
  },
  {
    label: 'Documentation',
    x: 15,
    y: 39,
    color: 'var(--color-success)',
    halo: 'color-mix(in srgb, var(--color-success) 24%, transparent)',
  },
  {
    label: 'Templates',
    x: 64,
    y: 38,
    color: 'var(--color-success)',
    halo: 'color-mix(in srgb, var(--color-success) 24%, transparent)',
  },
  {
    label: 'Storybook',
    x: 38,
    y: 45,
    color: 'var(--color-warning)',
    halo: 'color-mix(in srgb, var(--color-warning) 34%, transparent)',
  },
  {
    label: 'Operations',
    x: 89,
    y: 60,
    color: 'var(--color-primary-light)',
    halo: 'color-mix(in srgb, var(--color-primary-light) 40%, transparent)',
  },
  {
    label: 'Analytics',
    x: 10,
    y: 64,
    color: 'var(--color-error)',
    halo: 'color-mix(in srgb, var(--color-error) 20%, transparent)',
  },
  {
    label: 'Style Guide',
    x: 76,
    y: 70,
    color: 'var(--color-primary)',
    halo: 'color-mix(in srgb, var(--color-primary) 25%, transparent)',
  },
  {
    label: 'Accessibility',
    x: 31,
    y: 74,
    color: 'var(--color-graph-blue)',
    halo: 'color-mix(in srgb, var(--color-graph-blue) 34%, transparent)',
  },
  {
    label: 'Sprint Board',
    x: 58,
    y: 84,
    color: 'var(--color-graph-sky)',
    halo: 'color-mix(in srgb, var(--color-graph-sky) 34%, transparent)',
  },
] as const;

const graphLines = [
  [50, 43, 50, 8],
  [50, 43, 72, 18],
  [50, 43, 28, 20],
  [50, 43, 84, 36],
  [50, 43, 15, 39],
  [50, 43, 64, 38],
  [50, 43, 38, 45],
  [50, 43, 89, 60],
  [50, 43, 10, 64],
  [50, 43, 76, 70],
  [50, 43, 31, 74],
  [50, 43, 58, 84],
  [28, 20, 15, 39],
  [72, 18, 84, 36],
  [10, 64, 31, 74],
  [76, 70, 89, 60],
] as const;

const acronymWords = [
  { text: 'INKED', x: 31, y: -62 },
  { text: 'INTELLIGENCE', x: 43, y: 0 },
  { text: 'AVIGATION', x: 59, y: 0 },
  { text: 'GENT', x: 79, y: 0 },
] as const;

function enterLogin() {
  void router.push('/login');
}

function scrollToLoginPanel() {
  loginPanelRef.value?.scrollIntoView({ behavior: 'smooth' });
}
</script>

<template>
  <div
    data-testid="landing-page"
    class="h-screen snap-y snap-mandatory overflow-y-auto overflow-x-hidden bg-bg-100 text-overlay-dark-80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    <section
      data-testid="landing-hero-panel"
      class="relative flex h-screen snap-start snap-always flex-col items-center justify-center overflow-hidden bg-bg-100 px-6"
      aria-label="LINA 브랜드 소개"
    >
      <div
        data-testid="landing-graph"
        class="pointer-events-none absolute inset-0 z-0 opacity-90"
        aria-hidden="true"
      >
        <svg class="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line
            v-for="([x1, y1, x2, y2], index) in graphLines"
            :key="index"
            :x1="x1"
            :y1="y1"
            :x2="x2"
            :y2="y2"
            class="stroke-overlay-dark-10 opacity-50"
            stroke-width="0.08"
            stroke-linecap="round"
          />
        </svg>
        <span
          v-for="node in graphNodes"
          :key="node.label"
          class="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
          :style="{ left: `${node.x}%`, top: `${node.y}%` }"
        >
          <span
            class="absolute top-0 size-12 -translate-y-1/2 rounded-full blur-lg"
            :style="{ background: node.halo }"
            aria-hidden="true"
          />
          <span
            class="relative size-3 rounded-full opacity-75 ring-2 ring-primary-white/80"
            :style="{
              background: `radial-gradient(circle at 35% 30%, var(--color-primary-white), ${node.color})`,
              boxShadow: `0 0 16px ${node.halo}`,
            }"
            aria-hidden="true"
          />
          <span class="text-small font-normal tracking-[0.08em] text-overlay-dark-20">
            {{ node.label }}
          </span>
        </span>
      </div>

      <img
        class="relative z-10 w-[min(92vw,1060px)] object-contain"
        :src="logoLinaCuteImageUrl"
        alt="LINA"
      />
      <div class="pointer-events-none absolute inset-x-0 top-[52%] z-20" aria-hidden="true">
        <span
          v-for="word in acronymWords"
          :key="word.text"
          data-testid="landing-acronym-word"
          class="landing-acronym-word absolute -translate-x-1/2 -translate-y-1/2 text-body font-normal tracking-[0.34em] text-overlay-dark-80"
          :style="{ left: `${word.x}%`, top: `${word.y}%` }"
        >
          {{ word.text }}
        </span>
      </div>
      <button
        type="button"
        data-testid="landing-continue-button"
        class="absolute bottom-16 left-1/2 z-10 inline-flex -translate-x-1/2 flex-col items-center gap-2 text-button font-normal text-overlay-dark-40 transition hover:text-overlay-dark-80 focus-visible:outline-none focus-visible:shadow-focus"
        @click="scrollToLoginPanel"
      >
        <span>scroll</span>
        <span class="text-xl leading-none" aria-hidden="true">⌄</span>
      </button>
      <footer
        class="absolute inset-x-0 bottom-8 text-center text-button font-normal text-overlay-dark-40"
      >
        ©2026 LINA | SKALA
      </footer>
    </section>

    <section
      data-testid="landing-headline-panel"
      class="relative flex h-screen snap-start snap-always flex-col items-center justify-center overflow-hidden px-6 text-center"
      aria-label="LINA 서비스 소개"
    >
      <p class="text-button text-overlay-dark-40">Ask · Search · Verify</p>
      <h1 class="mt-5 max-w-3xl text-[54px] font-light leading-tight text-overlay-dark-80">
        Ask, search, and
        <span class="relative inline-block text-primary">
          verify
          <span
            class="absolute inset-x-0 bottom-1 h-0.5 rounded-tag bg-primary"
            aria-hidden="true"
          />
        </span>
        knowledge across your workspace.
      </h1>
      <p class="mt-8 text-body text-overlay-dark-40">
        Confluence 문서를 자연어로 검색하고, 답변과 출처를 함께 확인하세요.
      </p>
      <button
        type="button"
        class="absolute bottom-16 left-1/2 inline-flex -translate-x-1/2 flex-col items-center gap-2 text-button font-normal text-overlay-dark-40 transition hover:text-overlay-dark-80 focus-visible:outline-none focus-visible:shadow-focus"
        @click="scrollToLoginPanel"
      >
        <span>scroll</span>
        <span class="text-xl leading-none" aria-hidden="true">⌄</span>
      </button>
      <footer
        class="absolute inset-x-0 bottom-8 text-center text-button font-normal text-overlay-dark-40"
      >
        ©2026 LINA | SKALA
      </footer>
    </section>

    <section
      ref="loginPanelRef"
      data-testid="landing-login-panel"
      class="relative flex h-screen snap-start snap-always flex-col overflow-hidden bg-bg-100 text-overlay-dark-80"
      aria-label="로그인 진입"
    >
      <header class="flex items-center gap-3 px-8 py-7">
        <img class="size-9 object-contain" :src="mascotImageUrl" alt="" aria-hidden="true" />
        <span class="text-xl font-bold">LINA</span>
      </header>

      <section
        class="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 pt-24 text-center"
      >
        <h1 class="text-heading font-bold">Log in</h1>
        <p class="mt-8 text-xl text-overlay-dark-80">
          LINA.ai와 함께 Confluence 안의 지식을 빠르게 찾아보세요.
        </p>
        <p class="mt-6 text-body text-overlay-dark-40">
          Confluence 문서를 기반으로 필요한 정보를 검색하고, 답변과 출처를 함께 확인할 수 있습니다.
        </p>

        <button
          type="button"
          data-testid="landing-login-button"
          class="mt-8 inline-flex min-h-16 w-full max-w-[436px] items-center justify-center gap-8 rounded-card border border-bg-300 bg-primary-white px-8 text-xl text-overlay-dark-80 transition hover:brightness-105 focus-visible:outline-none focus-visible:shadow-focus"
          @click="enterLogin"
        >
          <img
            class="size-8 object-contain"
            :src="confluenceIconImageUrl"
            alt=""
            aria-hidden="true"
          />
          <span>Continue with Confluence</span>
        </button>

        <nav class="mt-5 flex items-center gap-5 text-body text-overlay-dark-40" aria-label="약관">
          <a class="hover:text-overlay-dark-80" href="#">Terms of Use</a>
          <span aria-hidden="true">|</span>
          <a class="hover:text-overlay-dark-80" href="#">Privacy Policy</a>
        </nav>
      </section>

      <footer
        class="absolute inset-x-0 bottom-8 text-center text-button font-normal text-overlay-dark-40"
      >
        ©2026 LINA | SKALA
      </footer>
    </section>
  </div>
</template>

<style scoped>
.landing-acronym-word {
  opacity: 0;
  animation: landing-acronym-rise 1100ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.landing-acronym-word:nth-child(2) {
  animation-delay: 220ms;
}

.landing-acronym-word:nth-child(3) {
  animation-delay: 440ms;
}

.landing-acronym-word:nth-child(4) {
  animation-delay: 660ms;
}

@keyframes landing-acronym-rise {
  from {
    opacity: 0;
    transform: translate(-50%, -85%);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
</style>
