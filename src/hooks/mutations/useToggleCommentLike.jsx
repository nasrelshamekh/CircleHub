import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { toggleCommentLike } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

function updateCommentLikeInTree(comments, commentId, isLiked, likesCount) {
    return comments.map((comment) => {
        if (comment.id === commentId) {
            return {
                ...comment,
                isLiked,
                likesCount,
            };
        }
        if (comment.replies && comment.replies.length > 0) {
            return {
                ...comment,
                replies: updateCommentLikeInTree(comment.replies, commentId, isLiked, likesCount),
            };
        }
        return comment;
    });
}

export function useToggleCommentLike() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, commentId }) => toggleCommentLike(postId, commentId),

        onMutate: async ({ postId, commentId }) => {
            await queryClient.cancelQueries({ queryKey: queryKeys.post(postId) });
            const previousPost = queryClient.getQueryData(queryKeys.post(postId));

            if (previousPost?.comments) {
                // Find comment to compute optimistic values
                const findComment = (list) => {
                    for (const c of list) {
                        if (c.id === commentId) return c;
                        if (c.replies?.length) {
                            const found = findComment(c.replies);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const target = findComment(previousPost.comments);
                if (target) {
                    const optimisticIsLiked = !target.isLiked;
                    const optimisticCount = target.likesCount + (optimisticIsLiked ? 1 : -1);

                    queryClient.setQueryData(queryKeys.post(postId), (old) => {
                        if (!old) return old;
                        return {
                            ...old,
                            comments: updateCommentLikeInTree(
                                old.comments || [],
                                commentId,
                                optimisticIsLiked,
                                Math.max(0, optimisticCount)
                            ),
                        };
                    });
                }
            }

            return { previousPost };
        },

        onSuccess: (response, { postId, commentId }) => {
            const data = response.data;
            if (data) {
                queryClient.setQueryData(queryKeys.post(postId), (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        comments: updateCommentLikeInTree(
                            old.comments || [],
                            commentId,
                            data.isLiked,
                            data.likesCount
                        ),
                    };
                });
            }
        },

        onError: (err, { postId }, context) => {
            if (context?.previousPost) {
                queryClient.setQueryData(queryKeys.post(postId), context.previousPost);
            }
            toast.error(
                err.response?.data?.message ||
                err.message ||
                "Failed to update comment like"
            );
        },
    });
}
