import { useNotifications } from "@/hooks/useNotifications";

export function useUnreadNotifications() {
    // Shares the feed query with the notifications page: React Query keys the cache, so the bell and the
    // page can never show two different totals.
    return useNotifications().unreadCount;
}
