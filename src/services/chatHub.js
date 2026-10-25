import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";

// Event the API raises for a message addressed to us (ChatHub.ReceiveMessageMethod).
export const RECEIVE_MESSAGE_EVENT = "ReceiveEncryptedMessage";

// Event the API raises when one of our conversation partners comes online or goes away
// (ChatHub.PresenceChangedMethod).
export const PRESENCE_CHANGED_EVENT = "PresenceChanged";

// Event the API raises while a conversation partner is typing to us (ChatHub.TypingChangedMethod).
export const TYPING_CHANGED_EVENT = "TypingChanged";

// Event the API raises when a new row lands in our notification feed
// (ChatHub.NotificationCreatedMethod). Carries the row as a NotificationDto so the client can chime and
// toast it immediately; the feed is still refetched, because the server stays the source of truth.
export const NOTIFICATION_CREATED_EVENT = "NotificationCreated";

// Event the API raises when a new post is created (ChatHub.PostCreatedMethod).
export const POST_CREATED_EVENT = "PostCreated";

// Hub method we invoke to say that we are (or are no longer) typing (ChatHub.SendTyping).
export const SEND_TYPING_METHOD = "SendTyping";

const HUB_PATH = "/hubs/chat";

// VITE_BASE_URL points at the REST root (e.g. http://localhost:5289/api); the hub is hosted beside it.
export function resolveHubUrl(baseUrl = import.meta.env.VITE_BASE_URL) {
    const trimmed = (baseUrl ?? "").replace(/\/+$/, "");

    return `${trimmed.replace(/\/api$/, "")}${HUB_PATH}`;
}

export function createChatConnection() {
    return (
        new HubConnectionBuilder()
            .withUrl(resolveHubUrl(), {
                // Browsers cannot set an Authorization header on a WebSocket, so the token goes in the
                // query string. It is read on every negotiation, which also covers reconnects.
                accessTokenFactory: () => localStorage.getItem("token") ?? "",
            })
            // The SignalR default gives up after ~30s and then stays silent, which is the wrong default
            // for a chat client, so keep retrying and let a dropped tab recover on its own.
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: () => 10_000,
            })
            .configureLogging(
                import.meta.env.DEV ? LogLevel.Information : LogLevel.Warning
            )
            .build()
    );
}

/**
 * Tells the server that we are (or are no longer) typing to a user.
 *
 * Fire and forget by design: the signal is raised while the user types, so there is no outcome worth
 * reporting, and the server never rejects one (it drops what it will not relay). A connection that is
 * not up yet simply skips it — the next keystroke will try again.
 */
export function sendTyping(connection, recipientId, isTyping) {
    if (!connection || connection.state !== HubConnectionState.Connected) return;

    connection.invoke(SEND_TYPING_METHOD, recipientId, isTyping).catch(() => {});
}
