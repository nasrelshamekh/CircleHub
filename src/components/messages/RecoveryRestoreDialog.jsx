import { useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, KeyRound, LoaderCircle, Shield } from "lucide-react";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    hasValidChecksum,
    isWellFormedPhrase,
    normalisePhrase,
    restoreRecovery,
} from "@/services/keyRecovery";

export default function RecoveryRestoreDialog({ open, onOpenChange, onSuccess }) {
    const [rawInput, setRawInput] = useState("");
    const [isRestoring, setIsRestoring] = useState(false);
    const [checksumValid, setChecksumValid] = useState(null);
    const [, startTransition] = useTransition();

    const normalized = normalisePhrase(rawInput);
    const words = normalized ? normalized.split(" ") : [];
    const wordCount = words.length;
    const isFullCount = wordCount === 12;

    function handleInput(text) {
        setRawInput(text);
        const norm = normalisePhrase(text);
        const currentWords = norm ? norm.split(" ") : [];

        if (currentWords.length === 12 && isWellFormedPhrase(norm)) {
            startTransition(async () => {
                const valid = await hasValidChecksum(norm);
                setChecksumValid(valid);
            });
        } else {
            setChecksumValid(null);
        }
    }

    function handleOpenChange(nextOpen) {
        if (!nextOpen) {
            setRawInput("");
            setChecksumValid(null);
            setIsRestoring(false);
        }
        onOpenChange(nextOpen);
    }

    async function handleRestore() {
        if (!isFullCount || isRestoring) return;

        setIsRestoring(true);
        try {
            await restoreRecovery(normalized);
            // Mark as restored so prompts don't keep nagging
            localStorage.setItem("circlehub-recovery-restored", "true");
            localStorage.setItem("circlehub-recovery-prompt-dismissed", "true");
            toast.success("Message history unlocked and keys restored");
            onSuccess?.();
            handleOpenChange(false);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Failed to restore message history"
            );
        } finally {
            setIsRestoring(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="content-card max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto text-primary">
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-low) text-(--primary)">
                        <KeyRound size={24} />
                    </div>
                    <DialogTitle className="mt-2 text-xl font-semibold">
                        Enter Recovery Phrase
                    </DialogTitle>
                    <DialogDescription className="text-secondary">
                        Enter your 12-word recovery phrase to unlock your encrypted message history on this device.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="recovery-phrase-input" className="text-sm font-medium text-primary">
                            12-Word Recovery Phrase
                        </label>
                        <textarea
                            id="recovery-phrase-input"
                            rows={3}
                            value={rawInput}
                            onChange={(e) => handleInput(e.target.value)}
                            placeholder="paste or type your 12 words separated by spaces..."
                            className="w-full resize-none rounded-xl border border-(--border) bg-(--surface-low) p-3 font-mono text-sm text-primary placeholder:text-muted focus:border-(--primary) focus:outline-none"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                        />
                    </div>

                    {/* Word status & live feedback */}
                    <div className="flex items-center justify-between text-xs text-secondary">
                        <div className="flex items-center gap-1.5">
                            <span className={wordCount === 12 ? "font-medium text-emerald-500" : ""}>
                                {wordCount} / 12 words
                            </span>
                            {checksumValid === true && (
                                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                                    <CheckCircle2 size={13} /> Valid phrase
                                </span>
                            )}
                            {checksumValid === false && (
                                <span className="flex items-center gap-1 text-rose-500">
                                    <AlertCircle size={13} /> Checksum error (check spelling)
                                </span>
                            )}
                        </div>
                        {wordCount > 0 && (
                            <button
                                type="button"
                                onClick={() => handleInput("")}
                                className="hover:text-primary hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Security note */}
                    <div className="flex items-start gap-2.5 rounded-xl bg-(--surface-low) p-3 text-xs text-secondary">
                        <Shield size={16} className="mt-0.5 shrink-0 text-(--primary)" />
                        <span>
                            Your phrase is processed locally in your browser to derive your device encryption
                            keys. It is never sent to the server in plaintext.
                        </span>
                    </div>
                </div>

                <DialogFooter className="mt-2 sm:justify-between">
                    <button
                        type="button"
                        onClick={() => handleOpenChange(false)}
                        className="rounded-xl px-4 py-2 text-sm font-medium text-secondary hover:text-primary"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleRestore}
                        disabled={wordCount !== 12 || isRestoring}
                        className="button-primary flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isRestoring ? (
                            <>
                                <LoaderCircle size={16} className="animate-spin" />
                                <span>Unlocking…</span>
                            </>
                        ) : (
                            <span>Unlock Messages</span>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
