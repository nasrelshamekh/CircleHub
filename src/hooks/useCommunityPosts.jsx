import { useQuery } from "@tanstack/react-query";

import { getCommunityPosts } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

export function useCommunityPosts(communityId) {
    const query = useQuery({
        queryKey: queryKeys.communityPosts(communityId),
        queryFn: async () => {
            try {
                const { data } = await getCommunityPosts(communityId);
                return data;
            } catch (error) {
                if (error.response?.status === 403) return [];
                throw error;
            }
        },
        enabled: Boolean(communityId),
    });

    return {
        posts: query.data ?? [],
        isLoading: query.isPending,
    };
}
