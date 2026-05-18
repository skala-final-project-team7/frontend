<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat 화면의 feature3 단계 shell 구성.
          SCR-400~600 상세 구현 전까지 주요 영역 placeholder만 제공한다.
작성일 : 2026-05-18
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-05-18, feature3 구현, Chat shell placeholder 영역 추가
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Vite 5.4.x 기준
--------------------------------------------------
-->
<template>
  <main data-testid="chat-page" class="min-h-screen bg-white text-neutral-950">
    <div class="grid min-h-screen grid-cols-[16rem_minmax(0,1fr)_20rem]">
      <aside
        data-testid="chat-sidebar"
        aria-label="Chat sidebar"
        class="border-r border-neutral-200 p-4"
      >
        <p class="text-sm font-medium text-neutral-700">Sidebar placeholder</p>
      </aside>

      <section data-testid="chat-main" aria-label="Chat main" class="flex min-w-0 flex-col">
        <div class="flex-1 p-6">
          <p class="text-sm font-medium text-neutral-700">ChatMain placeholder</p>
          <p class="mt-2 text-sm text-neutral-500">
            SCR-400 detailed design is reserved for feature8.
          </p>
        </div>

        <form data-testid="message-input" aria-label="Message input" class="border-t p-4">
          <label class="sr-only" for="feature3-message-placeholder">MessageInput placeholder</label>
          <input
            id="feature3-message-placeholder"
            disabled
            placeholder="MessageInput placeholder"
            class="w-full rounded border border-neutral-200 px-3 py-2 text-sm text-neutral-500"
          />
        </form>
      </section>

      <aside
        data-testid="reference-panel"
        aria-label="Reference panel"
        class="border-l border-neutral-200 p-4"
      >
        <p class="text-sm font-medium text-neutral-700">ReferencePanel placeholder</p>
      </aside>
    </div>
  </main>
</template>
