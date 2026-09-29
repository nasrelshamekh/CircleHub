import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { followUser, unfollowUser } from "@/services/userApi";
import { queryKeys } from "@/lib/queryKeys";

export function useToggleFollow() {
    const queryClient = useQueryClient();
    const { userData } = useAuth();
    const myUsername = userData?.username;
    const myUserId = userData?.id;

    return useMutation({
        mutationFn: ({ userId, shouldFollow }) =>
            shouldFollow ? followUser(userId) : unfollowUser(userId),

        onMutate: async ({ userId, shouldFollow, targetUsername }) => {
            await queryClient.cancelQueries();
            const snapshots = queryClient.getQueriesData({ predicate: () => true });

            const delta = shouldFollow ? 1 : -1;

            queryClient.setQueryData(queryKeys.user(targetUsername), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    isFollowedByMe: shouldFollow,
                    followersCount: (old.followersCount || 0) + delta,
                };
            });

            if (myUsername) {
                queryClient.setQueryData(queryKeys.user(myUsername), (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        followingCount: (old.followingCount || 0) + delta,
                    };
                });
            }

            queryClient.setQueriesData({ queryKey: ["search"] }, (old) => {
                if (!old || !Array.isArray(old.users)) return old;
                return {
                    ...old,
                    users: old.users.map((u) =>
                        u.id === userId
                            ? {
                                ...u,
                                isFollowedByMe: shouldFollow,
                                followersCount: Math.max(0, (u.followersCount || 0) + delta),
                            }
                            : u
                    ),
                };
            });

            if (shouldFollow) {
                queryClient.setQueriesData({ queryKey: queryKeys.suggestedUsers() }, (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((u) =>
                        u.id === userId
                            ? {
                                  ...u,
                                  isFollowedByMe: shouldFollow,
                                  followersCount: Math.max(0, (u.followersCount || 0) + delta),
                              }
                            : u
                    );
                });
            }

            queryClient.setQueriesData(
                {
                    predicate: (query) => {
                        const [root, , sub] = query.queryKey;
                        return root === "user" && (sub === "followers" || sub === "following");
                    },
                },
                (old) => {
                    if (!Array.isArray(old)) return old;
                    return old.map((u) =>
                        u.id === userId
                            ? { ...u, isFollowedByMe: shouldFollow }
                            : u
                    );
                }
            );

            if (!shouldFollow) {
                if (myUsername) {
                    queryClient.setQueryData(
                        queryKeys.userFollowing(myUsername),
                        (old) => (Array.isArray(old) ? old.filter((u) => u.id !== userId) : old)
                    );
                }
                if (myUserId) {
                    queryClient.setQueryData(
                        queryKeys.userFollowers(targetUsername),
                        (old) => (Array.isArray(old) ? old.filter((u) => u.id !== myUserId) : old)
                    );
                }
            }

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
                "Could not update follow"
            );
        },

        onSettled: (data, error, { targetUsername }) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.userFollowers(targetUsername),
            });
            if (myUsername) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.userFollowing(myUsername),
                });
            }
        },
    });
}
