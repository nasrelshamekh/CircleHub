import { useChatConnection } from "@/hooks/useChatConnection";

// "connecting" and "live" are the quiet, expected states; only a link that needs attention is surfaced.
const LABELS = {
    reconnecting: "Reconnecting…",
    offline: "Live updates paused",
};

export default function ChatConnectionStatus() {
    const { status } = useChatConnection();
    const label = LABELS[status];

    if (!label) return null;

    return (
        <span
            role="status"
            className="type-label-sm inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface-container) px-3 py-1 text-secondary"
        >
            <span className="size-1.5 animate-pulse rounded-full bg-(--primary)" />
            {label}
        </span>
    );
}
