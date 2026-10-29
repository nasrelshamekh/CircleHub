import { useMutation, useQueryClient } from "@tanstack/react-query";
import { votePoll } from "@/services/postApi";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";

function updatePollInArray(posts, postId, updatedPoll) {
  if (!Array.isArray(posts)) return posts;
  return posts.map((post) =>
    post.id === postId ? { ...post, poll: updatedPoll } : post
  );
}

export function updatePollInCache(queryClient, postId, updatedPoll) {
  if (!queryClient || !postId || !updatedPoll) return;

  // 1. Single Post details query
  queryClient.setQueryData(queryKeys.post(postId), (old) => {
    if (!old) return old;
    return { ...old, poll: updatedPoll };
  });

  // 2. Feed query (Infinite query with pages)
  queryClient.setQueryData(queryKeys.feed(), (old) => {
    if (!old || !old.pages) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        data: updatePollInArray(page.data, postId, updatedPoll),
      })),
    };
  });

  // 3. User posts, liked posts, community posts
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
    (old) => (Array.isArray(old) ? updatePollInArray(old, postId, updatedPoll) : old)
  );

  // 4. Search query
  queryClient.setQueriesData(
    {
      predicate: (query) => query.queryKey[0] === "search",
    },
    (old) => {
      if (!old) return old;
      if (Array.isArray(old)) return updatePollInArray(old, postId, updatedPoll);
      if (old.posts) {
        return {
          ...old,
          posts: updatePollInArray(old.posts, postId, updatedPoll),
        };
      }
      return old;
    }
  );
}

function calculateOptimisticPoll(currentPoll, optionId) {
  if (!currentPoll || !currentPoll.options) return currentPoll;

  const previousOptionId = currentPoll.myVotedOptionId;
  const isVoteChange = Boolean(previousOptionId && previousOptionId !== optionId);
  const isNewVote = !previousOptionId;

  const newTotalVotes = isNewVote
    ? (currentPoll.totalVotes || 0) + 1
    : currentPoll.totalVotes || 0;

  const newOptions = currentPoll.options.map((opt) => {
    let votes = opt.votesCount || 0;
    if (opt.id === optionId) {
      votes += 1;
    } else if (isVoteChange && opt.id === previousOptionId) {
      votes = Math.max(0, votes - 1);
    }
    return {
      ...opt,
      votesCount: votes,
    };
  });

  return {
    ...currentPoll,
    myVotedOptionId: optionId,
    totalVotes: newTotalVotes,
    options: newOptions.map((opt) => ({
      ...opt,
      percentage:
        newTotalVotes > 0
          ? Math.round((opt.votesCount / newTotalVotes) * 100)
          : 0,
    })),
  };
}

export function useVotePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, optionId }) => votePoll(postId, optionId),

    onMutate: async ({ postId, optionId, currentPoll }) => {
      // Cancel ongoing queries for this post
      await queryClient.cancelQueries({ queryKey: queryKeys.post(postId) });

      // Optimistic update
      if (currentPoll) {
        const optimisticPoll = calculateOptimisticPoll(currentPoll, optionId);
        updatePollInCache(queryClient, postId, optimisticPoll);
      }

      return { previousPoll: currentPoll };
    },

    onSuccess: (data, { postId }) => {
      const updatedPoll = data?.data || data;
      if (updatedPoll) {
        updatePollInCache(queryClient, postId, updatedPoll);
      }
    },

    onError: (error, { postId }, context) => {
      if (context?.previousPoll) {
        updatePollInCache(queryClient, postId, context.previousPoll);
      }
      const msg = error.response?.data?.message || "Failed to submit vote";
      toast.error(msg);
    },
  });
}
