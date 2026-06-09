<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Auth 흐름의 SCR-200 Login 화면.
          Confluence CTA 클릭 후 사용자/관리자 역할 선택 UI를 표시한다.
작성일 : 2026-06-05
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-05, feature12 구현, LoginPage와 역할 선택 mock 경계 작성
  - 2026-06-09, UX 개선, 카드 hover transform과 rise animation을 분리해 진입 직후 hover impact가 바로 보이도록 조정
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { ShieldCheck } from '@lucide/vue';

import { AUTH_INTENT_OPTIONS } from '@/features/auth';
import { linaAdminImageUrl, linaUserImageUrl, mascotImageUrl } from '@/shared';

const roleImageUrlByRole = {
  user: linaUserImageUrl,
  admin: linaAdminImageUrl,
} as const;
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
      class="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 pb-20 text-center"
    >
      <section
        data-testid="role-selection-panel"
        class="grid w-full max-w-[1120px] gap-6 md:grid-cols-2"
        aria-label="로그인 역할 선택"
      >
        <a
          v-for="option in AUTH_INTENT_OPTIONS"
          :key="option.role"
          :href="option.authUrl"
          :data-testid="`${option.role}-role-button`"
          :data-auth-url="option.authUrl"
          :data-return-to="option.returnTo"
          class="login-role-card flex min-h-[260px] flex-col items-center rounded-card border border-bg-300 bg-primary-white p-8 text-center shadow-floating transition duration-200 ease-out hover:-translate-y-2 hover:border-primary hover:brightness-105 hover:shadow-primary focus-visible:outline-none focus-visible:shadow-focus"
        >
          <div
            :data-testid="`${option.role}-role-motion`"
            class="login-role-card-motion flex min-h-[260px] w-full flex-col items-center"
          >
            <img
              class="mb-6 h-28 w-auto object-contain"
              :src="roleImageUrlByRole[option.role]"
              :alt="`${option.label} 로그인`"
              :data-testid="`${option.role}-role-image`"
            />
            <span class="text-heading font-bold text-overlay-dark-80">{{ option.label }}</span>
            <span
              class="mt-6 max-w-md whitespace-pre-line text-xl leading-relaxed text-overlay-dark-40"
            >
              {{ option.description }}
            </span>
            <span
              v-if="option.note"
              data-testid="admin-role-note"
              class="mt-5 inline-flex items-center gap-1.5 text-small text-overlay-dark-40"
            >
              <ShieldCheck
                data-testid="admin-role-note-icon"
                class="size-3.5 text-primary"
                aria-hidden="true"
              />
              {{ option.note }}
            </span>
          </div>
        </a>
      </section>
    </section>

    <footer class="absolute inset-x-0 bottom-8 text-center text-button text-overlay-dark-40">
      ©2026 LINA | SKALA
    </footer>
  </main>
</template>

<style scoped>
.login-role-card-motion {
  opacity: 0;
  animation: login-role-card-rise 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.login-role-card:nth-child(2) .login-role-card-motion {
  animation-delay: 160ms;
}

@keyframes login-role-card-rise {
  from {
    opacity: 0;
    transform: translateY(24px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
