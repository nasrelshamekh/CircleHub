import { useCallback, useEffect, useRef } from "react";

import { useChatConnection } from "./useChatConnection";

// While keys keep coming the claim is refreshed at most this often. The receiver believes a claim for
// 6s (TYPING_CLAIM_MS), so a 2s refresh leaves room for two lost signals.
const REFRESH_MS = 2_000;

// A pause this long means the user stopped typing. Saying so beats making the other end wait for the
// claim to expire.
const IDLE_MS = 3_000;

/**
 * Reports "I am typing" to the other end of a conversation, throttled so a burst of keystrokes cannot
 * turn into one hub call per character.
 *
 * Nothing here is rendered locally: the signal exists only for the other person's screen, and it is
 * never stored, so a lost one self-heals (the receiver expires it).
 */
export function useTypingBroadcast(recipientId) {
    const { notifyTyping } = useChatConnection();

    const lastReportedRef = useRef(0);
    const idleTimerRef = useRef(null);
    const isTypingRef = useRef(false);

    const stopTyping = useCallback(() => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;

        // Nothing was announced, so there is nothing to take back.
        if (!isTypingRef.current) return;

        isTypingRef.current = false;
        lastReportedRef.current = 0;

        notifyTyping(recipientId, false);
    }, [notifyTyping, recipientId]);

    const reportTyping = useCallback(() => {
        const now = Date.now();

        if (now - lastReportedRef.current >= REFRESH_MS) {
            lastReportedRef.current = now;
            isTypingRef.current = true;

            notifyTyping(recipientId, true);
        }

        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(stopTyping, IDLE_MS);
    }, [notifyTyping, recipientId, stopTyping]);

    // Switching conversation (or leaving the thread) must not leave the other person looking at a claim
    // we never took back; the receiver expires it anyway, this just removes the wait.
    useEffect(() => {
        return () => {
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;

            if (isTypingRef.current) notifyTyping(recipientId, false);

            isTypingRef.current = false;
            lastReportedRef.current = 0;
        };
    }, [notifyTyping, recipientId]);

    return { reportTyping, stopTyping };
}
