import { toast } from "sonner";

import MessageToast from "@/components/messages/MessageToast";
import { MESSAGE_TOASTER_ID } from "@/lib/messageToast";
import { notificationLink, notificationSentence } from "@/lib/notificationCopy";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { markNotificationRead } from "@/services/notificationApi";
import router from "@/routes/router";

// Same duration and stack as a message toast: the card reads like one because it *is* one — same component,
// same corner, same lifetime. Sonner renders it in the toaster whose id matches, so it sits with the
// message cards rather than in the error stack.
const TOAST_DURATION_MS = 6_000;

/**
 * True when a toast is the only thing that can tell the reader a notification arrived. The feed page
 * already shows the row and its own count, so nothing is raised there — the same rule the message toast
 * applies to /messages. Read at event time, from the provider above the router.
 */
export function shouldToastNotification() {
    return !window.location.pathname.startsWith("/notifications");
}

/**
 * Raises "someone did something" in the corner as a card that opens the row's target when clicked. A row
 * with nothing left to open (a post that vanished, a community that is gone) still toasts — the click then
 * just marks it read and dismisses, because there is nowhere to go and the information itself was the
 * point.
 */
export function showNotificationToast(notification) {
    if (!notification?.id) return;

    // Keyed by the notification, so a repeated event replaces its own card instead of stacking a second,
    // and so the click handler can dismiss the card it belongs to.
    const toastId = `notification-${notification.id}`;
    const link = notificationLink(notification);

    const open = () => {
        toast.dismiss(toastId);

        // Seeing the card *is* reading the notification: mark the row behind it so the badge does not keep
        // asking about something the reader has already dealt with. Fire-and-forget — the POST survives the
        // router navigation below, and a failure just leaves the badge where it was, the same rule as a
        // failed seen-stamp. The invalidation refetches pill, bell and sidebar from the server; nothing is
        // patched by hand.
        if (notification.unread) {
            markNotificationRead(notification.id)
                .then(() =>
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.notifications(),
                    })
                )
                .catch(() => {});
        }

        if (link) router.navigate(link);
    };

    toast(
        <MessageToast
            name={notification.actor?.name ?? "New notification"}
            avatarUrl={notification.actor?.avatarUrl}
            preview={notificationSentence(notification)}
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
