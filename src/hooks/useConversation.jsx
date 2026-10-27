import { useEffect, useMemo, useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import {
    clearConversationUnreadInCache,
    sameId,
} from "@/lib/messageCacheHelpers";
import { queryKeys } from "@/lib/queryKeys";
import { getConversation, markConversationRead } from "@/services/messageApi";
import { decryptMessageContent, peekDecrypted } from "@/services/messageCrypto";

export const CONVERSATION_PAGE_SIZE = 25;
export const CONVERSATION_STALE_TIME_MS = 60_000;

function mergePages(pages) {
    const seen = new Set();
    const merged = [];

    for (let index = pages.length - 1; index >= 0; index -= 1) {
        for (const message of pages[index].messages) {
            const key = String(message.id).toLowerCase();
            if (seen.has(key)) continue;

            seen.add(key);
            merged.push(message);
        }
    }

    return merged;
}

export async function fetchConversationThread(
    id,
    { page = 1, pageSize = CONVERSATION_PAGE_SIZE, markRead = true } = {}
) {
    const { data } = await getConversation(id, { page, pageSize, markRead });

    const messages = await Promise.all(
        (data.messages ?? []).map(async (message) => {
            if (!message?.content) return message;
            const settled = peekDecrypted(message.content);
            if (settled !== null) {
                return { ...message, plaintext: settled };
            }
            const plaintext = await decryptMessageContent(message.content);
            return { ...message, plaintext };
        })
    );

    const newestId =
        markRead && page === 1 && messages.length > 0
            ? messages[messages.length - 1].id
            : null;

    return {
        ...data,
        messages,
        _markedReadNewestId: newestId,
    };
}

export function conversationQueryOptions(id, { markRead = false } = {}) {
    return {
        queryKey: queryKeys.conversation(id),
        queryFn: ({ pageParam }) =>
            fetchConversationThread(id, {
                page: pageParam,
                pageSize: CONVERSATION_PAGE_SIZE,
                markRead: pageParam === 1 ? markRead : false,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, pages) =>
            lastPage.hasMore ? pages.length + 1 : undefined,
        staleTime: CONVERSATION_STALE_TIME_MS,
    };
}

export function useConversation(id) {
    const queryClient = useQueryClient();
    const lastMarkedServerReadRef = useRef({ conversationId: null, messageId: null });

    const query = useInfiniteQuery({
        ...conversationQueryOptions(id, { markRead: true }),
        enabled: Boolean(id),
    });

    const pages = query.data?.pages;

    const messages = useMemo(() => (pages ? mergePages(pages) : []), [pages]);

    const newestMessage = messages.length ? messages[messages.length - 1] : null;
    const newestMessageId = newestMessage?.id ?? null;
    const newestIsMine = Boolean(newestMessage?.isMine);
    const markedReadOnFetch = pages?.[0]?._markedReadNewestId ?? null;

    useEffect(() => {
        if (!id || !newestMessageId) return;

        const { found } = clearConversationUnreadInCache(queryClient, id);
        if (!found) {
            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations(),
                exact: true,
            });
        }

        // If the thread opened from a `markRead: false` prefetch, hydrated from IndexedDB, or received
        // a live SignalR message via setQueryData while mounted, persist LastReadAt on the server once.
        const alreadyMarkedOnFetch = sameId(markedReadOnFetch, newestMessageId);
        const alreadySentReadReceipt =
            sameId(lastMarkedServerReadRef.current.conversationId, id) &&
            sameId(lastMarkedServerReadRef.current.messageId, newestMessageId);

        if (!newestIsMine && !alreadyMarkedOnFetch && !alreadySentReadReceipt) {
            lastMarkedServerReadRef.current = {
                conversationId: id,
                messageId: newestMessageId,
            };
            markConversationRead(id).catch(() => undefined);
        }
    }, [id, messages.length, newestMessageId, newestIsMine, markedReadOnFetch, queryClient]);

    function loadOlder() {
        if (!query.hasNextPage || query.isFetchingNextPage) return;

        void query.fetchNextPage();
    }

    return {
        conversation: pages?.[0],
        messages,
        otherUser: pages?.[0]?.otherUser,
        hasMore: Boolean(query.hasNextPage),
        isLoadingOlder: query.isFetchingNextPage,
        loadOlder,
        isLoading: query.isPending,
        isError: query.isError,
    };
}
