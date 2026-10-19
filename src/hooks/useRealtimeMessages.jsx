import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { createChatConnection, RECEIVE_MESSAGE_EVENT } from "@/services/chatHub";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Keeps a SignalR connection open for the signed-in session and folds incoming messages into the cache.
 * Sending still goes through `POST /api/messages`; this only mirrors what the server already stored.
 */
export function useRealtimeMessages() {
    const { userData } = useAuth();
    const queryClient = useQueryClient();

    const isAuthenticated = Boolean(userData);

    useEffect(() => {
        if (!isAuthenticated) return undefined;

        const connection = createChatConnection();

        connection.on(RECEIVE_MESSAGE_EVENT, () => {
            // A message from someone else affects the conversation list, the open thread and the unread
            // badge. conversations() is a prefix of conversation(id), so one invalidation refreshes all
            // three and the server remains the source of truth for their contents.
            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations(),
            });
        });

        connection.start().catch(() => {
            // A failed connect is not fatal: the REST calls still work, and the retry policy keeps
            // trying. Rejections from a connection stopped mid-negotiation land here too.
        });

        return () => {
            connection.off(RECEIVE_MESSAGE_EVENT);
            connection.stop().catch(() => {});
        };
    }, [isAuthenticated, queryClient]);
}
