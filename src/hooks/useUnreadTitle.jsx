import { useEffect } from "react";

import { useUnreadMessages } from "@/hooks/useUnreadMessages";

const BASE_TITLE = "CircleHub";

/**
 * Mirrors the unread total into the tab title so a message that arrives while another tab is focused is
 * still visible. Only mounted inside the signed-in layout: the conversations query has no auth guard.
 */
export function useUnreadTitle() {
    const unreadCount = useUnreadMessages();

    useEffect(() => {
        document.title =
            unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE;
    }, [unreadCount]);
}
