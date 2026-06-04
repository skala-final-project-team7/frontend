/**
 * --------------------------------------------------
 * 작성자 : 신유진
 * 작성목적 : LINA Chat route 동기화 composable.
 *           route watcher, 메시지 이력 로딩, active conversation clear 처리를 분리한다.
 * 작성일 : 2026-06-04
 * 변경사항 내역 (날짜, 변경목적, 변경내용 순)
 *   - 2026-06-04, feature10.5 구현, ChatPage route sync 책임 분리
 * --------------------------------------------------
 * [호환성]
 *   - Node.js 20.x LTS, TypeScript 5.7+
 *   - Vue 3.5.x, Pinia 2.3.x 기준
 * --------------------------------------------------
 */
import { watch, type Ref } from 'vue';

import type { useChatStore } from '@/stores';

type UseChatRouteSyncOptions = {
  chatStore: ReturnType<typeof useChatStore>;
  closeConversationMenu: () => void;
  closeReferencePanel: () => void;
  resetMessageDraftState: () => void;
  routeConversationId: Ref<string>;
};

/**
 * 현재 route conversationId와 chat store의 active conversation을 동기화한다.
 *
 * @param options route/store 및 page-level cleanup handler
 */
export function useChatRouteSync(options: UseChatRouteSyncOptions) {
  const {
    chatStore,
    closeConversationMenu,
    closeReferencePanel,
    resetMessageDraftState,
    routeConversationId,
  } = options;

  async function loadRouteConversationMessages(conversationId: string) {
    resetMessageDraftState();

    try {
      await chatStore.loadConversationMessages(conversationId);
    } catch {
      // 지연된 조회 실패가 현재 화면에 이미 추가된 로컬/SSE 메시지를 제거하지 않도록 보존한다.
    }
  }

  watch(
    routeConversationId,
    async (conversationId) => {
      if (!conversationId) {
        chatStore.clearActiveConversation();
        closeReferencePanel();
        closeConversationMenu();
        resetMessageDraftState();
        return;
      }

      await loadRouteConversationMessages(conversationId);
      closeConversationMenu();
    },
    {
      immediate: true,
    },
  );
}
