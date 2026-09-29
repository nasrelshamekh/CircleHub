import { useQuery } from "@tanstack/react-query";

import { getUserLikedPosts } from "@/services/userApi";
import { queryKeys } from "@/lib/queryKeys";

export function useProfileLikedPosts(username) {
    const query = useQuery({
        queryKey: queryKeys.userLikedPosts(username),
        queryFn: async () => {
            const { data } = await getUserLikedPosts(username);
            return data;
        },
        enabled: Boolean(username),
    });

    return {
        likedPosts: query.data ?? [],
        isLoading: query.isPending,
    };
}
