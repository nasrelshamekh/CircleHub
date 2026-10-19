import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getConversation } from "@/services/messageApi";
import { queryKeys } from "@/lib/queryKeys";

export function useConversation(id) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.conversation(id),
        queryFn: async () => {
            const { data } = await getConversation(id);
            return data;
        },
        enabled: Boolean(id),
    });

    useEffect(() => {
        if (!query.data) return;

        queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
    }, [query.data, queryClient]);

    return {
        conversation: query.data,
        messages: query.data?.messages ?? [],
        otherUser: query.data?.otherUser,
        isLoading: query.isPending,
        isError: query.isError,
    };
}
