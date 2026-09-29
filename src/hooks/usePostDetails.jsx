import { useQuery } from "@tanstack/react-query";

import { getPostById } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

export function usePostDetails(postId) {
    const query = useQuery({
        queryKey: queryKeys.post(postId),
        queryFn: async () => {
            const { data } = await getPostById(postId);
            return data;
        },
        enabled: Boolean(postId),
    });

    return {
        post: query.data ?? null,
        isLoading: query.isPending,
    };
}
