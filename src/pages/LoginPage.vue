<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Auth 흐름의 SCR-200 Login 화면.
          Confluence CTA 클릭 후 사용자/관리자 역할 선택 UI를 표시한다.
작성일 : 2026-06-05
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-05, feature12 구현, LoginPage와 역할 선택 mock 경계 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { ShieldCheck, UserRound } from '@lucide/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { AUTH_INTENT_OPTIONS, type AuthIntentOption } from '@/features/auth';
import { confluenceIconImageUrl, mascotImageUrl } from '@/shared';

const router = useRouter();
const isRoleSelectionOpen = ref(false);

function openRoleSelection() {
  isRoleSelectionOpen.value = true;
}

function continueWithRole(option: AuthIntentOption) {
  // feature12에서는 실제 OAuth 호출이나 토큰 저장 없이 역할 선택 의도만 mock 라우팅한다.
  void router.push(option.returnTo);
}
</script>

<template>
  <main
    data-testid="login-page"
    class="relative flex min-h-screen flex-col overflow-hidden bg-bg-100 text-overlay-dark-80"
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
        data-testid="confluence-login-button"
        data-auth-url=""
        class="mt-8 inline-flex min-h-16 w-full max-w-[436px] items-center justify-center gap-8 rounded-card border border-bg-300 bg-primary-white px-8 text-xl text-overlay-dark-80 transition hover:brightness-105 focus-visible:outline-none focus-visible:shadow-focus"
        @click="openRoleSelection"
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

      <section
        v-if="isRoleSelectionOpen"
        data-testid="role-selection-panel"
        class="mt-8 grid w-full max-w-[560px] gap-3 sm:grid-cols-2"
        aria-label="로그인 역할 선택"
      >
        <button
          v-for="option in AUTH_INTENT_OPTIONS"
          :key="option.role"
          type="button"
          :data-testid="`${option.role}-role-button`"
          :data-auth-url="option.authUrl"
          :data-return-to="option.returnTo"
          class="flex min-h-[132px] flex-col items-start rounded-card border border-bg-300 bg-primary-white p-card text-left shadow-floating transition hover:brightness-105 focus-visible:outline-none focus-visible:shadow-focus"
          @click="continueWithRole(option)"
        >
          <component
            :is="option.role === 'admin' ? ShieldCheck : UserRound"
            class="mb-4 size-5 text-primary"
            aria-hidden="true"
          />
          <span class="text-body font-bold text-overlay-dark-80">{{ option.label }}</span>
          <span class="mt-2 text-small text-overlay-dark-40">{{ option.description }}</span>
        </button>
      </section>

      <p
        v-if="isRoleSelectionOpen"
        data-testid="auth-intent-note"
        class="mt-4 max-w-[560px] text-small text-overlay-dark-40"
      >
        선택한 역할은 로그인 의도이며 최종 권한은 인증 완료 후 서버에서 확인됩니다.
      </p>
    </section>

    <footer
      class="absolute inset-x-0 bottom-8 text-center text-button font-bold text-overlay-dark-40"
    >
      ©2026 LINA | SKALA
    </footer>
  </main>
</template>
