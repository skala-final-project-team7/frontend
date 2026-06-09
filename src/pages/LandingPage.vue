<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Auth 흐름의 SCR-100 Landing 화면.
          Continue with Confluence CTA를 LoginPage 진입으로 연결한다.
작성일 : 2026-06-05
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-05, feature12 구현, LandingPage 최초 작성
  - 2026-06-08, 디자인 개선, 3패널 스냅 스크롤 구조, 장식용 지식 그래프 배경, acronym rise animation
  - 2026-06-08, 디자인 개선, headline 패널 2단계 전환(tagline→feature showcase) 추가
  - 2026-06-08, 디자인 개선, Ask 탭 화살표 SVG 스웁 곡선으로 개선
  - 2026-06-08, 디자인 개선, lina-ask/search/verify 캐릭터 이미지 각 탭 하단에 배치
  - 2026-06-08, UX 개선, 탭 전환 Transition fade 추가, 스냅 스크롤 scroll-smooth 적용
  - 2026-06-09, 디자인 개선, Verify mockup을 고정 높이 list/graph 토글 구조로 변경
  - 2026-06-09, 디자인 조정, Ask 캐릭터 foot shadow 제거
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { BookOpenCheck, Check, FileText, MessageCircle, Search } from '@lucide/vue';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  BaseSpinner,
  chatInputBoxImageUrl,
  chatScreenshotImageUrl,
  confluenceIconImageUrl,
  iconsImageUrl,
  linaAskImageUrl,
  linaSearchImageUrl,
  linaVerifyImageUrl,
  logoLinaCuteImageUrl,
} from '@/shared';

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
  { text: 'INKED', x: 30, y: -62 },
  { text: 'INTELLIGENCE', x: 42, y: 0 },
  { text: 'AVIGATION', x: 59, y: 0 },
  { text: 'GENT', x: 78, y: 0 },
] as const;

function enterLogin() {
  void router.push('/login');
}

function scrollToLoginPanel() {
  loginPanelRef.value?.scrollIntoView({ behavior: 'smooth' });
}

const heroPanelRef = ref<HTMLElement | null>(null);

function scrollToHeroPanel() {
  heroPanelRef.value?.scrollIntoView({ behavior: 'smooth' });
}

const headlinePanelRef = ref<HTMLElement | null>(null);
const featurePhase = ref(false);
const activeTab = ref<'ask' | 'search' | 'verify'>('ask');

const tabs: { id: 'ask' | 'search' | 'verify'; label: string }[] = [
  { id: 'ask', label: 'Ask' },
  { id: 'search', label: 'Search' },
  { id: 'verify', label: 'Verify' },
];

const tabData = {
  ask: {
    description:
      'Confluence, Notion, Slack 등 흩어진 나의 지식들을 모아 자연어로 바로 질문하세요. 키워드가 기억나지 않아도 됩니다.',
    bullets: ['자연어로 질문 입력', '키워드 없이도 정확한 답변', '여러 소스를 한 번에 탐색'],
  },
  search: {
    description:
      'Confluence, Notion, Slack 등 흩어진 나의 지식들을 모아 확인하세요. 원하는 정보가 어디 숨어있든 수초 안에 찾아냅니다.',
    bullets: [
      '10,000+ 문서 실시간 인덱싱',
      '평균 응답 시간 3초 이내',
      '스페이스·페이지·첨부파일 통합 검색',
    ],
  },
  verify: {
    description:
      '산재된 지식을 모아 연결합니다. 답변과 함께 원문 문서를 바로 확인하고, 지식이 어떻게 연결되는지 그래프로 시각화합니다.',
    bullets: [
      '모든 답변에 출처 문서 링크 제공',
      '관련 문서를 리스트로 한눈에 확인',
      '지식 연결 그래프로 맥락 파악',
    ],
  },
} as const;

