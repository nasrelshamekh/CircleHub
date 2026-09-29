import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createPost } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

export function useCreatePost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ content, communityId, imageFile }) =>
            createPost({ content, communityId, imageFile }),

        onSuccess: (response, { communityId }) => {
            const post = response.data;
            const authorUsername = post.author?.username;

            queryClient.setQueryData(queryKeys.feed(), (old) => {
                if (!old) return old;
                const [firstPage, ...rest] = old.pages;
                return {
                    ...old,
                    pages: [
                        { ...firstPage, data: [post, ...(firstPage.data || [])] },
                        ...rest,
                    ],
                };
            });

            if (authorUsername) {
                queryClient.setQueryData(
                    queryKeys.userPosts(authorUsername),
                    (old) => (Array.isArray(old) ? [post, ...old] : old)
                );

                queryClient.setQueryData(queryKeys.user(authorUsername), (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        postsCount: (old.postsCount || 0) + 1,
                    };
                });
            }

            if (communityId) {
                queryClient.setQueryData(
                    queryKeys.communityPosts(communityId),
                    (old) => (Array.isArray(old) ? [post, ...old] : old)
                );

                queryClient.invalidateQueries({
                    predicate: (query) => {
                        const [root, , sub] = query.queryKey;
                        return root === "community" && sub === undefined;
                    },
                });
            }

            toast.success(
                communityId
                    ? "Community post created successfully"
                    : "Post created successfully"
            );
        },
    });
}
