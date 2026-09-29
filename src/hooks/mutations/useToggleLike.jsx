import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { toggleLikePost } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

function flipLike(post) {
    const isLikedByMe = !post.isLikedByMe;
    return {
        ...post,
        isLikedByMe,
        likesCount: (post.likesCount || 0) + (isLikedByMe ? 1 : -1),
    };
}

function flipInArray(posts, postId) {
    return posts.map((p) => (p.id === postId ? flipLike(p) : p));
}

export function useToggleLike() {
    const queryClient = useQueryClient();
    const { userData } = useAuth();
    const currentUsername = userData?.username;

    return useMutation({
        mutationFn: (postId) => toggleLikePost(postId),

        onMutate: async (postId) => {
            await queryClient.cancelQueries();

            const snapshots = queryClient.getQueriesData({ predicate: () => true });

            queryClient.setQueryData(queryKeys.post(postId), (old) =>
                old ? flipLike(old) : old
            );

            queryClient.setQueryData(queryKeys.feed(), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: flipInArray(page.data, postId),
                    })),
                };
            });

            queryClient.setQueriesData(
                {
                    predicate: (query) => {
                        const [root, , sub] = query.queryKey;
                        return (
                            (root === "user" &&
                                (sub === "posts" || sub === "liked-posts")) ||
                            (root === "community" && sub === "posts")
                        );
                    },
                },
                (old) => (Array.isArray(old) ? flipInArray(old, postId) : old)
            );

            queryClient.setQueriesData({ queryKey: ["search"] }, (old) =>
                old
                    ? { ...old, posts: flipInArray(old.posts ?? [], postId) }
                    : old
            );

            return { snapshots };
        },

        onError: (error, postId, context) => {
            if (!context?.snapshots) return;
            context.snapshots.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not update like"
            );
        },

        onSettled: () => {
            if (currentUsername) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.userLikedPosts(currentUsername),
                });
            }
        },
    });
}
