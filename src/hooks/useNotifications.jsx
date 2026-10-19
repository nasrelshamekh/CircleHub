import { useInfiniteQuery } from "@tanstack/react-query";

import { getNotifications } from "@/services/notificationApi";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 20;

/**
 * The notification feed. Every page carries the same unread total, which is read from the *first* page so
 * loading more cannot change the badge.
 */
export function useNotifications() {
    const query = useInfiniteQuery({
        queryKey: queryKeys.notifications(),
        queryFn: ({ pageParam }) => getNotifications(pageParam, PAGE_SIZE),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.meta?.hasNext ? lastPage.meta.page + 1 : undefined,
    });

    const seen = new Set();
    const items = [];

    for (const page of query.data?.pages ?? []) {
        for (const item of page.data?.items ?? []) {
            if (seen.has(item.id)) continue;

            seen.add(item.id);
            items.push(item);
        }
    }

    return {
        items,
        unreadCount: query.data?.pages?.[0]?.data?.unreadCount ?? 0,
        isLoading: query.isPending,
        isLoadingMore: query.isFetchingNextPage,
        hasMore: Boolean(query.hasNextPage),
        loadMore: query.fetchNextPage,
    };
}
