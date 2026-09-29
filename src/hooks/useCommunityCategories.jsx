import { useQuery } from "@tanstack/react-query";

import { getCommunityCategories } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

export function useCommunityCategories() {
    const query = useQuery({
        queryKey: queryKeys.communityCategories(),
        queryFn: async () => {
            const { data } = await getCommunityCategories();
            return data;
        },
    });

    return {
        categories: query.data ?? [],
        isLoading: query.isPending,
    };
}