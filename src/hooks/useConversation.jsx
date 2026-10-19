import { useEffect, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { getConversation } from "@/services/messageApi";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 50;

function mergePages(pages) {
    const seen = new Set();
    const merged = [];

    for (let index = pages.length - 1; index >= 0; index -= 1) {
        for (const message of pages[index].messages) {
            if (seen.has(message.id)) continue;

            seen.add(message.id);
            merged.push(message);
        }
    }

    return merged;
}

export function useConversation(id) {
    const queryClient = useQueryClient();

    const query = useInfiniteQuery({
        queryKey: queryKeys.conversation(id),
        queryFn: async ({ pageParam }) => {
            const { data } = await getConversation(id, {
                page: pageParam,
                pageSize: PAGE_SIZE,
            });
            return data;
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, pages) =>
            lastPage.hasMore ? pages.length + 1 : undefined,
        enabled: Boolean(id),
    });

    const pages = query.data?.pages;

    const messages = useMemo(() => (pages ? mergePages(pages) : []), [pages]);

    // The list carries the preview and the unread badge, so it has to follow the thread's messages — and
    // nothing else. Depending on `query.data` was too broad: a presence event patches the thread's object
    // identity without touching a single message, so this effect re-ran and paid for a full list refetch to
    // learn nothing. The newest id plus the count is the whole signal.
    const newestMessageId = messages.length ? messages[messages.length - 1].id : null;

    useEffect(() => {
        if (!newestMessageId) return;

        queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    }, [messages.length, newestMessageId, queryClient]);

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
