/**
 * The one place the typing wording lives. The caller supplies the typography, never the colour, so the
 * thread header and the conversation list cannot drift apart — the same deal as `PresenceLabel`.
 */
export default function TypingLabel({ className = "" }) {
    return (
        <span className={`${className} font-medium text-(--primary)`}>
            typing…
        </span>
    );
}
