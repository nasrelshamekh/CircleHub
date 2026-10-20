import { useEffect, useState } from "react";

import {
    decryptMessageContent,
    isEncryptedContent,
    peekDecrypted,
} from "@/services/messageCrypto";

/**
 * Renders a message body: plaintext (including a post-only fallback string) passes straight through,
 * ciphertext resolves through WebCrypto once and is then served from the module cache. The first paint
 * of an encrypted body is empty for the sub-millisecond round trip rather than showing the envelope.
 */
export function useDecryptedContent(content) {
    const encrypted = isEncryptedContent(content);
    // Nothing but ciphertext needs the async path, so that case never touches state at all.
    const [decrypted, setDecrypted] = useState(() => (encrypted ? peekDecrypted(content) ?? "" : ""));

    useEffect(() => {
        if (!encrypted) return undefined;

        let live = true;
        decryptMessageContent(content).then((plaintext) => {
            if (live) setDecrypted(plaintext);
        });

        return () => {
            live = false;
        };
    }, [content, encrypted]);

    return encrypted ? decrypted : content ?? "";
}
