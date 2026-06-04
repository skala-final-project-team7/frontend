<!--
--------------------------------------------------
작성자 : 신유진
작성목적 : LINA Chat 대화 본문 검색 모달.
          GET /api/conversations/search 결과를 대화 단위로 표시하고 matchPositions로 하이라이트한다.
작성일 : 2026-06-02
변경사항 내역 (날짜, 변경목적, 변경내용 순)
  - 2026-06-02, feature10.4 검색 모달 구현, 대화 검색 API 연결 UI 추가
  - 2026-06-04, 검색 결과 메타 정보 개선, 마지막 메시지 시각을 날짜만 표시하도록 변경
  - 2026-06-04, 검색 결과 가독성 개선, 제목 클라이언트 하이라이트와 메타 색상 조정
--------------------------------------------------
[호환성]
  - Node.js 20.x LTS, TypeScript 5.7+
  - Vue 3.5.x, Tailwind CSS 3.4.x 기준
--------------------------------------------------
-->
<script setup lang="ts">
import { Search, X } from '@lucide/vue';
import { nextTick, onMounted, ref } from 'vue';

import { searchConversations } from '@/api';
import { useToast } from '@/composables/useToast';
import { mascotWrongImageUrl } from '@/shared/assets';
import type {
  ConversationSearchMatchedMessage,
  ConversationSearchMatchPosition,
  ConversationSearchResponse,
} from '@/types/api';

type HighlightSegment = {
  id: string;
  text: string;
  isMatch: boolean;
};

const emit = defineEmits<{
  close: [];
  select: [conversationId: string];
}>();

const { showToast } = useToast();
const query = ref('');
const submittedQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const errorMessage = ref('');
const isLoading = ref(false);
const hasSearched = ref(false);
const searchResponse = ref<ConversationSearchResponse>({
  results: [],
  totalCount: 0,
  page: 0,
  size: 20,
});

function normalizeQuery() {
  return query.value.trim();
}

function validateQuery(trimmedQuery: string) {
  if (trimmedQuery.length < 2 || trimmedQuery.length > 50) {
    showToast('검색어는 2자 이상 50자 이하로 입력해주세요.', {
      variant: 'info',
    });
    return false;
  }

  return true;
}

async function submitSearch() {
  const trimmedQuery = normalizeQuery();
  errorMessage.value = '';

  if (!validateQuery(trimmedQuery)) {
    return;
  }

  isLoading.value = true;
  hasSearched.value = true;
  submittedQuery.value = trimmedQuery;

  try {
    searchResponse.value = await searchConversations({
      q: trimmedQuery,
      page: 0,
      size: 20,
    });
  } catch {
    searchResponse.value = {
      results: [],
      totalCount: 0,
      page: 0,
      size: 20,
    };
    errorMessage.value = '대화 검색에 실패했습니다.';
  } finally {
    isLoading.value = false;
  }
}

function createHighlightedSegments(
  snippet: string,
  matchPositions: ConversationSearchMatchPosition[],
): HighlightSegment[] {
  const sortedPositions = [...matchPositions]
    .map(([start, end]) => [
      Math.max(0, Math.min(start, snippet.length)),
      Math.max(0, Math.min(end, snippet.length)),
    ])
    .filter(([start, end]) => end > start)
    .sort(([startA], [startB]) => startA - startB);
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  sortedPositions.forEach(([start, end], index) => {
    if (start > cursor) {
      segments.push({
        id: `text-${index}-${cursor}`,
        text: snippet.slice(cursor, start),
        isMatch: false,
      });
    }

    segments.push({
      id: `match-${index}-${start}`,
      text: snippet.slice(start, end),
      isMatch: true,
    });
    cursor = end;
  });

  if (cursor < snippet.length) {
    segments.push({
      id: `text-tail-${cursor}`,
      text: snippet.slice(cursor),
      isMatch: false,
    });
  }

  return segments.length > 0
    ? segments
    : [
        {
          id: 'text-full',
          text: snippet,
          isMatch: false,
        },
      ];
}

