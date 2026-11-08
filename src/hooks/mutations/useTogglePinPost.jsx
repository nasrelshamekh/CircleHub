import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { togglePinPost } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";

export function useTogglePinPost() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId }) => togglePinPost(postId),

        onSuccess: (response, { postId, communityId }) => {
            const isPinned = response.data?.isPinned;
            toast.success(
                isPinned
                    ? "Post pinned to community"
                    : "Post unpinned from community"
            );

            // Invalidate post details
            queryClient.invalidateQueries({ queryKey: queryKeys.post(postId) });

            // Invalidate community posts
            if (communityId) {
                queryClient.invalidateQueries({ queryKey: queryKeys.communityPosts(communityId) });
            }
            queryClient.invalidateQueries({
                predicate: (query) => {
                    const [root, , sub] = query.queryKey;
                    return root === "community" && sub === "posts";
                },
            });

            // Invalidate feed if needed
            queryClient.invalidateQueries({ queryKey: queryKeys.feed() });
        },

        onError: (err) => {
            toast.error(
                err.response?.data?.message ||
                err.message ||
                "Failed to pin post"
            );
        },
    });
}
