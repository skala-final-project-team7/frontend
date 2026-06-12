<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : Settings 모달 위에 표시되는 대형 도움말 모달.
          Ask/Search/Verify 사용 가이드 3개 섹션을 1|2|3 가로 배치로 보여준다.
작성일 : 2026-06-12
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-12, feature18 구현, 도움말 전용 오버레이 모달과 3단 가이드 섹션 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { BookOpenCheck, Check, MessageCircle, Search, X } from '@lucide/vue';
import { nextTick, watch } from 'vue';

import {
  chatInputBoxImageUrl,
  linaAskImageUrl,
  linaSearchImageUrl,
  linaVerifyImageUrl,
} from '@/shared/assets';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const helpSections = [
  {
    id: 'ask',
    step: '01',
    label: 'Ask',
    title: '무엇이든 물어보세요',
    description: '채팅 입력창에 자연어로 질문하면 LINA가 사내 문서를 기반으로 답변합니다.',
    bullets: [
      '키워드가 기억나지 않아도 자연어로 질문할 수 있어요',
      'Enter로 전송, Shift+Enter로 줄바꿈',
      '답변에 이어서 후속 질문으로 깊이 파고들 수 있어요',
    ],
  },
  {
    id: 'search',
    step: '02',
    label: 'Search',
    title: '대화를 찾고 고정하세요',
    description: '사이드바에서 지난 대화를 검색하고, 자주 보는 대화는 고정해 관리할 수 있습니다.',
    bullets: [
      '사이드바 검색으로 지난 대화를 빠르게 찾기 (2~50자)',
      '대화 메뉴의 고정으로 자주 쓰는 대화를 사이드바 상단에 유지',
      '최근 대화 목록에서 바로 이동',
    ],
  },
  {
    id: 'verify',
    step: '03',
    label: 'Verify',
    title: '출처를 확인하세요',
    description:
      '답변 하단의 출처 버튼으로 원본 문서를 확인하고, 지식의 연결을 그래프로 살펴보세요.',
    bullets: [
      '모든 답변에 출처·작성자·작성일 표시',
      '리스트/그래프 토글로 문서 관계 탐색',
      '출처에 마우스를 올리면 원본 문서 미리보기 표시',
    ],
  },
] as const;