const verifyDocs = [
  { title: 'AWS 계정 접속 가이드', space: 'Infra', date: '2일 전' },
  { title: 'SSO 로그인 절차 안내', space: 'IT Support', date: '1주 전' },
  { title: '신입사원 온보딩 FAQ', space: 'HR', date: '3일 전' },
] as const;
const verifyView = ref<'graph' | 'list'>('graph');

onMounted(() => {
  // 탭별 캐릭터 이미지를 미리 fetch+decode 해두어 탭 전환 시 이미지 pop-in 버벅임을 막는다.
  for (const src of [linaAskImageUrl, linaSearchImageUrl, linaVerifyImageUrl]) {
    const preload = new Image();
    preload.src = src;
    void preload.decode?.().catch(() => undefined);
  }

  if (!headlinePanelRef.value) return;
  if (typeof IntersectionObserver === 'undefined') {
    featurePhase.value = true;
    return;
  }

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          featurePhase.value = true;
        }, 900);
        observer.disconnect();
      }
    },
    { threshold: 0.8 },
  );
  observer.observe(headlinePanelRef.value);
});
</script>

<template>
  <div
    data-testid="landing-page"
    class="h-screen scroll-smooth snap-y snap-mandatory overflow-y-auto overflow-x-hidden bg-bg-100 text-overlay-dark-80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    <section
      ref="heroPanelRef"
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
      <button
        type="button"
        data-testid="landing-cta-button"
        class="landing-cta-button absolute bottom-20 right-12 z-30 inline-flex items-center gap-3 rounded-full border border-overlay-dark-20 bg-primary-white/80 px-8 py-3.5 text-button font-medium text-overlay-dark-80 backdrop-blur-sm transition-all hover:border-overlay-dark-40 hover:bg-primary-white hover:shadow-sm focus-visible:outline-none focus-visible:shadow-focus"
        @click="enterLogin"
      >
        <span>바로가기</span>
        <svg class="size-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
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
        class="landing-scroll-indicator absolute bottom-16 left-1/2 z-10 inline-flex flex-col items-center gap-2 text-button font-normal text-overlay-dark-60 transition hover:text-overlay-dark-80 focus-visible:outline-none focus-visible:shadow-focus"
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
      ref="headlinePanelRef"
      data-testid="landing-headline-panel"
      class="relative h-screen snap-start snap-always overflow-hidden"
      aria-label="LINA 서비스 소개"
    >
      <!-- Phase 1: 인트로 태그라인 (위로 날아가며 사라짐) -->
      <div
        class="landing-headline-tagline absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        :class="{ 'landing-headline-tagline--exit': featurePhase }"
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
      </div>

      <!-- Phase 2: 피처 쇼케이스 (아래서 올라오며 나타남) -->
      <div
        class="landing-headline-features absolute inset-0 flex flex-col items-center justify-center px-8 pb-20"
        :class="{ 'landing-headline-features--visible': featurePhase }"
      >
        <p class="text-button uppercase tracking-[0.2em] text-overlay-dark-40">How it works</p>
        <h2 class="mt-3 text-[38px] font-light text-overlay-dark-80">LINA와 함께하는 방식</h2>

        <!-- 탭 스위처 -->
        <div class="mt-7 flex rounded-full border border-bg-300 bg-bg-100 p-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            :data-testid="`landing-feature-tab-${tab.id}`"
            class="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-button transition-all"
            :class="
              activeTab === tab.id
                ? 'bg-overlay-dark-80 font-medium text-primary-white'
                : 'text-overlay-dark-40 hover:text-overlay-dark-80'
            "
            @click="activeTab = tab.id"
          >
            <MessageCircle
              v-if="tab.id === 'ask'"
              data-testid="landing-ask-tab-icon"
              class="size-4 shrink-0"
              aria-hidden="true"
            />
            <Search
              v-else-if="tab.id === 'search'"
              data-testid="landing-search-tab-icon"
              class="size-4 shrink-0"
              aria-hidden="true"
            />
            <BookOpenCheck
              v-else
              data-testid="landing-verify-tab-icon"
              class="size-4 shrink-0"
              aria-hidden="true"
            />
            {{ tab.label }}
          </button>
        </div>

        <!-- 탭 콘텐츠 -->
        <Transition name="tab-fade" mode="out-in">
          <div
            :key="activeTab"
            class="mt-10 grid w-full max-w-5xl grid-cols-2 items-start gap-14"
            style="min-height: 380px"
          >
            <!-- 좌측: 설명 텍스트 -->
            <div class="text-left" style="min-height: 320px">
              <div class="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                <MessageCircle
                  v-if="activeTab === 'ask'"
                  data-testid="landing-feature-icon-ask"
                  class="size-7 text-primary"
                  aria-hidden="true"
                />
                <Search
                  v-else-if="activeTab === 'search'"
                  data-testid="landing-feature-icon-search"
                  class="size-7 text-primary"
                  aria-hidden="true"
                />
                <BookOpenCheck
                  v-else
                  data-testid="landing-feature-icon-verify"
                  class="size-7 text-primary"
                  aria-hidden="true"
                />
              </div>

              <h3 class="text-[30px] font-light leading-tight text-overlay-dark-80">
                <template v-if="activeTab === 'ask'">무엇이든 물어보세요</template>
                <template v-else-if="activeTab === 'search'">
                  수백 개 문서를 <span class="text-primary">3초</span> 안에
                </template>
                <template v-else>출처를 리스트와 그래프로</template>
              </h3>

              <p class="mt-4 text-body leading-relaxed text-overlay-dark-40">
                {{ tabData[activeTab].description }}
              </p>

              <ul class="mt-6 space-y-3">
                <li
                  v-for="bullet in tabData[activeTab].bullets"
                  :key="bullet"
                  class="flex items-center gap-3 text-body text-overlay-dark-60"
                >
                  <span
                    class="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15"
                  >
                    <Check class="size-3 text-primary" aria-hidden="true" />
                  </span>
                  {{ bullet }}
                </li>
              </ul>

              <div class="-mt-10 flex min-h-[150px] items-start justify-end">
                <img
                  v-if="activeTab === 'ask'"
                  :src="linaAskImageUrl"
                  alt=""
                  aria-hidden="true"
                  class="w-36 object-contain"
                />
                <img
                  v-else-if="activeTab === 'search'"
                  :src="linaSearchImageUrl"
                  alt=""
                  aria-hidden="true"
                  class="w-36 object-contain drop-shadow-sm"
                />
                <img
                  v-else
                  :src="linaVerifyImageUrl"
                  alt=""
                  aria-hidden="true"
                  class="w-36 object-contain mix-blend-darken"
                />
              </div>
            </div>

            <!-- 우측: 시각적 목업 -->
            <div style="min-height: 340px">
              <!-- Search 탭: 브라우저 채팅 목업 -->
              <div
                v-if="activeTab === 'search'"
                class="overflow-hidden rounded-2xl border border-bg-300 shadow-lg"
              >
                <div class="flex items-center gap-3 border-b border-bg-300 bg-bg-200 px-4 py-2.5">
                  <div class="flex gap-1.5">
                    <span class="size-3 rounded-full bg-red-400/60" />
                    <span class="size-3 rounded-full bg-yellow-400/60" />
                    <span class="size-3 rounded-full bg-green-400/60" />
                  </div>
                  <div
                    class="mx-auto w-36 rounded-md bg-bg-300 py-1 text-center text-[10px] text-overlay-dark-40"
                  >
                    lina.ai.com
                  </div>
                </div>
                <div class="flex h-[300px] bg-bg-100">
                  <div class="flex w-11 flex-col items-center gap-4 border-r border-bg-200 pt-4">
                    <span
                      class="flex size-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary"
                      >L</span
                    >
                    <span class="size-1.5 rounded-full bg-overlay-dark-20" />
                    <span class="size-1.5 rounded-full bg-overlay-dark-10" />
                    <span class="size-1.5 rounded-full bg-overlay-dark-10" />
                  </div>
                  <div class="flex flex-1 flex-col">
                    <div class="border-b border-bg-200 px-4 py-3">
                      <p class="text-[10px] font-semibold text-overlay-dark-60">
                        S3 버킷 권한 오류
                      </p>
                    </div>
                    <div class="flex flex-1 flex-col gap-3 overflow-hidden px-4 py-4">
                      <div
                        class="ml-10 self-end rounded-2xl bg-bg-200 px-3 py-2 text-xs leading-relaxed text-overlay-dark-80"
                      >
                        지난 S3 버킷 권한 오류 때 어떻게 해결했어?
                      </div>
                      <div class="origin-left scale-75 self-start">
                        <BaseSpinner label="답변을 작성하고 있어요" />
                      </div>
                      <p class="self-start text-xs leading-relaxed text-overlay-dark-80">
                        S3 권한 오류는 IAM 정책과 버킷 정책을<br />함께 점검해 해결했습니다.
                      </p>
                    </div>
                    <div class="border-t border-bg-200 px-3 py-2.5">
                      <div class="rounded-full bg-bg-200 px-4 py-2 text-xs text-overlay-dark-40">
                        무엇이든 물어보세요...
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Verify 탭: list / graph 토글 목업 -->
              <div v-else-if="activeTab === 'verify'">
                <div class="overflow-hidden rounded-2xl border border-bg-300 bg-bg-50 shadow-sm">
                  <div class="flex items-center justify-between border-b border-bg-200 px-5 py-3">
                    <div>
                      <p class="text-xs font-medium text-overlay-dark-80">출처</p>
                      <p class="mt-1 text-[10px] text-overlay-dark-40">
                        토글을 전환하여 리스트 혹은 그래프 형식으로 확인할 수 있습니다.
                      </p>
                    </div>
                    <div class="flex rounded-full border border-bg-300 bg-bg-100 p-1">
                      <button
                        type="button"
                        data-testid="landing-verify-toggle-list"
                        class="rounded-full px-4 py-1.5 text-[11px] transition"
                        :class="
                          verifyView === 'list'
                            ? 'bg-overlay-dark-80 text-primary-white'
                            : 'text-overlay-dark-40 hover:text-overlay-dark-80'
                        "
                        @click="verifyView = 'list'"
                      >
                        list
                      </button>
                      <button
                        type="button"
                        data-testid="landing-verify-toggle-graph"
                        class="rounded-full px-4 py-1.5 text-[11px] transition"
                        :class="
                          verifyView === 'graph'
                            ? 'bg-overlay-dark-80 text-primary-white'
                            : 'text-overlay-dark-40 hover:text-overlay-dark-80'
                        "
                        @click="verifyView = 'graph'"
                      >
                        graph
                      </button>
                    </div>
                  </div>

                  <div class="h-[268px] bg-bg-50 px-5 py-4">
                    <div
                      v-if="verifyView === 'list'"
                      data-testid="landing-verify-list-panel"
                      class="divide-y divide-bg-200 overflow-hidden rounded-2xl border border-bg-200 bg-primary-white"
                    >
                      <div
                        v-for="doc in verifyDocs"
                        :key="doc.title"
                        class="flex items-center gap-3 px-5 py-4"
                      >
                        <div
                          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10"
                        >
                          <FileText class="size-4 text-primary" aria-hidden="true" />
                        </div>
                        <div class="min-w-0">
                          <p class="truncate text-xs font-medium text-overlay-dark-80">
                            {{ doc.title }}
                          </p>
                          <p class="mt-1 text-[10px] text-overlay-dark-40">
                            {{ doc.space }} · {{ doc.date }}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      v-else
                      data-testid="landing-verify-graph-panel"
                      class="flex h-full flex-col overflow-hidden rounded-2xl border border-bg-200 bg-primary-white px-5 py-4"
                    >
                      <p class="mb-3 text-xs font-medium text-overlay-dark-80">지식 연결 그래프</p>
                      <svg viewBox="0 0 360 88" class="h-full w-full" aria-hidden="true">
                        <!-- colored lines matching node hues -->
                        <line
                          x1="180"
                          y1="44"
                          x2="80"
                          y2="18"
                          style="stroke: var(--color-graph-sky); opacity: 0.45"
                          stroke-width="1.5"
                        />
                        <line
                          x1="180"
                          y1="44"
                          x2="280"
                          y2="18"
                          style="stroke: var(--color-graph-indigo); opacity: 0.45"
                          stroke-width="1.5"
                        />
                        <line
                          x1="180"
                          y1="44"
                          x2="110"
                          y2="70"
                          style="stroke: var(--color-graph-purple); opacity: 0.35"
                          stroke-width="1.2"
                        />
                        <line
                          x1="180"
                          y1="44"
                          x2="260"
                          y2="70"
                          style="stroke: var(--color-success); opacity: 0.35"
                          stroke-width="1.2"
                        />
                        <line
                          x1="80"
                          y1="18"
                          x2="30"
                          y2="44"
                          style="stroke: var(--color-bg-300)"
                          stroke-width="1"
                        />
                        <line
                          x1="280"
                          y1="18"
                          x2="334"
                          y2="44"
                          style="stroke: var(--color-bg-300)"
                          stroke-width="1"
                        />
                        <!-- center node halo + fill -->
                        <circle
                          cx="180"
                          cy="44"
                          r="16"
                          style="fill: var(--color-graph-blue); opacity: 0.15"
                        />
                        <circle cx="180" cy="44" r="9" style="fill: var(--color-graph-blue)" />
                        <text
                          x="180"
                          y="62"
                          text-anchor="middle"
                          font-size="7.5"
                          style="fill: var(--color-overlay-dark-60)"
                        >
                          AWS 접속
                        </text>
                        <circle cx="80" cy="18" r="6" style="fill: var(--color-graph-sky)" />
                        <text
                          x="80"
                          y="10"
                          text-anchor="middle"
                          font-size="7"
                          style="fill: var(--color-overlay-dark-40)"
                        >
                          SSO 설정
                        </text>
                        <circle cx="280" cy="18" r="6" style="fill: var(--color-graph-indigo)" />
                        <text
                          x="280"
                          y="10"
                          text-anchor="middle"
                          font-size="7"
                          style="fill: var(--color-overlay-dark-40)"
                        >
                          VPN 가이드
                        </text>
                        <circle cx="110" cy="70" r="4.5" style="fill: var(--color-graph-purple)" />
                        <text
                          x="110"
                          y="83"
                          text-anchor="middle"
                          font-size="7"
                          style="fill: var(--color-overlay-dark-40)"
                        >
                          IAM 권한
                        </text>
                        <circle cx="260" cy="70" r="4.5" style="fill: var(--color-success)" />
                        <text
                          x="260"
                          y="83"
                          text-anchor="middle"
                          font-size="7"
                          style="fill: var(--color-overlay-dark-40)"
                        >
                          보안 정책
                        </text>
                        <circle cx="30" cy="44" r="3" style="fill: var(--color-overlay-dark-10)" />
                        <circle cx="334" cy="44" r="3" style="fill: var(--color-overlay-dark-10)" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ask 탭: 브라우저에서 질문 입력 박스로 이어지는 흐름 -->
              <div v-else data-testid="landing-ask-mockup" class="relative h-[340px]">
                <div
                  class="absolute left-0 top-2 z-10 w-[58%] overflow-hidden rounded-2xl border border-bg-200 shadow-lg"
                  style="height: 265px"
                >
                  <div class="flex items-center gap-3 border-b border-bg-300 bg-bg-200 px-4 py-2.5">
                    <div class="flex gap-1.5">
                      <span class="size-3 rounded-full bg-red-400/60" />
                      <span class="size-3 rounded-full bg-yellow-400/60" />
                      <span class="size-3 rounded-full bg-green-400/60" />
                    </div>
                    <div
                      class="mx-auto w-36 rounded-md bg-bg-300 py-1 text-center text-[10px] text-overlay-dark-40"
                    >
                      lina.ai.com
                    </div>
                  </div>
                  <img
                    :src="chatScreenshotImageUrl"
                    alt="LINA 채팅 화면"
                    class="w-full object-cover object-top"
                    style="height: 227px"
                  />
                </div>

                <svg
                  data-testid="landing-ask-arrow"
                  class="landing-ask-arrow pointer-events-none absolute inset-0 z-20 h-full w-full"
                  viewBox="0 0 520 340"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    data-testid="landing-ask-arrow-path"
                    d="M 152 236 C 168 168 268 140 310 140"
                    stroke="var(--color-primary)"
                    stroke-width="5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M 287 130 L 310 140 L 290 155"
                    stroke="var(--color-primary)"
                    stroke-width="5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>

                <img
                  :src="iconsImageUrl"
                  alt=""
                  aria-hidden="true"
                  class="absolute right-14 -top-10 z-20 w-28 object-contain opacity-90 drop-shadow-sm"
                />
                <img
                  data-testid="landing-ask-input-box"
                  :src="chatInputBoxImageUrl"
                  alt="질문 입력"
                  class="absolute -right-28 top-24 z-30 w-[60%] drop-shadow-xl"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <button
        type="button"
        class="landing-scroll-indicator absolute bottom-16 left-1/2 z-10 inline-flex -translate-x-1/2 flex-col items-center gap-2 text-button font-normal text-overlay-dark-60 transition hover:text-overlay-dark-80 focus-visible:outline-none focus-visible:shadow-focus"
        @click="scrollToLoginPanel"
      >
        <span>scroll</span>
        <span class="text-xl leading-none" aria-hidden="true">⌄</span>
      </button>
      <footer
        class="absolute inset-x-0 bottom-8 z-10 text-center text-button font-normal text-overlay-dark-40"
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

      <button
        type="button"
        class="landing-scroll-indicator absolute bottom-16 left-1/2 z-10 inline-flex -translate-x-1/2 flex-col items-center gap-2 text-button font-normal text-overlay-dark-60 transition hover:text-overlay-dark-80 focus-visible:outline-none focus-visible:shadow-focus"
        @click="scrollToHeroPanel"
      >
        <span class="text-xl leading-none" aria-hidden="true">⌃</span>
        <span>scroll</span>
      </button>
      <footer
        class="absolute inset-x-0 bottom-8 text-center text-button font-normal text-overlay-dark-40"
      >
        ©2026 LINA | SKALA
      </footer>
    </section>
  </div>
