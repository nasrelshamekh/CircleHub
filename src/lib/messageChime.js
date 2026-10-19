// The incoming-message chime. Kept out of the React tree on purpose: a sound is a side effect on the
// document, not state anything renders from.
const CHIME_URL = "/message-chime.mp3";

// One element for the life of the page, created up front: the first message of a session is exactly the
// one that must not be announced late, and leaving the fetch until then would delay it by a round trip.
// Loading is allowed without a gesture — only playback needs one — and a second element would never help,
// since browsers grant playback permission to the page as a whole.
const chime = typeof Audio === "undefined" ? null : new Audio(CHIME_URL);

/**
 * True when a sound would be the reader's *second* notification: they are looking at that conversation's
 * thread right now — which means the bubble is visibly landing in front of them — in a tab that is both
 * visible and the focused window. Every other case (another page, a background tab, a window that lost
 * focus to another app) leaves the message unseen, and unseen messages get a sound.
 */
export function shouldChime(envelope) {
    if (document.visibilityState !== "visible" || !document.hasFocus()) return true;

    // A pure hub relay carries no conversationId. There is no way to tell whether it belongs to the open
    // thread, and a sound too many beats going quiet on a message the reader never saw.
    if (!envelope?.conversationId) return true;

    // Deliberately the raw URL instead of a router hook: this module is used from a provider that sits
    // above the router, and the question ("what is open?") is only ever asked at event time, so there is
    // nothing to subscribe to.
    return window.location.pathname !== `/messages/${envelope.conversationId}`;
}

/** Plays the chime, silently doing nothing when the browser refuses audio before the first interaction. */
export function playMessageChime() {
    // A chime that is still ringing already covers this arrival. Restarting it would machine-gun a handful
    // of messages that land together.
    if (!chime || !chime.paused) return;

    chime.currentTime = 0;

    // Autoplay policy rejects until the user has interacted with the page; that is a normal first-load
    // state, not an error worth surfacing.
    chime.play().catch(() => {});
}

/** The whole reaction to an incoming envelope: decide, then play. */
export function chimeForIncomingMessage(envelope) {
    if (shouldChime(envelope)) playMessageChime();
}
