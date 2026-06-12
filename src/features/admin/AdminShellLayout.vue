<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Admin 공통 shell 레이아웃.
          사이드바(로고·탭 내비게이션·관리자 프로필)를 렌더링하고
          메인 컨텐츠 영역을 default slot으로 제공한다.
작성일 : 2026-06-10
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-10, feature14-refactor.2, AdminEntryPage에서 shell UI 분리
  - 2026-06-10, feature15 보강, 대시보드 nav 라벨을 사용자 현황으로 변경
  - 2026-06-12, feature17 구현, 동기화 이력을 문서 데이터 관리 하위 탭으로 이동
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { Database, LayoutDashboard, MessageSquareQuote } from '@lucide/vue';
import { linaAdminImageUrl } from '@/shared';
import type { CurrentUser } from '@/types/api';

type SectionKey = 'operations' | 'dashboard' | 'feedback' | 'sync';

interface NavigationItem {
  key: SectionKey;
  label: string;
  icon: unknown;
}

defineProps<{
  activeSection: SectionKey;
  currentUser: CurrentUser | null;
}>();

const emit = defineEmits<{
  'section-change': [key: SectionKey];
}>();

const navigationItems: NavigationItem[] = [
  { key: 'operations', label: '문서 데이터 관리', icon: Database },
  { key: 'dashboard', label: '사용자 현황', icon: LayoutDashboard },
  { key: 'feedback', label: '피드백', icon: MessageSquareQuote },
];

const documentSubNavigationItems: {
  key: Extract<SectionKey, 'operations' | 'sync'>;
  label: string;
}[] = [
  { key: 'operations', label: '운영 대시보드' },
  { key: 'sync', label: '동기화 이력' },
];
</script>

<template>
  <div data-testid="admin-page" class="flex h-screen overflow-hidden">
    <!-- ── 사이드바 ── -->
    <aside
      class="flex h-screen w-[220px] shrink-0 flex-col border-r border-bg-300/60 bg-primary-white"
    >
      <!-- 로고 -->
      <div class="border-b border-bg-300/60 px-7 py-6">
        <h1 class="text-[1.35rem] font-bold tracking-[-0.06em] text-overlay-dark-80">LINA</h1>
        <p class="mt-0.5 text-[0.74rem] text-overlay-dark-40">Admin Dashboard</p>
      </div>

      <!-- 내비게이션 -->
      <nav data-testid="admin-nav" class="flex-1 space-y-0.5 px-3 py-5">
        <template v-for="item in navigationItems" :key="item.key">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-[0.875rem] transition-colors"
            :class="
              activeSection === item.key || (item.key === 'operations' && activeSection === 'sync')
                ? 'bg-primary/8 font-semibold text-primary'
                : 'font-normal text-overlay-dark-40 hover:bg-bg-200 hover:text-overlay-dark-80'
            "
            :aria-current="
              activeSection === item.key || (item.key === 'operations' && activeSection === 'sync')
                ? 'page'
                : undefined
            "
            @click="emit('section-change', item.key)"
          >
            <component
              :is="item.icon"
              class="size-4 shrink-0"
              :class="
                activeSection === item.key ||
                (item.key === 'operations' && activeSection === 'sync')
                  ? 'text-primary'
                  : 'text-overlay-dark-40'
              "
              aria-hidden="true"
            />
            {{ item.label }}
          </button>

          <div
            v-if="item.key === 'operations'"
            class="ml-7 mt-1 space-y-1 border-l border-bg-300/70 pl-3"
          >
            <button
              v-for="subItem in documentSubNavigationItems"
              :key="subItem.key"
              :data-testid="`admin-document-subtab-${subItem.key}`"
              type="button"
              class="block w-full rounded-lg px-3 py-2 text-left text-[0.78rem] transition-colors"
              :class="
                activeSection === subItem.key
                  ? 'bg-bg-200 font-semibold text-overlay-dark-80'
                  : 'text-overlay-dark-40 hover:bg-bg-200/70 hover:text-overlay-dark-80'
              "
              :aria-current="activeSection === subItem.key ? 'page' : undefined"
              @click="emit('section-change', subItem.key)"
            >
              {{ subItem.label }}
            </button>
          </div>
        </template>
      </nav>

      <!-- 프로필 -->
      <div class="border-t border-bg-300/60 px-4 py-4">
        <div class="flex items-center gap-3 rounded-xl bg-bg-100 px-3 py-2.5">
          <img
            :src="currentUser?.profileImageUrl || linaAdminImageUrl"
            alt=""
            class="size-8 rounded-lg border border-bg-300/60 object-cover"
          />
          <div class="min-w-0">
            <p
              data-testid="admin-profile-name"
              class="truncate text-[0.82rem] font-semibold text-overlay-dark-80"
            >
              {{ currentUser?.name }}
            </p>
            <p class="truncate text-[0.7rem] text-overlay-dark-40">Admin Mode</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- ── 메인 컨텐츠 ── -->
    <div class="h-screen flex-1 overflow-y-auto bg-bg-100">
      <slot />
    </div>
  </div>
</template>
