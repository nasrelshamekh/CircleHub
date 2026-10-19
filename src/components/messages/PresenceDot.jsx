/**
 * Presence dot pinned to the corner of an avatar. Rendered in both states on purpose: a dot that only
 * appears when someone is online is indistinguishable from "we have no presence information".
 */
export default function PresenceDot({ isOnline }) {
    return (
        <span
            aria-hidden="true"
            className={`absolute right-0 bottom-0 size-2.5 rounded-full ring-2 ring-(--surface-lowest) ${
                isOnline ? "bg-(--presence-online)" : "bg-(--outline)"
            }`}
        />
    );
}
