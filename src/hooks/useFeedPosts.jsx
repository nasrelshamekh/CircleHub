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

    // Pages are fetched by offset, so a post created while the feed is open
    // shifts the window and one post can land in two pages at once. Keep the
    // first occurrence so list keys stay unique and nothing renders twice.
    const seen = new Set();
    const posts = [];

    for (const page of query.data?.pages ?? []) {
        for (const post of page.data) {
            if (seen.has(post.id)) continue;

            seen.add(post.id);
            posts.push(post);
        }
    }

    return {
        posts,
        isLoading: query.isPending,
        isLoadingMore: query.isFetchingNextPage,
        hasMore: Boolean(query.hasNextPage),
        loadMore: query.fetchNextPage,
    };
}