function createTitleHighlightedSegments(title: string): HighlightSegment[] {
  const searchKeyword = submittedQuery.value;

  if (!searchKeyword) {
    return [
      {
        id: 'title-full',
        text: title,
        isMatch: false,
      },
    ];
  }

  const normalizedTitle = title.normalize('NFC').toLocaleLowerCase();
  const normalizedKeyword = searchKeyword.normalize('NFC').toLocaleLowerCase();
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  let matchIndex = normalizedTitle.indexOf(normalizedKeyword);

  while (matchIndex >= 0) {
    if (matchIndex > cursor) {
      segments.push({
        id: `title-text-${cursor}`,
        text: title.slice(cursor, matchIndex),
        isMatch: false,
      });
    }

    const matchEnd = matchIndex + searchKeyword.length;
    segments.push({
      id: `title-match-${matchIndex}`,
      text: title.slice(matchIndex, matchEnd),
      isMatch: true,
    });
    cursor = matchEnd;
    matchIndex = normalizedTitle.indexOf(normalizedKeyword, cursor);
  }

  if (cursor < title.length) {
    segments.push({
      id: `title-text-tail-${cursor}`,
      text: title.slice(cursor),
      isMatch: false,
    });
  }

  return segments.length > 0
    ? segments
    : [
        {
          id: 'title-full',
          text: title,
          isMatch: false,
        },
      ];
}

function selectConversation(conversationId: string) {
  emit('select', conversationId);
}

function clearQuery() {
  query.value = '';
  searchInput.value?.focus();
}

function getMessageLabel(message: ConversationSearchMatchedMessage) {
  return message.role === 'assistant' ? 'LINA' : '나';
}

function formatDate(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, '0');
  const day = `${parsedDate.getDate()}`.padStart(2, '0');

  return `${year}.${month}.${day}`;
}

onMounted(async () => {
  await nextTick();
  searchInput.value?.focus();
});
</script>

