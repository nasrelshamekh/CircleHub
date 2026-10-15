import { useQuery } from "@tanstack/react-query";

import { getConversations } from "@/services/messageApi";
import { queryKeys } from "@/lib/queryKeys";

export function useConversations() {
    const query = useQuery({
        queryKey: queryKeys.conversations(),
        queryFn: async () => {
            const { data } = await getConversations();
            return data;
        },
    });

    return {
        conversations: query.data ?? [],
        isLoading: query.isPending,
        isError: query.isError,
    };
}
