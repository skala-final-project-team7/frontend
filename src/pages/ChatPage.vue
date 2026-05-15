<script setup lang="ts">
import { onMounted } from 'vue';

import ChatMain from '@/features/chat/ChatMain.vue';
import ChatSidebar from '@/features/chat/ChatSidebar.vue';
import MessageInput from '@/features/chat/MessageInput.vue';
import ReferencePanel from '@/features/chat/ReferencePanel.vue';
import BaseSpinner from '@/shared/BaseSpinner.vue';
import ErrorState from '@/shared/ErrorState.vue';
import { useConversationsStore } from '@/stores/conversations';

const conversationsStore = useConversationsStore();

onMounted(() => {
  void conversationsStore.loadConversations();
});

function selectConversation(conversationId: string) {
  void conversationsStore.loadMessages(conversationId);
}
</script>

<template>
  <div class="flex h-screen min-h-[640px] bg-bg-100">
    <ChatSidebar
      :conversations="conversationsStore.conversations"
      :active-conversation-id="conversationsStore.activeConversationId"
      @select="selectConversation"
    />

    <section class="flex min-w-0 flex-1 flex-col">
      <div
        v-if="conversationsStore.status === 'loading'"
        class="flex flex-1 items-center justify-center"
      >
        <BaseSpinner />
      </div>

      <ErrorState
        v-else-if="conversationsStore.status === 'error'"
        class="flex-1"
        :message="conversationsStore.errorMessage"
        @retry="conversationsStore.loadConversations"
      />

      <ChatMain v-else :messages="conversationsStore.messages" />

      <MessageInput
        :disabled="!conversationsStore.activeConversationId"
        @submit="
          conversationsStore.activeConversationId &&
          conversationsStore.loadMessages(conversationsStore.activeConversationId)
        "
      />
    </section>

    <ReferencePanel :sources="conversationsStore.messages.at(-1)?.sources ?? []" />
  </div>
</template>