function closeModal() {
  emit('close');
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closeModal();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const dialog = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;

  if (!dialog) {
    return;
  }

  const focusableElements = Array.from(
    dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (!firstElement || !lastElement) {
    event.preventDefault();
    dialog.focus();
    return;
  }

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      return;
    }

    await nextTick();
    document.querySelector<HTMLElement>('[data-testid="settings-help-close-button"]')?.focus();
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      data-testid="settings-help-backdrop"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-overlay-dark-20 px-4"
      @click.self="closeModal"
    >
      <section
        data-testid="settings-help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-help-title"
        class="flex h-[min(88vh,860px)] w-full max-w-[1240px] flex-col rounded-[28px] bg-white px-11 py-10 shadow-[0_8px_44px_rgba(0,0,0,0.18)] outline-none"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <header
          class="flex shrink-0 items-center justify-between border-b border-overlay-dark-10 pb-7"
        >
          <div>
            <h2
              id="settings-help-title"
              data-testid="settings-help-title"
              class="font-lina text-[22px] font-bold text-black"
            >
              도움말
            </h2>
            <p class="mt-1 font-lina text-[13px] text-overlay-dark-40">
              LINA를 이렇게 사용해 보세요
            </p>
          </div>
          <button
            data-testid="settings-help-close-button"
            type="button"
            class="inline-flex size-9 items-center justify-center rounded-full text-black transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="도움말 닫기"
            @click="closeModal"
          >
            <X aria-hidden="true" class="size-5" />
          </button>
        </header>

        <div class="grid min-h-0 flex-1 grid-cols-3 gap-6 overflow-y-auto pt-8">
          <article
            v-for="section in helpSections"
            :key="section.id"
            :data-testid="`settings-help-card-${section.id}`"
            class="flex min-h-0 flex-col rounded-2xl border border-overlay-dark-10 p-6"
          >
            <div class="flex items-center justify-between">
              <div class="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <MessageCircle
                  v-if="section.id === 'ask'"
                  aria-hidden="true"
                  class="size-5 text-primary"
                />
                <Search
                  v-else-if="section.id === 'search'"
                  aria-hidden="true"
                  class="size-5 text-primary"
                />
                <BookOpenCheck v-else aria-hidden="true" class="size-5 text-primary" />
              </div>
              <span class="font-lina text-[26px] font-light text-overlay-dark-10">
                {{ section.step }}
              </span>
            </div>

            <p class="mt-4 font-lina text-[12px] uppercase tracking-[0.1em] text-overlay-dark-40">
              {{ section.label }}
            </p>
            <h3 class="mt-1 font-lina text-[16px] font-medium text-black">{{ section.title }}</h3>
            <p class="mt-2 font-lina text-[13px] leading-relaxed text-overlay-dark-40">
              {{ section.description }}
            </p>

            <ul class="mt-4 space-y-2.5">
              <li
                v-for="bullet in section.bullets"
                :key="bullet"
                class="flex items-start gap-2 font-lina text-[12px] leading-relaxed text-overlay-dark-60"
              >
                <span
                  class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-primary/15"
                >
                  <Check class="size-2.5 text-primary" aria-hidden="true" />
                </span>
                {{ bullet }}
              </li>
            </ul>

            <!-- Ask: 질문 입력 박스 목업 -->
            <div
              v-if="section.id === 'ask'"
              class="relative mt-auto flex min-h-[150px] items-center justify-center rounded-xl bg-bg-100 p-5 pt-6"
            >
              <img
                :src="chatInputBoxImageUrl"
                alt="질문 입력 예시"
                class="w-[82%] max-w-[300px] drop-shadow-lg"
              />
              <img
                :src="linaAskImageUrl"
                alt=""
                aria-hidden="true"
                class="absolute bottom-1 right-2 w-16 object-contain"
              />
            </div>

            <!-- Search: 브라우저 채팅 목업 -->
            <div
              v-else-if="section.id === 'search'"
              class="relative mt-auto flex min-h-[150px] items-center rounded-xl bg-bg-100 p-5 pt-6"
            >
              <div
                class="w-[82%] max-w-[300px] overflow-hidden rounded-xl border border-bg-300 bg-primary-white shadow-sm"
              >
                <div class="flex items-center gap-2 border-b border-bg-300 bg-bg-200 px-3 py-1.5">
                  <div class="flex gap-1">
                    <span class="size-1.5 rounded-full bg-red-400/60" />
                    <span class="size-1.5 rounded-full bg-yellow-400/60" />
                    <span class="size-1.5 rounded-full bg-green-400/60" />
                  </div>
                  <div
                    class="mx-auto w-24 rounded-md bg-bg-300 py-0.5 text-center text-[8px] text-overlay-dark-40"
                  >
                    lina.ai.com
                  </div>
                </div>
                <div class="flex flex-col gap-1.5 px-3 py-2.5">
                  <div
                    class="ml-6 self-end rounded-2xl bg-bg-200 px-2.5 py-1 text-[10px] leading-relaxed text-overlay-dark-80"
                  >
                    지난 S3 버킷 권한 오류 때 어떻게 해결했어?
                  </div>
                  <p class="self-start text-[10px] leading-relaxed text-overlay-dark-80">
                    S3 권한 오류는 IAM 정책과 버킷 정책을<br />함께 점검해 해결했습니다.
                  </p>
                </div>
              </div>
              <img
                :src="linaSearchImageUrl"
                alt=""
                aria-hidden="true"
                class="absolute bottom-1 right-2 w-16 object-contain drop-shadow-sm"
              />
            </div>

            <!-- Verify: 지식 연결 그래프 -->
            <div
              v-else
              class="relative mt-auto flex min-h-[150px] items-center rounded-xl bg-bg-100 p-5 pt-6"
            >
              <div
                class="w-[82%] max-w-[300px] rounded-xl border border-bg-200 bg-primary-white px-3 py-2.5"
              >
                <p class="mb-1.5 text-[10px] font-medium text-overlay-dark-80">지식 연결 그래프</p>
                <svg viewBox="0 0 360 88" class="w-full" aria-hidden="true">
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
              <img
                :src="linaVerifyImageUrl"
                alt=""
                aria-hidden="true"
                class="absolute bottom-1 right-2 w-16 object-contain mix-blend-darken"
              />
            </div>
          </article>
        </div>
      </section>
    </div>
  </Teleport>
</template>
