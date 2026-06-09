<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : feature12 Auth mock 흐름에서 관리자 역할 선택 후 이동할 임시 Admin 진입점.
          실제 관리자 화면 구현은 feature15 범위에서 대체한다.
작성일 : 2026-06-05
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-05, feature12 구현, /admin placeholder route 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vue Router 4.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<template>
  <main
    data-testid="admin-entry-page"
    class="flex min-h-screen items-center justify-center bg-bg-100 px-6 text-center text-overlay-dark-80"
  >
    <section class="max-w-sm">
      <p class="text-heading font-bold">Admin</p>
      <p class="mt-4 text-body text-overlay-dark-40">
        관리자 화면은 데이터 수집 보드 구현 단계에서 연결됩니다.
      </p>
    </section>
  </main>
</template>
