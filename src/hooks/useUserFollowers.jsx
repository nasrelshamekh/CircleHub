import { useQuery } from "@tanstack/react-query";

import { getUserFollowers } from "@/services/userApi";
import { queryKeys } from "@/lib/queryKeys";

export function useUserFollowers(username) {
    const query = useQuery({
        queryKey: queryKeys.userFollowers(username),
        queryFn: async () => {
            const { data } = await getUserFollowers(username);
            return data;
        },
        enabled: Boolean(username),
    });

    return {
        followers: query.data ?? [],
        isLoading: query.isPending,
        refetch: query.refetch,
    };
}
