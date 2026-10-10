import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updatePost } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

function replaceInArray(posts, updated) {
    return posts.map((p) => (p.id === updated.id ? updated : p));
}

export function useUpdatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, content, imageFile }) =>
            updatePost({ postId, content, imageFile }),

        onSuccess: (response) => {
            const updated = response.data;

            // The update endpoint returns a plain post (no comments), but the
            // details page caches the post *with* its loaded comments under
            // this same key. Merge instead of replacing so an edit doesn't
            // wipe the comment thread.
            queryClient.setQueryData(queryKeys.post(updated.id), (old) =>
                old
                    ? { ...old, ...updated, comments: old.comments }
                    : updated
            );

            queryClient.setQueryData(queryKeys.feed(), (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        data: replaceInArray(page.data, updated),
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
                (old) => (Array.isArray(old) ? replaceInArray(old, updated) : old)
            );

            queryClient.setQueriesData({ queryKey: ["search"] }, (old) =>
                old
                    ? { ...old, posts: replaceInArray(old.posts ?? [], updated) }
                    : old
            );

            toast.success("Post updated successfully");
        },
    });
}