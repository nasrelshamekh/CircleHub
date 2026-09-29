import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getCommunities } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

export function useCommunities() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.communities(),
        queryFn: async () => {
            const { data } = await getCommunities();
            return data;
        },
    });

    function setCommunities(updater) {
        queryClient.setQueryData(queryKeys.communities(), (old = []) =>
            typeof updater === "function" ? updater(old) : updater
        );
    }

    return {
        communities: query.data ?? [],
        setCommunities,
        isLoading: query.isPending,
        refetch: query.refetch,
    };
}
