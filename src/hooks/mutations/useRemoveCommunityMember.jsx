import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { removeCommunityMember } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

function decrementCommunityMemberCount(community, communityId) {
    if (community.id !== communityId) return community;
    return {
        ...community,
        membersCount: Math.max(0, (community.membersCount || 0) - 1),
    };
}

export function useRemoveCommunityMember() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, membershipId }) =>
            removeCommunityMember(communityId, membershipId),

        onMutate: async ({ communityId, membershipId, communitySlug }) => {
            await queryClient.cancelQueries();
            const snapshots = queryClient.getQueriesData({ predicate: () => true });

            queryClient.setQueryData(
                queryKeys.communityMembers(communityId),
                (old = []) => old.filter((m) => m.membershipId !== membershipId)
            );

            if (communitySlug) {
                queryClient.setQueryData(queryKeys.community(communitySlug), (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        membersCount: Math.max(0, (old.membersCount || 0) - 1),
                    };
                })
            }

            queryClient.setQueryData(queryKeys.communities(), (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((c) => decrementCommunityMemberCount(c, communityId));
            });

            queryClient.setQueriesData({ queryKey: ["search"] }, (old) => {
                if (!old || !Array.isArray(old.communities)) return old;
                return {
                    ...old,
                    communities: old.communities.map((c) => decrementCommunityMemberCount(c, communityId)),
                };
            });

            return { snapshots };
        },

        onError: (error, variables, context) => {
            if (!context?.snapshots) return;
            context.snapshots.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not remove member"
            );
        },

        onSuccess: () => {
            toast.success("Member removed");
        }
    });

}
