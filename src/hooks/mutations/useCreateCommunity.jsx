import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createCommunity } from "@/services/communityApi";
import { queryKeys } from "@/lib/queryKeys";

export function useCreateCommunity() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data) => createCommunity(data),

        onSuccess: (response) => {
            const community = {
                ...response.data,
                viewerRole: response.data.communityRole,
                membershipStatus: "joined",
            };

            queryClient.setQueryData(queryKeys.communities(), (old) =>
                Array.isArray(old) ? [community, ...old] : [community]
            );

            toast.success(response.message || "Community created successfully");
        },
    });
}