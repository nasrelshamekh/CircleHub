import { useState } from "react";
import { AlertTriangle, Check, Copy, Key, LoaderCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { initializeRecovery } from "@/services/keyRecovery";

export default function RecoverySetupDialog({ open, onOpenChange, onSuccess }) {
    const [step, setStep] = useState("intro"); // 'intro' | 'generating' | 'display'
    const [phrase, setPhrase] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    function handleOpenChange(nextOpen) {
        if (!nextOpen) {
            // Reset state on close
            setStep("intro");
            setPhrase("");
            setConfirmed(false);
            setIsCopied(false);
            setIsGenerating(false);
        }
        onOpenChange(nextOpen);
    }

    async function handleStart() {
        setIsGenerating(true);
        setStep("generating");
        try {
            const result = await initializeRecovery();
            setPhrase(result.phrase);
            setStep("display");
            // The backup was created from this browser's own key, so it already reads its history:
            // the sign-in unlock prompt must never fire here.
            localStorage.setItem("circlehub-recovery-prompt-dismissed", "true");
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                    error.message ||
                    "Failed to generate recovery phrase"
            );
            setStep("intro");
        } finally {
            setIsGenerating(false);
        }
    }

    async function handleCopy() {
        if (!phrase) return;
        try {
            await navigator.clipboard.writeText(phrase);
            setIsCopied(true);
            toast.success("Recovery phrase copied to clipboard");
            setTimeout(() => setIsCopied(false), 2500);
        } catch {
            toast.error("Could not copy phrase to clipboard");
        }
    }

    function handleFinish() {
        if (!confirmed) return;
        toast.success("Recovery phrase configured successfully");
        onSuccess?.();
        handleOpenChange(false);
    }

    const words = phrase ? phrase.split(" ") : [];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="content-card max-h-[calc(100vh-2rem)] max-w-lg overflow-y-auto text-primary">
                <DialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-(--surface-low) text-(--primary)">
                        <Key size={24} />
                    </div>
                    <DialogTitle className="mt-2 text-xl font-semibold">
                        {step === "display" ? "Your Recovery Phrase" : "Set Up Message Recovery"}
                    </DialogTitle>
                    <DialogDescription className="text-secondary">
                        {step === "display"
                            ? "Write down or store these 12 words in a safe place. This is the only way to restore your message history on a new device."
                            : "Create a 12-word recovery phrase to keep your encrypted message history safe across devices and browser sessions."}
                    </DialogDescription>
                </DialogHeader>

                {step === "intro" && (
                    <div className="flex flex-col gap-4 py-2">
                        <div className="flex items-start gap-3 rounded-xl bg-(--surface-low) p-4">
                            <ShieldCheck className="mt-0.5 shrink-0 text-(--primary)" size={20} />
                            <div className="text-sm">
                                <p className="font-medium text-primary">End-to-End Encrypted</p>
                                <p className="mt-1 text-secondary">
                                    CircleHub cannot read your messages or recover your phrase. Your recovery
                                    phrase protects your private encryption keys on your own devices.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                            <div className="text-sm">
                                <p className="font-medium">No Password Reset</p>
                                <p className="mt-1 opacity-90">
                                    If you lose your recovery phrase, old encrypted messages cannot be
                                    recovered by anyone.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {step === "generating" && (
                    <div className="flex flex-col items-center justify-center gap-3 py-10">
                        <LoaderCircle className="animate-spin text-(--primary)" size={32} />
                        <p className="text-sm text-secondary">Generating encryption keys and phrase…</p>
                    </div>
                )}

                {step === "display" && (
                    <div className="flex flex-col gap-4 py-2">
                        {/* 12 words grid */}
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {words.map((word, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--surface-lowest) px-3 py-2 text-sm"
                                >
                                    <span className="w-5 select-none font-mono text-xs text-secondary">
                                        {index + 1}.
                                    </span>
                                    <span className="font-mono font-medium text-primary">{word}</span>
                                </div>
                            ))}
                        </div>

                        {/* Copy button */}
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-2 rounded-lg border border-(--border) bg-(--surface-low) py-2.5 text-sm font-medium text-primary hover:bg-(--surface-high)"
                        >
                            {isCopied ? (
                                <>
                                    <Check size={16} className="text-emerald-500" />
                                    <span>Copied to clipboard</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={16} />
                                    <span>Copy phrase</span>
                                </>
                            )}
                        </button>

                        {/* Confirmation checkbox */}
                        <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-xl bg-(--surface-low) p-3 text-sm">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded accent-(--primary)"
                            />
                            <span className="text-secondary">
                                I have written down or saved these 12 words in a safe place. I understand that
                                if I lose them, my message history cannot be recovered.
                            </span>
                        </label>
                    </div>
                )}

                <DialogFooter className="mt-2 sm:justify-between">
                    {step === "intro" ? (
                        <>
                            <button
                                type="button"
                                onClick={() => handleOpenChange(false)}
                                className="rounded-xl px-4 py-2 text-sm font-medium text-secondary hover:text-primary"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleStart}
                                disabled={isGenerating}
                                className="button-primary flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium"
                            >
                                Generate Phrase
                            </button>
                        </>
                    ) : (
                        <div className="flex w-full justify-end">
                            <button
                                type="button"
                                onClick={handleFinish}
                                disabled={!confirmed}
                                className="button-primary flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Done
                            </button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
