<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Auth OAuth callback 처리 페이지.
          BFF가 /api/auth/callback 처리 후 이 FE 라우트로 리디렉션하면
          accessToken을 localStorage에 저장하고 /api/users/me로 role을 확인해 라우팅한다.
          (auth-session-storage-plan.md §로그인 흐름 요약 기준)
작성일 : 2026-06-15
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-15, feature13 구현, AuthCallbackPage 초기 작성
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useAuthStore } from '@/stores/auth';
import { BaseSpinner } from '@/shared';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const ACCESS_TOKEN_KEY = 'accessToken';

onMounted(async () => {
  const { accessToken, errorCode, error } = route.query;

  // BFF가 에러를 쿼리 파라미터로 전달한 경우 (e.g., 403 admin gate)
  if (error || errorCode) {
    const isForbidden =
      errorCode === 'FORBIDDEN' || error === 'FORBIDDEN';
    await router.replace({
      name: 'login',
      query: isForbidden ? { error: 'FORBIDDEN' } : { error: 'AUTH_FAILED' },
    });
    return;
  }

  if (!accessToken || typeof accessToken !== 'string') {
    await router.replace({ name: 'login' });
    return;
  }

  // accessToken을 localStorage에 저장 (단일 소스, Pinia에 미러링하지 않음)
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  try {
    await authStore.restoreSession();
  } catch {
    // restoreSession은 내부에서 오류를 처리하지만 예외 방어
  }

  if (!authStore.isAuthenticated) {
    // /api/users/me 실패 (토큰 만료/무효) — restoreSession이 이미 localStorage 토큰을 제거함
    await router.replace({ name: 'login', query: { error: 'AUTH_FAILED' } });
    return;
  }

  const role = authStore.currentUser?.role;
  if (role === 'ADMIN') {
    await router.replace({ name: 'admin-entry' });
  } else {
    await router.replace({ name: 'chat' });
  }
});
</script>

<template>
  <div
    data-testid="auth-callback-page"
    class="flex min-h-screen items-center justify-center bg-bg-100"
  >
    <BaseSpinner />
  </div>
</template>
