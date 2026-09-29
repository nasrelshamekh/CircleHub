import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deletePostComment } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

function bumpCommentsCount(posts, postId, delta) {
    return posts.map((p) =>
        p.id === postId
            ? { ...p, commentsCount: (p.commentsCount || 0) + delta }
            : p
    );
}

export function useDeleteComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId }) => deletePostComment(postId, commentId),

        onMutate: async ({ postId, commentId }) => {
            await queryClient.cancelQueries();
            const snapshots = queryClient.getQueriesData({ predicate: () => true });

            queryClient.setQueryData(queryKeys.post(postId), (old) => {
                if (!old) return old;
                const remaining = (old.comments || []).filter(
                    (c) => c.id !== commentId
                );
                return {
                    ...old,
                    comments: remaining,
                    commentsCount: remaining.length,
                };
            });

            queryClient.setQueryData(queryKeys.feed(), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: bumpCommentsCount(page.data, postId, -1),
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
                (old) =>
                    Array.isArray(old) ? bumpCommentsCount(old, postId, -1) : old
            );

            queryClient.setQueriesData({ queryKey: ["search"] }, (old) => {
                if (!old || !Array.isArray(old.posts)) return old;
                return { ...old, posts: bumpCommentsCount(old.posts, postId, -1) };
            });

            return { snapshots };
        },

        onSuccess: () => {
            toast.success("Comment has been deleted");
        },

        onError: (error, variables, context) => {
            if (!context?.snapshots) return;
            context.snapshots.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not delete comment"
            );
        },
    });
}
