import { useMutation, useQueryClient } from "@tanstack/react-query";
import { votePoll } from "@/services/postApi";
import { toast } from "sonner";

export function useVotePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, optionId }) => votePoll(postId, optionId),
    onSuccess: (data, { postId }) => {
      const updatedPoll = data.data;

      // Helper to update a post in any list
      const updatePostInList = (old) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((post) =>
            post.id === postId ? { ...post, poll: updatedPoll } : post
          );
        }
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data?.map((post) =>
                post.id === postId ? { ...post, poll: updatedPoll } : post
              ),
            })),
          };
        }
        if (old.data) {
          return {
            ...old,
            data: Array.isArray(old.data)
              ? old.data.map((post) =>
                  post.id === postId ? { ...post, poll: updatedPoll } : post
                )
              : old.data.id === postId
              ? { ...old.data, poll: updatedPoll }
              : old.data,
          };
        }
        return old;
      };

      // Invalidate or optimistically patch queries
      queryClient.setQueriesData({ queryKey: ["feed-posts"] }, updatePostInList);
      queryClient.setQueriesData({ queryKey: ["community-posts"] }, updatePostInList);
      queryClient.setQueriesData({ queryKey: ["user-posts"] }, updatePostInList);
      queryClient.setQueriesData({ queryKey: ["post", postId] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: { ...old.data, poll: updatedPoll },
        };
      });
    },
    onError: (error) => {
      const msg = error.response?.data?.message || "Failed to submit vote";
      toast.error(msg);
    },
  });
}
