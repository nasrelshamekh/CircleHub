import { useQuery } from "@tanstack/react-query";

import { getCommunityMembers } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

const ROLE_RANK = { admin: 0, moderator: 1, member: 2 };

function sortMembersByRole(members) {
    return [...members].sort(
        (a, b) =>
            (ROLE_RANK[a.communityRole] ?? 3) - (ROLE_RANK[b.communityRole] ?? 3)
    );
}

export function useCommunityMembers(communityId) {
    const query = useQuery({
        queryKey: queryKeys.communityMembers(communityId),
        queryFn: async () => {
            try {
                const { data } = await getCommunityMembers(communityId);
                return sortMembersByRole(data);
            } catch (error) {
                if (error.response?.status === 403) return [];
                throw error;
            }
        },
        enabled: Boolean(communityId),
    });

    return {
        members: query.data ?? [],
        isLoading: query.isPending,
    };
}
