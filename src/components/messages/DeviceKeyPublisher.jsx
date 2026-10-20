import { useEffect } from "react";

import { useAuth } from "@/hooks/useAuth";
import { ensureDeviceKey } from "@/services/messageCrypto";

/**
 * Gives this browser an encryption keypair for messages, once per signed-in session. Mounted inside the
 * auth provider so it runs before (and independently of) any particular conversation being opened — the
 * key must exist before someone sends, not before they read.
 *
 * Deliberately silent: a failure here only means messages go out in plaintext (the roll-out fallback),
 * and there is no action the reader could take about it, so nothing is toasted and nothing is retried —
 * the send path calls `ensureDeviceKey` again anyway when it actually has something to encrypt.
 */
export default function DeviceKeyPublisher() {
    const { userData } = useAuth();
    const username = userData?.username;

    useEffect(() => {
        if (!username) return undefined;

        let live = true;

        ensureDeviceKey().catch((error) => {
            if (live) console.warn("Device key publish failed; messages will go unencrypted", error);
        });

        return () => {
            live = false;
        };
    }, [username]);

    return null;
}
