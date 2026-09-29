import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateCommunityMemberRole } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

const ROLE_RANK = { admin: 0, moderator: 1, member: 2 };

function sortMembersByRole(members) {
    return [...members].sort(
        (a, b) =>
            (ROLE_RANK[a.communityRole] ?? 3) - (ROLE_RANK[b.communityRole] ?? 3)
    );
}

export function useUpdateCommunityMemberRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, membershipId, role }) =>
            updateCommunityMemberRole(communityId, membershipId, role),

        onMutate: async ({ communityId, membershipId, role }) => {
            const key = queryKeys.communityMembers(communityId);
            await queryClient.cancelQueries({ queryKey: key });

            const previous = queryClient.getQueryData(key);

            queryClient.setQueryData(key, (old = []) => {
                const updated = old.map((m) =>
                    m.membershipId === membershipId
                        ? { ...m, communityRole: role }
                        : m
                );
                return sortMembersByRole(updated);
            });

            const target = (previous || []).find(
                (m) => m.membershipId === membershipId
            );

            return { previous, targetName: target?.name };
        },

        onError: (error, variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(
                    queryKeys.communityMembers(variables.communityId),
                    context.previous
                );
            }
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not update member role"
            );
        },

        onSuccess: (_data, variables, context) => {
            const name = context?.targetName || "Member";
            toast.success(
                variables.role === "moderator"
                    ? `${name} is now a moderator`
                    : `${name} is now a member`
            );
        },
    });
}
