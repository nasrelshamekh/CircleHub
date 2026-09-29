import { useQuery } from "@tanstack/react-query";

import { getCommunityBySlug } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

export function useCommunityDetails(slug) {
    const query = useQuery({
        queryKey: queryKeys.community(slug),
        queryFn: async () => {
            try {
                const { data } = await getCommunityBySlug(slug);
                return data;
            } catch (error) {
                if (error.response?.status === 404) return null;
                throw error;
            }
        },
        enabled: Boolean(slug),
    });

    return {
        community: query.data ?? null,
        isLoading: query.isPending,
    };
}
