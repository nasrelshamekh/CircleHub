import { useChatConnection } from "@/hooks/useChatConnection";

/**
 * The users currently typing to us, keyed by canonical user id. Each value is the moment their claim
 * stops being believable, so it only ever means something through `isTypingNow`.
 */
export function useTypingUsers() {
    return useChatConnection().typingUsers;
}

/**
 * Whether the claim for this user is still fresh. Claims are stamped and swept by the connection
 * provider, which re-renders its consumers whenever one expires.
 */
export function isTypingNow(typingUsers, userId) {
    return Boolean(userId) && (typingUsers?.[userId] ?? 0) > Date.now();
}

/**
 * Whether this user is typing to us right now.
 *
 * The indicator is keyed by the user id the server stamped on the signal, so it only ever renders
 * where that user is on screen (their thread, their row in the list). A claim from anyone else is
 * invisible, which is why no component has to filter one out.
 */
export function useTypingIndicator(userId) {
    return isTypingNow(useTypingUsers(), userId);
}
