import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { joinCommunity, leaveCommunity } from "@/services/communityApi";
import { getCommunityMembershipToast } from "@/lib/communityMembership";
import { queryKeys } from "@/lib/queryKeys";

function applyMembershipUpdate(community, communityId, patch, countDelta) {
    if (community.id !== communityId) return community;
    return {
        ...community,
        ...patch,
        membersCount: Math.max(0, (community.membersCount || 0) + countDelta),
    };
}

export function useToggleCommunityMembership() {
    const queryClient = useQueryClient();
    const { userData } = useAuth();

    return useMutation({
        mutationFn: ({ community }) => {
            const shouldLeave = ["joined", "requested"].includes(
                community.membershipStatus
            );
            return shouldLeave
                ? leaveCommunity(community.id)
                : joinCommunity(community.id);
        },

        onMutate: async ({ community }) => {
            await queryClient.cancelQueries();
            const snapshots = queryClient.getQueriesData({ predicate: () => true });

            const wasJoined = community.membershipStatus === "joined";
            const wasRequested = community.membershipStatus === "requested";
            const isPublic = community.visibility === "public";

            let newStatus;
            let newRole = null;
            let countDelta = 0;

            if (wasJoined) {
                newStatus = "not_joined";
                countDelta = -1;
            } else if (wasRequested) {
                newStatus = "not_joined";
            } else if (isPublic) {
                newStatus = "joined";
                newRole = "member";
                countDelta = 1;
            } else {
                newStatus = "requested";
            }

            const membershipPatch = {
                membershipStatus: newStatus,
                communityRole: newRole,
                viewerRole: newRole,
            };

            queryClient.setQueryData(queryKeys.community(community.slug), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    ...membershipPatch,
                    membersCount: Math.max(0, (old.membersCount || 0) + countDelta),
                };
            });

            if (countDelta !== 0) {
                queryClient.setQueryData(
                    queryKeys.communityMembers(community.id),
                    (old = []) => {
                        if (wasJoined) {
                            return old.filter((m) => m.id !== userData.id);
                        }
                        return [...old, { ...userData, communityRole: "member" }];
                    }
                );
            }

            queryClient.setQueryData(queryKeys.communities(), (old) => {
                if (!Array.isArray(old)) return old;
                return old.map((c) =>
                    applyMembershipUpdate(c, community.id, membershipPatch, countDelta)
                );
            });

            queryClient.setQueriesData({ queryKey: ["search"] }, (old) => {
                if (!old || !Array.isArray(old.communities)) return old;
                return {
                    ...old,
                    communities: old.communities.map((c) =>
                        applyMembershipUpdate(c, community.id, membershipPatch, countDelta)
                    ),
                };
            });

            return { snapshots, community };
        },

        onError: (error, variables, context) => {
            if (!context?.snapshots) return;
            context.snapshots.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not update membership"
            );
        },

        onSuccess: (_data, _variables, context) => {
            toast.success(getCommunityMembershipToast(context.community));
        },

        onSettled: (data, error, variables) => {
            if (userData?.username) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.userCommunities(userData.username),
                });
            }
            queryClient.invalidateQueries({
                queryKey: queryKeys.communityRequests(variables.community.id),
            });
        },
    });
}