</template>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms cubic-bezier(0.22, 1, 0.36, 1);
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.landing-acronym-word {
  opacity: 0;
  animation: landing-acronym-rise 1800ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.landing-acronym-word:nth-child(2) {
  animation-delay: 420ms;
}

.landing-acronym-word:nth-child(3) {
  animation-delay: 640ms;
}

.landing-acronym-word:nth-child(4) {
  animation-delay: 960ms;
}

.landing-scroll-indicator {
  animation: landing-scroll-float 1800ms ease-in-out infinite;
  filter: drop-shadow(0 10px 18px color-mix(in srgb, var(--color-primary) 24%, transparent));
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

.landing-headline-tagline {
  z-index: 5;
  transition:
    transform 700ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity 500ms ease;
}

.landing-headline-tagline--exit {
  transform: translateY(-22vh) scale(0.52);
  opacity: 0;
  pointer-events: none;
}

.landing-headline-features {
  z-index: 4;
  opacity: 0;
  transform: translateY(22px);
  pointer-events: none;
  transition:
    opacity 650ms ease 320ms,
    transform 650ms cubic-bezier(0.22, 1, 0.36, 1) 320ms;
}

.landing-headline-features--visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.landing-cta-button {
  opacity: 0;
  animation: landing-cta-rise 900ms cubic-bezier(0.22, 1, 0.36, 1) 1800ms forwards;
}

@keyframes landing-cta-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes landing-scroll-float {
  0%,
  100% {
    transform: translate(-50%, 0);
  }

  50% {
    transform: translate(-50%, -12px);
  }
}
</style>
