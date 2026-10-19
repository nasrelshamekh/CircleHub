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

    useEffect(() => {
        if (!query.data) return;

        queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    }, [query.data, queryClient]);

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
