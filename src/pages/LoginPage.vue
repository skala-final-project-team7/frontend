<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Auth 흐름의 SCR-200 Login 화면.
          Confluence CTA 클릭 후 사용자/관리자 역할 선택 UI를 표시한다.
작성일 : 2026-06-05
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-05, feature12 구현, LoginPage와 역할 선택 mock 경계 작성
  - 2026-06-09, UX 개선, 카드 hover transform과 rise animation을 분리해 진입 직후 hover impact가 바로 보이도록 조정
  - 2026-06-15, feature13 구현, ?error=FORBIDDEN 쿼리 기반 권한 부족 에러 배너 추가
  - 2026-06-15, UX 개선, 에러 배너를 역할 카드 하단으로 이동하고 제목/설명 위계 분리·아이콘 배지로 가독성 향상
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { AlertCircle, ShieldCheck } from '@lucide/vue';

import { AUTH_INTENT_OPTIONS } from '@/features/auth';
import { linaAdminImageUrl, linaUserImageUrl, mascotImageUrl } from '@/shared';

const route = useRoute();
const authErrorCode = computed(() => route.query.error as string | undefined);

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

      <div
        v-if="authErrorCode"
        data-testid="auth-error-banner"
        class="mt-8 flex w-full max-w-[1120px] items-start gap-3.5 rounded-card border border-status-error/15 bg-primary-white px-6 py-4 text-left shadow-floating"
        role="alert"
      >
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-full bg-status-error/10 text-status-error"
        >
          <AlertCircle class="size-5" aria-hidden="true" />
        </span>
        <div class="flex flex-col gap-1">
          <span class="text-button font-semibold text-overlay-dark-80">
            {{
              authErrorCode === 'FORBIDDEN'
                ? '관리자 권한이 없는 계정입니다'
                : '로그인 중 오류가 발생했습니다'
            }}
          </span>
          <span class="text-small leading-relaxed text-overlay-dark-40">
            {{
              authErrorCode === 'FORBIDDEN'
                ? '일반 사용자로 로그인하거나 관리자에게 권한을 요청하세요.'
                : '잠시 후 다시 시도해주세요.'
            }}
          </span>
        </div>
      </div>
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
