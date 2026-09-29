import { useQuery } from "@tanstack/react-query";

import { getUserPosts } from "@/services/userApi";
import { queryKeys } from "@/lib/queryKeys";

export function useUserPosts(username) {
    const query = useQuery({
        queryKey: queryKeys.userPosts(username),
        queryFn: async () => {
            const { data } = await getUserPosts(username);
            return data;
        },
        enabled: Boolean(username),
    });

    return {
        posts: query.data ?? [],
        isLoading: query.isPending,
    };
}
