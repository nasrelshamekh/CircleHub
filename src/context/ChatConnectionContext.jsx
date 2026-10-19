import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { chatConnectionContext } from "@/hooks/useChatConnection";
import {
    createChatConnection,
    PRESENCE_CHANGED_EVENT,
    RECEIVE_MESSAGE_EVENT,
    sendTyping,
    TYPING_CHANGED_EVENT,
} from "@/services/chatHub";
import { chimeForIncomingMessage } from "@/lib/messageChime";
import { shouldToast, showMessageToast } from "@/lib/messageToast";
import { queryKeys } from "@/lib/queryKeys";

// `withAutomaticReconnect` only recovers a connection that was established once, so a tab opened while the
// API is unreachable needs its own retry loop.
const CONNECT_RETRY_MS = 5_000;

// How long a "typing" claim is believed on its own. The sender refreshes every 2s while keys keep coming,
// so this survives two dropped refreshes and is what clears the indicator when the "stopped" signal is
// lost to a dropped connection.
const TYPING_CLAIM_MS = 6_000;

// How often expired claims are swept. A sweep only re-renders when something actually expired.
const TYPING_SWEEP_MS = 1_000;

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
 * Removes a user's typing claim. Returns its input untouched when there was nothing to drop, so a
 * "stopped" signal for someone who was never shown as typing costs nothing.
 */
function dropTypingClaim(typingUsers, userId) {
    if (!userId || !(userId in typingUsers)) return typingUsers;

    const next = { ...typingUsers };
    delete next[userId];

    return next;
}

/**
 * The conversation a sender belongs to, read straight from the cached list. Null when the list has never
 * been loaded in this session, which costs a toast its name and avatar but never the message itself.
 */
function findConversationByPartner(queryClient, senderId) {
    const conversations = queryClient.getQueryData(queryKeys.conversations());

    if (!senderId || !Array.isArray(conversations)) return null;

    return (
        conversations.find(
            (conversation) => conversation.otherUser?.id === senderId
        ) ?? null
    );
}

/**
 * Keeps a SignalR connection open for the signed-in session and exposes its state, so the UI can tell the
 * user when real-time delivery is not available instead of silently going quiet.
 */
export default function ChatConnectionContextProvider({ children }) {
    const { userData } = useAuth();
    const queryClient = useQueryClient();
    const [status, setStatus] = useState("connecting");
    const [typingUsers, setTypingUsers] = useState({});

    // Held in a ref rather than in state: components need to *call* the connection, and a connection that
    // changes identity is never a reason to re-render the app.
    const connectionRef = useRef(null);

    const isAuthenticated = Boolean(userData);

    useEffect(() => {
        if (!isAuthenticated) return undefined;

        let disposed = false;
        let retryTimer = null;
        let connecting = false;
        const connection = createChatConnection();

        connectionRef.current = connection;

        connection.on(RECEIVE_MESSAGE_EVENT, (message) => {
            // The sound is for a message the reader cannot see landing: it stays quiet while they are
            // looking at that very thread with the tab in front.
            chimeForIncomingMessage(message);

            // Away from the messages page there is nothing on screen that would say a message arrived, so
            // the same event also gets a card in the corner. Its title and avatar come from the cached
            // conversation list, which the layout keeps loaded for the unread badge.
            if (shouldToast()) {
                const sender = findConversationByPartner(
                    queryClient,
                    message?.senderId
                );

                showMessageToast({
                    messageId: message?.messageId,
                    conversationId: message?.conversationId ?? sender?.id,
                    sender: sender?.otherUser,
                    preview: message?.encryptedPayload,
                });
            }

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

        connection.on(TYPING_CHANGED_EVENT, (typing) => {
            // Stored as a deadline rather than a flag: the sender only refreshes the claim while keys keep
            // coming, so an unrefreshed claim has to expire by itself (the sweep below), and an explicit
            // "stopped" just clears it sooner. Nothing here is app data, so no cache and no refetch.
            setTypingUsers((current) =>
                typing?.isTyping
                    ? { ...current, [typing.userId]: Date.now() + TYPING_CLAIM_MS }
                    : dropTypingClaim(current, typing?.userId)
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

            connectionRef.current = null;
            connection.off(RECEIVE_MESSAGE_EVENT);
            connection.off(PRESENCE_CHANGED_EVENT);
            connection.off(TYPING_CHANGED_EVENT);
            connection.stop().catch(() => {});

            // A claim belongs to the session that received it: the next one must not open on someone
            // else's "typing…".
            setTypingUsers({});
        };
    }, [isAuthenticated, queryClient]);

    const hasTypingUsers = Object.keys(typingUsers).length > 0;

    // The sweep is what takes a "typing…" away when the sender's "stopped" signal never arrives (a dropped
    // connection, a killed tab). It runs only while there is a claim to expire, and the updater returns its
    // input untouched when nothing expired, so a sender who keeps refreshing costs no re-render.
    useEffect(() => {
        if (!hasTypingUsers) return undefined;

        const timer = setInterval(() => {
            const now = Date.now();

            setTypingUsers((current) => {
                const live = Object.entries(current).filter(
                    ([, expiresAt]) => expiresAt > now
                );

                return live.length === Object.keys(current).length
                    ? current
                    : Object.fromEntries(live);
            });
        }, TYPING_SWEEP_MS);

        return () => clearInterval(timer);
    }, [hasTypingUsers]);

    // Safe to be stable: everything it touches is read at call time (an event handler, never a render).
    const notifyTyping = useCallback(
        (recipientId, isTyping) =>
            sendTyping(connectionRef.current, recipientId, isTyping),
        []
    );

    // Reported rather than reset from the effect: a signed-out session has nothing to connect, and the
    // connection is torn down by the cleanup.
    const value = useMemo(
        () => ({
            status: isAuthenticated ? status : "idle",
            typingUsers,
            notifyTyping,
        }),
        [isAuthenticated, status, typingUsers, notifyTyping]
    );

    return (
        <chatConnectionContext.Provider value={value}>
            {children}
        </chatConnectionContext.Provider>
    );
}
