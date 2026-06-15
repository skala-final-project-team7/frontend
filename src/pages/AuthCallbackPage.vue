<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Auth OAuth callback 처리 페이지.
          BFF가 /api/auth/callback 처리 후 이 FE 라우트로 리디렉션하면
          accessToken을 localStorage에 저장하고 /api/users/me로 세션을 복원한 뒤,
          사용자가 로그인 시 선택한 returnTo(의도)를 우선해 라우팅한다.
          (auth-session-storage-plan.md §로그인 흐름 요약 기준)
작성일 : 2026-06-15
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-15, feature13 구현, AuthCallbackPage 초기 작성
  - 2026-06-15, 라우팅 정책 변경, role 단독 분기 대신 returnTo(사용자 의도) 우선 라우팅으로 전환(/admin은 라우터 가드가 role 재검증)
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
// returnTo로 신뢰하는 내부 경로 화이트리스트 (open redirect 방지)
const ALLOWED_RETURN_TO = ['/chat', '/admin'];

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

  // 사용자가 로그인 시 선택한 returnTo(의도)대로 이동한다.
  // /admin 접근은 라우터 가드(requiresAdmin)가 role을 재검증하므로, 비관리자가 토큰만으로 진입할 수 없다.
  const returnTo = typeof route.query.returnTo === 'string' ? route.query.returnTo : '';
  if (ALLOWED_RETURN_TO.includes(returnTo)) {
    await router.replace(returnTo);
    return;
  }

  // 정상 로그인 흐름에서는 returnTo가 항상 존재한다(로그인 화면 카드가 자동으로 붙임).
  // returnTo가 없거나 허용 목록에 없으면 비정상 진입이므로 로그인 화면으로 돌려보내 재시도하게 한다.
  await router.replace({ name: 'login' });
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
