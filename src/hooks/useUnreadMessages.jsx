import { useConversations } from "@/hooks/useConversations";

// Total unread messages across every conversation, for the badges on the
// navbar icon and the sidebar's Messages row. Reads the inbox's query, so it
// shares its cache entry and costs no extra request.
export function useUnreadMessages() {
    const { conversations } = useConversations();

    return conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0
    );
}
