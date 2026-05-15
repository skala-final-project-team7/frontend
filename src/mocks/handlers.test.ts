import { describe, expect, it } from 'vitest';

import { fetchConversations } from '@/api/conversations';

describe('mock conversation handlers', () => {
  it('returns the conversation list in the API wrapper shape', async () => {
    const data = await fetchConversations();

    expect(data.conversations).toHaveLength(1);
    expect(data.conversations[0].conversationId).toBe('conv-uuid-001');
  });
});
