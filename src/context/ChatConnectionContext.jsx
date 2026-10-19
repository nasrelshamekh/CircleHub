import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { chatConnectionContext } from "@/hooks/useChatConnection";
import { createChatConnection, RECEIVE_MESSAGE_EVENT } from "@/services/chatHub";
import { queryKeys } from "@/lib/queryKeys";

// `withAutomaticReconnect` only recovers a connection that was established once, so a tab opened while the
// API is unreachable needs its own retry loop.
const CONNECT_RETRY_MS = 5_000;

/**
 * Keeps a SignalR connection open for the signed-in session and exposes its state, so the UI can tell the
 * user when real-time delivery is not available instead of silently going quiet.
 */
export default function ChatConnectionContextProvider({ children }) {
    const { userData } = useAuth();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState("connecting");

    const isAuthenticated = Boolean(userData);

    useEffect(() => {
        if (!isAuthenticated) return undefined;

        let disposed = false;
        let retryTimer = null;
        let connecting = false;
        const connection = createChatConnection();

        connection.on(RECEIVE_MESSAGE_EVENT, () => {
            // A message from someone else affects the conversation list, the open thread and the unread
            // badge. conversations() is a prefix of conversation(id), so one invalidation refreshes all
            // three and the server stays the source of truth for their contents.
            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations(),
            });
        });

        // Ignoring the callbacks after teardown keeps our own stop() from reporting a connection we are
        // deliberately closing as a drop.
        connection.onreconnecting(() => {
            if (!disposed) setStatus("reconnecting");
        });
        connection.onreconnected(() => {
            if (!disposed) setStatus("live");
        });
        connection.onclose(() => {
            if (!disposed) setStatus("offline");
        });

        function connect() {
            if (disposed || connecting) return;

            connecting = true;

            connection
                .start()
                .then(() => {
                    connecting = false;
                    if (!disposed) setStatus("live");
                })
                .catch(() => {
                    connecting = false;
                    if (disposed) return;

                    // The connection is created per session, so a failed start leaves it permanently
                    // disconnected; only a fresh start() can recover it.
                    setStatus("offline");
                    retryTimer = setTimeout(connect, CONNECT_RETRY_MS);
                });
        }

        connect();

        return () => {
            disposed = true;
            if (retryTimer) clearTimeout(retryTimer);

            connection.off(RECEIVE_MESSAGE_EVENT);
            connection.stop().catch(() => {});
        };
    }, [isAuthenticated, queryClient]);

    // Reported rather than reset from the effect: a signed-out session has nothing to connect, and the
    // connection is torn down by the cleanup.
    const value = useMemo(
        () => ({ status: isAuthenticated ? status : "idle" }),
        [isAuthenticated, status]
    );

    return (
        <chatConnectionContext.Provider value={value}>
            {children}
        </chatConnectionContext.Provider>
    );
}
