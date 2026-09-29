import { useInfiniteQuery } from "@tanstack/react-query";

import { getFeedPosts } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

const PAGE_SIZE = 6;

export function useFeedPosts() {
    const query = useInfiniteQuery({
        queryKey: queryKeys.feed(),
        queryFn: ({ pageParam }) => getFeedPosts(pageParam, PAGE_SIZE),
        initialPageParam: 1,
        getNextPageParam: (lastPage) =>
            lastPage.meta?.hasNext ? lastPage.meta.page + 1 : undefined,
    });

    const posts = query.data?.pages.flatMap((page) => page.data) ?? [];

    return {
        posts,
        isLoading: query.isPending,
        isLoadingMore: query.isFetchingNextPage,
        hasMore: Boolean(query.hasNextPage),
        loadMore: query.fetchNextPage,
    };
}
