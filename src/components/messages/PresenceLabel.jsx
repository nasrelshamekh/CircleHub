import { useEffect, useState } from "react";

import { formatLastSeen } from "@/lib/formatDate";

// "Last seen 12 minutes ago" only moves once a minute, so a re-render is all it takes to keep it honest
// while the reader is looking at it. Nothing ticks while the other person is online.
const TICK_MS = 60_000;

/**
 * The one place the presence wording lives: green "Online", or "Last seen …" / "Offline" otherwise.
 * The caller supplies the typography, never the colour, so the two states stay recognisable everywhere.
 */
export default function PresenceLabel({ isOnline, lastSeenAt, className = "" }) {
    const isRelative = !isOnline && Boolean(lastSeenAt);
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!isRelative) return undefined;

        const timer = setInterval(() => setTick((tick) => tick + 1), TICK_MS);

        return () => clearInterval(timer);
    }, [isRelative]);

    if (isOnline) {
        return (
            <span className={`${className} font-medium text-(--presence-online)`}>
                Online
            </span>
        );
    }

    // "Offline" rather than a blank line: a user we have never seen connect has no last-seen time, and
    // saying so is clearer than leaving the row looking unfinished.
    return (
        <span className={`${className} text-secondary`}>
            {lastSeenAt ? formatLastSeen(lastSeenAt) : "Offline"}
        </span>
    );
}
