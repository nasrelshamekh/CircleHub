import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

// Event the API raises for a message addressed to us (ChatHub.ReceiveMessageMethod).
export const RECEIVE_MESSAGE_EVENT = "ReceiveEncryptedMessage";

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
