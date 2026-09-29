import { useQuery } from "@tanstack/react-query";

import { getUserFollowing } from "@/services/userApi";
import { queryKeys } from "@/lib/queryKeys";

export function useUserFollowing(username) {
    const query = useQuery({
        queryKey: queryKeys.userFollowing(username),
        queryFn: async () => {
            const { data } = await getUserFollowing(username);
            return data;
        },
        enabled: Boolean(username),
    });

    return {
        following: query.data ?? [],
        isLoading: query.isPending,
        refetch: query.refetch,
    };
}
