import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { addPostComment } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

function bumpCommentsCount(posts, postId, delta) {
    return posts.map((p) =>
        p.id === postId
            ? { ...p, commentsCount: (p.commentsCount || 0) + delta }
            : p
    );
}

function insertReplyIntoTree(comments, parentCommentId, reply) {
    return comments.map((comment) => {
        if (comment.id === parentCommentId) {
            return {
                ...comment,
                replies: [...(comment.replies || []), reply],
            };
        }
        if (comment.replies && comment.replies.length > 0) {
            return {
                ...comment,
                replies: insertReplyIntoTree(comment.replies, parentCommentId, reply),
            };
        }
        return comment;
    });
}

export function useAddComment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, content, parentCommentId }) =>
            addPostComment(postId, content, parentCommentId),

        onSuccess: (response, { postId, parentCommentId }) => {
            const newComment = response.data.comment;

            queryClient.setQueryData(queryKeys.post(postId), (old) => {
                if (!old) return old;
                let updatedComments;
                if (parentCommentId) {
                    updatedComments = insertReplyIntoTree(old.comments || [], parentCommentId, newComment);
                } else {
                    updatedComments = [newComment, ...(old.comments || [])];
                }

                return {
                    ...old,
                    comments: updatedComments,
                    commentsCount: (old.commentsCount || 0) + 1,
                };
            });

            queryClient.setQueryData(queryKeys.feed(), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: bumpCommentsCount(page.data, postId, 1),
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
                    Array.isArray(old) ? bumpCommentsCount(old, postId, 1) : old
            );

            queryClient.setQueriesData({ queryKey: ["search"] }, (old) => {
                if (!old || !Array.isArray(old.posts)) return old;
                return { ...old, posts: bumpCommentsCount(old.posts, postId, 1) };
            });
        },

        onError: (error) => {
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not add comment"
            );
        },
    });
}
