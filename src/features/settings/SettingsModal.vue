<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Settings 중앙 모달과 계정 관리 탭 UI 구현.
작성일 : 2026-06-12
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-12, feature18 구현, Settings 모달 shell과 계정 탭 추가
  - 2026-06-12, feature18 구현, 도움말 nav 항목 추가
  - 2026-06-12, feature18 구현, 도움말 클릭 시 SettingsHelpModal 오버레이 모달 표시로 변경
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { ChevronRight, CircleHelp, Info, UserRound, X } from '@lucide/vue';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';

import SettingsHelpModal from '@/features/settings/SettingsHelpModal.vue';
import { confluenceIconImageUrl } from '@/shared/assets';

const props = defineProps<{
  currentUserLastLoginAt: string;
  currentUserName: string;
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

let previousBodyOverflow = '';
let hasLockedBodyScroll = false;

const isHelpOpen = ref(false);

async function closeHelpModal() {
  isHelpOpen.value = false;
  await nextTick();
  document.querySelector<HTMLElement>('[data-testid="settings-help-nav-item"]')?.focus();
}

const renewalDateLabel = computed(() => {
  const lastLoginDate = new Date(props.currentUserLastLoginAt);

  if (Number.isNaN(lastLoginDate.getTime())) {
    return '-';
  }

  const renewalDate = new Date(lastLoginDate);

  renewalDate.setDate(renewalDate.getDate() + 90);

  return new Intl.DateTimeFormat('ko-KR', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Seoul',
    year: 'numeric',
  })
    .format(renewalDate)
    .replace(/\. /g, '.')
    .replace(/\.$/, '');
});

function closeModal() {
  emit('close');
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && !element.getAttribute('aria-hidden'));
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault();
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

  const focusableElements = getFocusableElements(dialog);
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

function lockBodyScroll() {
  if (hasLockedBodyScroll) {
    return;
  }

  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  hasLockedBodyScroll = true;
}

function unlockBodyScroll() {
  if (!hasLockedBodyScroll) {
    return;
  }

  document.body.style.overflow = previousBodyOverflow;
  hasLockedBodyScroll = false;
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      unlockBodyScroll();
      return;
    }

    isHelpOpen.value = false;
    lockBodyScroll();
    await nextTick();
    document.querySelector<HTMLElement>('[data-testid="settings-close-button"]')?.focus();
  },
  {
    immediate: true,
  },
);

onBeforeUnmount(() => {
  if (props.isOpen) {
    unlockBodyScroll();
  }
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      data-testid="settings-modal-backdrop"
      class="fixed inset-0 z-50 flex items-center justify-center bg-overlay-dark-20 px-4"
      @click.self="closeModal"
    >
      <section
        data-testid="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        class="flex h-[min(80vh,796px)] w-full max-w-[870px] flex-col rounded-[28px] bg-white px-11 py-10 shadow-[0_8px_44px_rgba(0,0,0,0.14)] outline-none"
        tabindex="-1"
        @keydown="handleKeydown"
      >
        <header
          class="flex shrink-0 items-center justify-between border-b border-overlay-dark-10 pb-9"
        >
          <h2
            id="settings-title"
            data-testid="settings-title"
            class="font-lina text-[22px] font-bold text-black"
          >
            Settings
          </h2>
          <button
            data-testid="settings-close-button"
            type="button"
            class="inline-flex size-9 items-center justify-center rounded-full text-black transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="설정 닫기"
            @click="closeModal"
          >
            <X aria-hidden="true" class="size-5" />
          </button>
        </header>

        <div
          class="grid min-h-0 flex-1 grid-cols-[196px_minmax(0,1fr)] gap-9 overflow-hidden pt-10"
        >
          <nav aria-label="Settings section" class="flex flex-col gap-2">
            <div
              data-testid="settings-account-nav-item"
              aria-current="true"
              class="inline-flex h-10 items-center gap-3 rounded-xl bg-overlay-dark-4 px-5 text-left font-lina text-[16px] text-black"
            >
              <UserRound aria-hidden="true" class="size-5" />
              계정 관리
            </div>
            <button
              data-testid="settings-help-nav-item"
              type="button"
              class="inline-flex h-10 items-center gap-3 rounded-xl px-5 text-left font-lina text-[16px] text-black transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
              @click="isHelpOpen = true"
            >
              <CircleHelp aria-hidden="true" class="size-5" />
              도움말
            </button>
          </nav>

          <section
            data-testid="settings-account-panel"
            role="tabpanel"
            aria-label="계정 관리"
            class="min-h-0 overflow-y-auto pr-1"
          >
            <h3 class="mb-6 font-lina text-[16px] font-normal text-black">연결된 계정</h3>

            <div
              data-testid="settings-account-card"
              class="flex min-h-[74px] items-center justify-between rounded-xl border border-overlay-dark-10 px-5 py-4"
            >
              <div class="flex min-w-0 items-center gap-5">
                <img
                  data-testid="settings-confluence-icon"
                  :src="confluenceIconImageUrl"
                  alt=""
                  class="size-8 shrink-0 object-contain"
                />
                <div class="min-w-0">
                  <p class="truncate font-lina text-[16px] text-black">Client_id</p>
                  <p class="mt-1 font-lina text-[13px] text-overlay-dark-40">
                    {{ currentUserName }} · 인증 갱신 날짜 : {{ renewalDateLabel }}
                  </p>
                </div>
              </div>
              <a
                data-testid="settings-confluence-link"
                class="inline-flex shrink-0 items-center gap-3 rounded-button px-2 py-1 font-lina text-[13px] text-overlay-dark-40 transition hover:text-overlay-dark-80 focus-visible:outline-none focus-visible:shadow-focus"
                href="https://www.atlassian.com/software/confluence"
                target="_blank"
                rel="noreferrer"
              >
                Confluence로 이동하기
                <ChevronRight aria-hidden="true" class="size-4" />
              </a>
            </div>

            <p
              data-testid="settings-account-renewal-note"
              class="mt-5 inline-flex items-center gap-2 font-lina text-[13px] text-overlay-dark-40"
            >
              <Info aria-hidden="true" class="size-4" />
              90일마다 인증 갱신되어야 합니다.
            </p>

            <div
              data-testid="settings-logout-row"
              class="mt-10 flex items-center justify-between border-t border-overlay-dark-10 pt-7"
            >
              <p class="font-lina text-[16px] text-black">이 기기에서 로그아웃 하기</p>
              <button
                data-testid="settings-logout-button"
                type="button"
                class="rounded-full border border-overlay-dark-10 px-7 py-3 font-lina text-[16px] text-black transition hover:bg-bg-200 focus-visible:outline-none focus-visible:shadow-focus"
              >
                로그아웃
              </button>
            </div>
          </section>
        </div>
      </section>

      <SettingsHelpModal :is-open="isHelpOpen" @close="closeHelpModal" />
    </div>
  </Teleport>
</template>
