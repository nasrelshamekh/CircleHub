import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { decideCommunityJoinRequest } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

const ROLE_RANK = { admin: 0, moderator: 1, member: 2 };

function sortMembersByRole(members) {
    return [...members].sort(
        (a, b) =>
            (ROLE_RANK[a.communityRole] ?? 3) - (ROLE_RANK[b.communityRole] ?? 3)
    );
}

function bumpCommunityCount(community, communityId, delta) {
    if (community.id !== communityId) return community;
    return {
        ...community,
        membersCount: Math.max(0, (community.membersCount || 0) + delta),
    };
}

export function useDecideCommunityJoinRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ community, request, decision }) =>
            decideCommunityJoinRequest(community.id, request.id, decision),

        onMutate: async ({ community, request, decision }) => {
            await queryClient.cancelQueries();
            const snapshots = queryClient.getQueriesData({ predicate: () => true });

            const isApprove = decision === "approve";

            queryClient.setQueryData(
                queryKeys.communityRequests(community.id),
                (old = []) => old.filter((r) => r.id !== request.id)
            );

            if (isApprove) {
                queryClient.setQueryData(
                    queryKeys.communityMembers(community.id),
                    (old = []) => {
                        const alreadyMember = old.some((m) => m.id === request.user.id);
                        if (alreadyMember) return old;
                        const withNew = [
                            ...old,
                            { ...request.user, communityRole: "member" },
                        ];
                        return sortMembersByRole(withNew);
                    }
                );

                queryClient.setQueryData(queryKeys.community(community.slug), (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        membersCount: (old.membersCount || 0) + 1,
                    };
                });

                queryClient.setQueryData(queryKeys.communities(), (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((c) => bumpCommunityCount(c, community.id, 1));
                });

                queryClient.setQueriesData({ queryKey: ["search"] }, (old) => {
                    if (!old || !Array.isArray(old.communities)) return old;
                    return {
                        ...old,
                        communities: old.communities.map((c) =>
                            bumpCommunityCount(c, community.id, 1)
                        ),
                    };
                });
            }

            return { snapshots, request, decision };
        },

        onError: (error, variables, context) => {
            if (!context?.snapshots) return;
            context.snapshots.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not process request"
            );
        },

        onSuccess: (response, variables, context) => {
            if (context.decision === "approve") {
                const newMembership = response?.data?.membership;
                if (newMembership) {
                    queryClient.setQueryData(
                        queryKeys.communityMembers(variables.community.id),
                        (old = []) =>
                            old.map((m) =>
                                m.id === context.request.user.id
                                    ? { ...m, membershipId: newMembership.id }
                                    : m
                            )
                    );
                }
                toast.success(`${context.request.user.name} was accepted`);
            } else {
                toast.success("Request rejected");
            }
        },
    });
}
