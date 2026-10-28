import { useEffect, useState } from "react";
import { toast } from "sonner";

import RecoveryRestoreDialog from "@/components/messages/RecoveryRestoreDialog";
import { useAuth } from "@/hooks/useAuth";
import { hasBackup } from "@/services/keyRecovery";
import { clearDeviceKeyCache, ensureDeviceKey } from "@/services/messageCrypto";

/**
 * Gives this browser an encryption keypair for messages, once per signed-in session. Mounted inside the
 * auth provider so it runs before (and independently of) any particular conversation being opened — the
 * key must exist before someone sends, not before they read.
 *
 * Also checks if the user has a recovery phrase backup on the server, and prompts them on first sign-in
 * to enter their phrase to restore and sync past message history on this browser.
 */
export default function DeviceKeyPublisher() {
    const { userData } = useAuth();
    const username = userData?.username;
    const [restoreOpen, setRestoreOpen] = useState(false);

    useEffect(() => {
        if (!username) {
            clearDeviceKeyCache();
            return undefined;
        }

        let live = true;

        ensureDeviceKey()
            .then(async () => {
                if (!live) return;

                const dismissed = localStorage.getItem("circlehub-recovery-prompt-dismissed");
                const restored = localStorage.getItem("circlehub-recovery-restored");

                if (!dismissed && !restored) {
                    try {
                        const backupExists = await hasBackup();
                        if (live && backupExists) {
                            toast("Message Recovery Available", {
                                description:
                                    "Enter your 12-word recovery phrase to unlock past messages on this device.",
                                action: {
                                    label: "Unlock",
                                    onClick: () => setRestoreOpen(true),
                                },
                                cancel: {
                                    label: "Later",
                                    onClick: () =>
                                        localStorage.setItem(
                                            "circlehub-recovery-prompt-dismissed",
                                            "true"
                                        ),
                                },
                                duration: 10000,
                            });
                        }
                    } catch {
                        // Silent catch: network or policy failures during background check must not disrupt session
                    }
                }
            })
            .catch((error) => {
                if (live) {
                    console.warn("Device key publish failed; messages will go unencrypted", error);
                }
            });

        return () => {
            live = false;
        };
    }, [username]);

    return (
        <RecoveryRestoreDialog
            open={restoreOpen}
            onOpenChange={setRestoreOpen}
        />
    );
}
