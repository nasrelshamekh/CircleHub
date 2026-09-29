import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteCommunityPost, deletePost } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

function removeFromArray(posts, postId) {
    return posts.filter((p) => p.id !== postId);
}

export function useDeletePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (post) =>
            post.community?.id
                ? deleteCommunityPost(post.community.id, post.id)
                : deletePost(post.id),

        onMutate: async (post) => {
            await queryClient.cancelQueries();
            const snapshots = queryClient.getQueriesData({ predicate: () => true });

            const postId = post.id;
            const authorUsername = post.author?.username;
            const communitySlug = post.community?.slug;

            queryClient.removeQueries({ queryKey: queryKeys.post(postId) });

            queryClient.setQueryData(queryKeys.feed(), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: removeFromArray(page.data, postId),
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
                    Array.isArray(old) ? removeFromArray(old, postId) : old
            );

            queryClient.setQueriesData({ queryKey: ["search"] }, (old) => {
                if (!old || !Array.isArray(old.posts)) return old;
                return { ...old, posts: removeFromArray(old.posts, postId) };
            });

            if (authorUsername) {
                queryClient.setQueryData(queryKeys.user(authorUsername), (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        postsCount: Math.max(0, (old.postsCount || 0) - 1),
                    };
                });
            }

            if (communitySlug) {
                queryClient.setQueryData(queryKeys.community(communitySlug), (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        postsCount: Math.max(0, (old.postsCount || 0) - 1),
                    };
                });
            }

            return { snapshots };
        },

        onError: (error, post, context) => {
            if (!context?.snapshots) return;
            context.snapshots.forEach(([key, value]) => {
                queryClient.setQueryData(key, value);
            });
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not delete post"
            );
        },

        onSuccess: (_data, post) => {
            const isCommunityPost = Boolean(post.community?.id);
            toast.success(
                isCommunityPost
                    ? "Community post deleted successfully"
                    : "Post deleted successfully"
            );
        },
    });
}
