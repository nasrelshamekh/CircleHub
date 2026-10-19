import { toast } from "sonner";

import MessageToast from "@/components/messages/MessageToast";
import router from "@/routes/router";

// Message toasts get their own sonner stack, pinned to the other corner from the app's error toasts. Sonner
// renders a toast only in the toaster whose id it was created with, so the two never mix or share a stack.
export const MESSAGE_TOASTER_ID = "messages";

// Long enough to read a sentence and decide to click it, short enough that a busy conversation cannot bury
// the page under cards. Messages that arrive together stack instead of covering each other.
const TOAST_DURATION_MS = 6_000;

/**
 * True when a toast is the only thing that can tell the reader a message arrived. The messages page already
 * shows the conversation list, the preview inside it and the unread badge, so nothing is raised there.
 */
export function shouldToast() {
    // Read at event time, like the chime: this is called from a provider that sits above the router, and
    // nothing here needs to react to navigation.
    return !window.location.pathname.startsWith("/messages");
}

/**
 * Raises "someone messaged you" in the corner as a card that opens the conversation when clicked.
 *
 * A message with no conversation to open is dropped: there is nothing for the click to do, and the count on
 * the messages icon is what the reader will follow instead.
 */
export function showMessageToast({
    messageId,
    conversationId,
    sender,
    preview,
}) {
    if (!conversationId) return;

    // Keyed by the message so a repeated envelope replaces its own card instead of stacking a second one,
    // and so the click handler can dismiss the card it belongs to.
    const toastId = `message-${messageId ?? conversationId}`;

    const open = () => {
        toast.dismiss(toastId);
        router.navigate(`/messages/${conversationId}`);
    };

    toast(
        <MessageToast
            name={sender?.name ?? "New message"}
            avatarUrl={sender?.avatarUrl}
            preview={preview}
            onOpen={open}
        />,
        {
            id: toastId,
            toasterId: MESSAGE_TOASTER_ID,
            position: "bottom-right",
            duration: TOAST_DURATION_MS,
        }
    );
}
