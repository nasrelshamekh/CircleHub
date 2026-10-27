import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/queryKeys";
import { getConversations } from "@/services/messageApi";
import { decryptMessageContent, peekDecrypted } from "@/services/messageCrypto";

export function useConversations() {
    const query = useQuery({
        queryKey: queryKeys.conversations(),
        queryFn: async () => {
            const { data } = await getConversations();
            if (Array.isArray(data)) {
                await Promise.all(
                    data.map((conv) => {
                        const content = conv?.lastMessage?.content;
                        if (!content || peekDecrypted(content) !== null) {
                            return Promise.resolve();
                        }
                        return decryptMessageContent(content).catch(() => undefined);
                    })
                );
            }
            return data;
        },
        staleTime: 60_000,
    });

    return {
        conversations: query.data ?? [],
        isLoading: query.isPending,
        isError: query.isError,
    };
}
