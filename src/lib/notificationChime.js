// The incoming-notification chime. Same shape as messageChime.js and kept out of the React tree for the
// same reason: a sound is a side effect on the document, not state anything renders from.
const CHIME_URL = "/notification-chime.wav";

// One element for the life of the page, created up front: a notification arriving the moment the app opens
// is exactly the one that must not be announced late. WAV instead of MP3 because this is the file the owner
// picked, and 226 KB of uncompressed audio is the budget to keep in on every page load.
const chime = typeof Audio === "undefined" ? null : new Audio(CHIME_URL);

/**
 * True when a sound would be the reader's *second* notification: the feed is open right now — the row is
 * visibly landing in the list — in a tab that is both visible and the focused window. Every other case
 * (another page, a background tab, a window that lost focus to another app) leaves the notification unseen,
 * and unseen notifications get a sound. Read at event time, like the message chime: this is called from a
 * provider that sits above the router, and there is nothing to subscribe to.
 */
export function shouldChimeNotification() {
    if (document.visibilityState !== "visible" || !document.hasFocus()) return true;

    return !window.location.pathname.startsWith("/notifications");
}

/** Plays the chime, silently doing nothing when the browser refuses audio before the first interaction. */
export function playNotificationChime() {
    // A chime that is still ringing already covers this arrival; restarting it would machine-gun a burst
    // of notifications that land together.
    if (!chime || !chime.paused) return;

    chime.currentTime = 0;

    // Autoplay policy rejects until the user has interacted with the page; that is a normal first-load
    // state, not an error worth surfacing.
    chime.play().catch(() => {});
}

/** The whole reaction to an incoming notification: decide, then play. */
export function chimeForIncomingNotification() {
    if (shouldChimeNotification()) playNotificationChime();
}
