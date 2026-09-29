import { useQuery } from "@tanstack/react-query";

import { getCommunityJoinRequests } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

export function useCommunityRequests(communityId) {
    const query = useQuery({
        queryKey: queryKeys.communityRequests(communityId),
        queryFn: async () => {
            try {
                const { data } = await getCommunityJoinRequests(communityId);
                return data;
            } catch (error) {
                if (error.response?.status === 403) return [];
                throw error;
            }
        },
        enabled: Boolean(communityId),
    });

    return {
        requests: query.data ?? [],
        isLoading: query.isPending,
    };
}
