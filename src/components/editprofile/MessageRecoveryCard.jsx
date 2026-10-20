import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Key, KeyRound, LoaderCircle, RefreshCw, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

import RecoveryRestoreDialog from "@/components/messages/RecoveryRestoreDialog";
import RecoverySetupDialog from "@/components/messages/RecoverySetupDialog";
import { getBackupInfo, removeBackup } from "@/services/keyRecovery";

export default function MessageRecoveryCard() {
    const [backup, setBackup] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRemoving, setIsRemoving] = useState(false);
    const [setupOpen, setSetupOpen] = useState(false);
    const [restoreOpen, setRestoreOpen] = useState(false);

    const refreshStatus = () => {
        setIsLoading(true);
        getBackupInfo()
            .then((data) => setBackup(data))
            .catch(() => setBackup(null))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        let live = true;

        getBackupInfo()
            .then((data) => {
                if (live) setBackup(data);
            })
            .catch(() => {
                if (live) setBackup(null);
            })
            .finally(() => {
                if (live) setIsLoading(false);
            });

        return () => {
            live = false;
        };
    }, []);

    async function handleRemove() {
        if (!window.confirm("Are you sure you want to remove your message recovery backup? If you lose access to this device, old messages cannot be recovered.")) {
            return;
        }

        setIsRemoving(true);
        try {
            await removeBackup();
            setBackup(null);
            localStorage.removeItem("circlehub-recovery-restored");
            localStorage.removeItem("circlehub-recovery-prompt-dismissed");
            toast.success("Recovery backup removed");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Could not remove recovery backup"
            );
        } finally {
            setIsRemoving(false);
        }
    }

    return (
        <section className="content-card-padded">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="type-title-lg text-primary">Message Recovery (E2EE)</h2>
                        <p className="type-body-sm mt-1 text-secondary">
                            Protect and sync your encrypted chat history across devices with a 12-word recovery phrase.
                        </p>
                    </div>

                    {!isLoading && (
                        <div className="flex items-center gap-2">
                            {backup ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck size={14} />
                                    Recovery active
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                    <ShieldAlert size={14} />
                                    Not configured
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-secondary">
                        <LoaderCircle size={18} className="animate-spin text-(--primary)" />
                        <span>Checking recovery status…</span>
                    </div>
                ) : backup ? (
                    <div className="flex flex-col gap-4">
                        <div className="rounded-xl bg-(--surface-low) p-4 text-sm">
                            <p className="font-medium text-primary">Your recovery backup is active</p>
                            <p className="mt-1 text-secondary">
                                Encrypted key backup saved on{" "}
                                {backup.updatedAt
                                    ? format(new Date(backup.updatedAt), "PPP 'at' p")
                                    : "your account"}
                                . You can use your 12-word phrase anytime on a new device to unlock your message history.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setRestoreOpen(true)}
                                className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-low) px-4 py-2.5 text-sm font-medium text-primary hover:bg-(--surface-high)"
                            >
                                <KeyRound size={16} />
                                <span>Unlock on this device</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSetupOpen(true)}
                                className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-low) px-4 py-2.5 text-sm font-medium text-primary hover:bg-(--surface-high)"
                            >
                                <RefreshCw size={16} />
                                <span>Regenerate phrase</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={isRemoving}
                                className="flex items-center gap-2 rounded-xl border border-rose-500/20 px-4 py-2.5 text-sm font-medium text-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                            >
                                {isRemoving ? (
                                    <LoaderCircle size={16} className="animate-spin" />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                                <span>Remove backup</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="rounded-xl border border-dashed border-(--border) p-5 text-sm">
                            <div className="flex items-start gap-3">
                                <Key className="mt-0.5 shrink-0 text-(--primary)" size={20} />
                                <div className="space-y-1">
                                    <p className="font-medium text-primary">No recovery phrase set up</p>
                                    <p className="text-secondary leading-relaxed">
                                        End-to-end encryption keys exist only in this browser profile. If you clear
                                        site data or sign in from a new machine, past messages will be unreadable.
                                        Setting up a 12-word recovery phrase protects your history without letting the
                                        server read your messages.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={() => setSetupOpen(true)}
                                className="button-primary flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium"
                            >
                                <Key size={16} />
                                <span>Set Up Recovery Phrase</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <RecoverySetupDialog
                open={setupOpen}
                onOpenChange={setSetupOpen}
                onSuccess={refreshStatus}
            />

            <RecoveryRestoreDialog
                open={restoreOpen}
                onOpenChange={setRestoreOpen}
                onSuccess={refreshStatus}
            />
        </section>
    );
}