<template>
  <div
    data-testid="conversation-search-modal"
    class="fixed inset-0 z-50 flex items-start justify-center bg-overlay-dark-80/30 px-6 pt-[8vh]"
    role="presentation"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="conversation-search-title"
      class="flex max-h-[82vh] w-full max-w-[760px] flex-col overflow-hidden rounded-card border border-bg-300 bg-primary-white shadow-floating"
    >
      <div class="flex items-start justify-between gap-4 border-b border-bg-300 px-6 py-5">
        <div class="min-w-0">
          <h2
            id="conversation-search-title"
            class="font-lina text-[22px] font-bold leading-7 text-overlay-dark-80"
          >
            채팅 검색
          </h2>
          <p class="mt-1 font-lina text-small text-overlay-dark-60">
            이전 대화의 질문과 답변 본문을 검색합니다.
          </p>
        </div>
        <button
          data-testid="conversation-search-close"
          type="button"
          aria-label="검색 닫기"
          class="inline-flex size-10 shrink-0 items-center justify-center rounded-button border border-transparent text-overlay-dark-80 transition hover:bg-bg-100 focus-visible:outline-none focus-visible:shadow-focus"
          @click="emit('close')"
        >
          <X aria-hidden="true" class="size-5" />
        </button>
      </div>

      <form
        data-testid="conversation-search-submit"
        class="px-6 pt-5"
        @submit.prevent="submitSearch"
      >
        <div
          class="flex min-h-[56px] items-center gap-3 rounded-card border border-bg-300 bg-primary-white px-4 focus-within:shadow-focus"
        >
          <Search aria-hidden="true" class="size-5 shrink-0 text-overlay-dark-60" />
          <label class="sr-only" for="conversation-search-input">대화 검색어</label>
          <input
            id="conversation-search-input"
            ref="searchInput"
            v-model="query"
            data-testid="conversation-search-input"
            type="text"
            placeholder="검색어를 입력하세요"
            class="min-w-0 flex-1 bg-transparent font-lina text-body text-overlay-dark-80 outline-none placeholder:text-overlay-dark-40"
          />
          <button
            v-if="query"
            data-testid="conversation-search-clear"
            type="button"
            aria-label="검색어 지우기"
            class="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-bg-300 text-overlay-dark-60 transition hover:bg-bg-400 focus-visible:outline-none focus-visible:shadow-focus"
            @click="clearQuery"
          >
            <X aria-hidden="true" class="size-4" />
          </button>
          <button
            type="submit"
            class="rounded-full bg-overlay-dark-80 px-5 py-2.5 font-lina text-small font-bold text-primary-white transition hover:brightness-110 focus-visible:outline-none focus-visible:shadow-focus"
          >
            검색
          </button>
        </div>
      </form>

      <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div
          v-if="isLoading"
          data-testid="conversation-search-loading"
          role="status"
          aria-live="polite"
          class="py-10 text-center font-lina text-body text-overlay-dark-60"
        >
          검색 중입니다.
        </div>

        <div
          v-else-if="errorMessage"
          data-testid="conversation-search-error"
          role="alert"
          class="flex flex-col items-center justify-center py-12 text-center font-lina text-overlay-dark-80"
        >
          <img
            data-testid="conversation-search-error-image"
            :src="mascotWrongImageUrl"
            alt=""
            class="mb-4 size-20 object-contain opacity-90"
          />
          <p class="text-body font-bold">{{ errorMessage }}</p>
          <p class="mt-1 text-small text-overlay-dark-60">잠시 후 다시 한번 시도하세요.</p>
        </div>

        <div
          v-else-if="hasSearched && searchResponse.results.length === 0"
          data-testid="conversation-search-empty"
          class="flex flex-col items-center justify-center py-12 text-center font-lina text-overlay-dark-80"
        >
          <img
            data-testid="conversation-search-empty-image"
            :src="mascotWrongImageUrl"
            alt=""
            class="mb-4 size-20 object-contain opacity-90"
          />
          <p class="text-body font-bold">대화 결과가 없습니다.</p>
          <p class="mt-1 text-small text-overlay-dark-60">다른 검색어로 다시 찾아보세요.</p>
        </div>

        <div v-else>
          <button
            v-for="result in searchResponse.results"
            :key="result.conversationId"
            data-testid="conversation-search-result"
            type="button"
            class="w-full border-b border-bg-300 bg-primary-white px-1 py-4 text-left transition hover:bg-bg-100 focus-visible:outline-none focus-visible:shadow-focus"
            @click="selectConversation(result.conversationId)"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="truncate font-lina text-body font-bold text-overlay-dark-80">
                  <template
                    v-for="segment in createTitleHighlightedSegments(result.title)"
                    :key="segment.id"
                  >
                    <mark
                      v-if="segment.isMatch"
                      data-testid="conversation-search-title-highlight"
                      class="bg-transparent p-0 text-[#f6a04d]"
                    >
                      {{ segment.text }}
                    </mark>
                    <span v-else>{{ segment.text }}</span>
                  </template>
                </p>
                <p class="mt-1 font-lina text-small text-overlay-dark-40">
                  매칭 메시지 {{ result.matchCount }}개 · {{ formatDate(result.lastMessageAt) }}
                </p>
              </div>
            </div>

            <div class="mt-3 space-y-2">
              <p
                v-for="message in result.matchedMessages"
                :key="message.messageId"
                class="font-lina text-small leading-6 text-overlay-dark-80"
              >
                <span class="mr-2 font-bold text-overlay-dark-60">
                  {{ getMessageLabel(message) }}
                </span>
                <template
                  v-for="segment in createHighlightedSegments(
                    message.snippet,
                    message.matchPositions,
                  )"
                  :key="segment.id"
                >
                  <mark
                    v-if="segment.isMatch"
                    data-testid="conversation-search-highlight"
                    class="bg-transparent p-0 text-[#f6a04d]"
                  >
                    {{ segment.text }}
                  </mark>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
