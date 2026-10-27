import { useQuery, useQueryClient } from "@tanstack/react-query";

import { reconcileCachedThreadsWithList } from "@/lib/messageCacheHelpers";
import { queryKeys } from "@/lib/queryKeys";
import { getConversations } from "@/services/messageApi";
import { decryptMessageContent, peekDecrypted } from "@/services/messageCrypto";

export function useConversations() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: queryKeys.conversations(),
        queryFn: async () => {
            const { data } = await getConversations();
            const reconciled = Array.isArray(data)
                ? reconcileCachedThreadsWithList(queryClient, data)
                : data;
            if (Array.isArray(reconciled)) {
                await Promise.all(
                    reconciled.map((conv) => {
                        const content = conv?.lastMessage?.content;
                        if (!content || peekDecrypted(content) !== null) {
                            return Promise.resolve();
                        }
                        return decryptMessageContent(content).catch(() => undefined);
                    })
                );
            }
            return reconciled;
        },
        staleTime: 60_000,
        refetchOnWindowFocus: "always",
    });

    return {
        conversations: query.data ?? [],
        isLoading: query.isPending,
        isError: query.isError,
    };
}
