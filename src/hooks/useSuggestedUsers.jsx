import { useQuery } from "@tanstack/react-query";

import { getSuggestedUsers } from "@/services/userApi";
import { queryKeys } from "@/lib/queryKeys";

export function useSuggestedUsers() {
    const query = useQuery({
        queryKey: queryKeys.suggestedUsers(),
        queryFn: async () => {
            const { data } = await getSuggestedUsers();
            return data;
        },
    });

    return {
        suggestedUsers: query.data ?? [],
        isLoading: query.isPending,
        refetch: query.refetch,
    };
}
