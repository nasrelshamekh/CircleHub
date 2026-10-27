import { queryKeys } from "@/lib/queryKeys";

export function sameId(a, b) {
    if (a == null || b == null) return false;
    return String(a).toLowerCase() === String(b).toLowerCase();
}

/**
 * Appends a single message to page 1 of a cached conversation thread (if loaded),
 * deduplicating case-insensitively by message id so SignalR own-echo and HTTP
 * mutation completion never produce duplicate bubbles.
 */
export function appendMessageToThreadCache(
    queryClient,
    conversationId,
    newMessage,
    { markReadUpTo = false } = {}
) {
    if (!conversationId || !newMessage?.id) return false;

    const matchingQueries = queryClient.getQueriesData({
        queryKey: queryKeys.conversations(),
    });

    let updatedAny = false;

    for (const [key] of matchingQueries) {
        if (!Array.isArray(key) || key.length !== 3 || !sameId(key[2], conversationId)) {
            continue;
        }

        queryClient.setQueryData(key, (current) => {
            if (!current || !Array.isArray(current.pages) || current.pages.length === 0) {
                return current;
            }

            updatedAny = true;
            const firstPage = current.pages[0];
            const existingMessages = Array.isArray(firstPage.messages)
                ? firstPage.messages
                : [];

            const existingIndex = existingMessages.findIndex((m) =>
                sameId(m.id, newMessage.id)
            );

            let nextMessages;
            if (existingIndex !== -1) {
                const existing = existingMessages[existingIndex];
                if (!existing.plaintext && newMessage.plaintext) {
                    nextMessages = [...existingMessages];
                    nextMessages[existingIndex] = {
                        ...existing,
                        plaintext: newMessage.plaintext,
                    };
                } else {
                    nextMessages = existingMessages;
                }
            } else {
                nextMessages = [...existingMessages, newMessage];
            }

            const nextFirstPage = {
                ...firstPage,
                messages: nextMessages,
                ...(markReadUpTo ? { _markedReadNewestId: newMessage.id } : {}),
            };

            if (
                nextMessages === existingMessages &&
                nextFirstPage._markedReadNewestId === firstPage._markedReadNewestId
            ) {
                return current;
            }

            return {
                ...current,
                pages: [nextFirstPage, ...current.pages.slice(1)],
            };
        });
    }

    return updatedAny;
}

/**
 * Updates a conversation's preview, timestamp,unread count and moves it to index 0
 * in the cached conversations list. Returns false when the list or conversation is
 * not cached yet so the caller can fall back to an exact list invalidation.
 */
export function patchConversationListOnMessage(
    queryClient,
    { conversationId, lastMessage, lastMessageAt, unreadDelta = 0, resetUnread = false }
) {
    if (!conversationId) return false;

    const list = queryClient.getQueryData(queryKeys.conversations());
    if (!Array.isArray(list)) return false;

    const index = list.findIndex((item) => sameId(item.id, conversationId));
    if (index === -1) return false;

    const target = list[index];
    if (resetUnread === false && unreadDelta > 0 && sameId(target.lastMessage?.id, lastMessage?.id)) {
        // Already processed this exact message in the list preview; avoid double-counting unread.
        return true;
    }

    const updated = {
        ...target,
        lastMessage: lastMessage ?? target.lastMessage,
        lastMessageAt: lastMessageAt ?? target.lastMessageAt,
        unreadCount: resetUnread
            ? 0
            : Math.max(0, (target.unreadCount || 0) + unreadDelta),
    };

    const nextList =
        index === 0
            ? [updated, ...list.slice(1)]
            : [updated, ...list.slice(0, index), ...list.slice(index + 1)];

    queryClient.setQueryData(queryKeys.conversations(), nextList);
    return true;
}

export function clearConversationUnreadInCache(queryClient, conversationId) {
    if (!conversationId) return { found: false, cleared: false };

    const list = queryClient.getQueryData(queryKeys.conversations());
    if (!Array.isArray(list)) return { found: false, cleared: false };

    const index = list.findIndex((item) => sameId(item.id, conversationId));
    if (index === -1) return { found: false, cleared: false };

    if (!list[index].unreadCount) {
        return { found: true, cleared: false };
    }

    const nextList = [...list];
    nextList[index] = { ...list[index], unreadCount: 0 };
    queryClient.setQueryData(queryKeys.conversations(), nextList);
    return { found: true, cleared: true };
}
