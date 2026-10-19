import { useConversations } from "@/hooks/useConversations";

export function useUnreadMessages() {
    const { conversations } = useConversations();

    return conversations.reduce(
        (total, conversation) => total + conversation.unreadCount,
        0
    );
}
