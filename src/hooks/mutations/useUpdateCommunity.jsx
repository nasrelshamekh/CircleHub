import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateCommunity } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

export function useUpdateCommunity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ communityId, data }) => updateCommunity(communityId, data),

        onSuccess: (response, variables) => {
            const updated = response.data;

            queryClient.setQueryData(queryKeys.communities(), (old) =>
                Array.isArray(old)
                    ? old.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
                    : old
            );

            if (variables.slug) {
                queryClient.setQueryData(queryKeys.community(variables.slug), (old) => {
                    if (!old) return old;
                    return { ...old, ...updated };
                });
            }

            toast.success(response.message || "Community updated successfully");
        },

        onError: (error) => {
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Could not update community"
            );
        },
    });
}