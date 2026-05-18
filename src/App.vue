<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Frontend의 최상위 Vue App 컴포넌트.
          Vue Router outlet을 통해 feature별 페이지를 렌더링한다.
작성일 : 2026-05-18
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-18, 최초 작성, Vue 앱 기본 렌더링 화면 추가
  - 2026-05-18, feature3 구현, RouterView 기반 페이지 렌더링으로 변경
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <RouterView />
</template>
