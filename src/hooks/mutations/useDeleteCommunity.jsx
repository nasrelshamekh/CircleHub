import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteCommunity } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

export function useDeleteCommunity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (communityId) => deleteCommunity(communityId),

        onSuccess: (response, communityId) => {
            queryClient.setQueryData(queryKeys.communities(), (old) =>
                Array.isArray(old) ? old.filter((c) => c.id !== communityId) : old
            );

            queryClient.removeQueries({
                predicate: (query) => {
                    const [root, , sub] = query.queryKey;
                    return root === "community" || (root === "user" && sub === "communities");
                },
            });

            toast.success(response.message || "Community deleted successfully");
        },

        onError: (error) => {
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not delete community"
            );
        },
    });
}