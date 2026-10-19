import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { chatConnectionContext } from "@/hooks/useChatConnection";
import {
    createChatConnection,
    PRESENCE_CHANGED_EVENT,
    RECEIVE_MESSAGE_EVENT,
} from "@/services/chatHub";
import { queryKeys } from "@/lib/queryKeys";

// `withAutomaticReconnect` only recovers a connection that was established once, so a tab opened while the
// API is unreachable needs its own retry loop.
const CONNECT_RETRY_MS = 5_000;

/**
 * Merges a presence event into cached data. One handler covers both shapes React Query holds under the
 * `conversations()` prefix: the list is a plain array, a thread is an infinite query (`{ pages }`).
 * Identical input is returned untouched when nothing matched, so unrelated caches keep their identity.
 */
function withPresence(data, { userId, isOnline, lastSeenAt }) {
    const entries = Array.isArray(data) ? data : data?.pages;

    if (!Array.isArray(entries)) return data;

    let changed = false;

    const next = entries.map((entry) => {
        if (entry.otherUser?.id !== userId) return entry;

        changed = true;

        return { ...entry, otherUser: { ...entry.otherUser, isOnline, lastSeenAt } };
    });

    if (!changed) return data;

    return Array.isArray(data) ? next : { ...data, pages: next };
}

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

        connection.on(PRESENCE_CHANGED_EVENT, (presence) => {
            // Patched by hand so the dot and the wording flip the moment the event lands, without
            // waiting for a round trip. A refetch does still follow, because useConversation invalidates
            // the conversations prefix whenever its data changes — that is the confirmation, not the
            // update path.
            queryClient.setQueriesData(
                { queryKey: queryKeys.conversations() },
                (data) => withPresence(data, presence)
            );
        });

        // Ignoring the callbacks after teardown keeps our own stop() from reporting a connection we are
        // deliberately closing as a drop.
        connection.onreconnecting(() => {
            if (!disposed) setStatus("reconnecting");
        });
        connection.onreconnected(() => {
            if (disposed) return;

            setStatus("live");

            // Presence moved while we were away and no event was delivered to us: resync from the
            // server rather than trusting what the caches held when the socket dropped.
            queryClient.invalidateQueries({
                queryKey: queryKeys.conversations(),
            });
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
            connection.off(PRESENCE_CHANGED_EVENT);
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
