import { useEffect, useRef, useState } from "react";
import { Send, Smile } from "lucide-react";
import { toast } from "sonner";

import EmojiPicker from "./EmojiPicker";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { useTypingBroadcast } from "@/hooks/useTypingBroadcast";
import { MAX_PLAINTEXT_LENGTH } from "@/services/messageCrypto";

export default function MessageComposer({
    recipientId,
    recipientUsername,
    onOptimisticMessage,
    retryText,
    onRetryHandled,
}) {
    const [text, setText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef(null);
    const sendMessage = useSendMessage();
    const { reportTyping, stopTyping } = useTypingBroadcast(recipientId);

    function adjustHeight() {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = "auto";
        const scrollH = textarea.scrollHeight;
        const targetHeight = Math.min(Math.max(scrollH, 42), 160);
        textarea.style.height = `${targetHeight}px`;
    }

    function handleChange(event) {
        setText(event.target.value);
        adjustHeight();
        reportTyping();
    }

    function handleKeyDown(event) {
        // Enter without Shift sends the message; Shift + Enter creates a line break
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendContent(text);
        }
    }

    function handleSelectEmoji(emoji) {
        const textarea = textareaRef.current;
        if (!textarea) {
            setText((prev) => prev + emoji);
            reportTyping();
            return;
        }

        const start = textarea.selectionStart ?? text.length;
        const end = textarea.selectionEnd ?? text.length;
        const next = text.slice(0, start) + emoji + text.slice(end);

        setText(next);
        reportTyping();

        requestAnimationFrame(() => {
            adjustHeight();
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = start + emoji.length;
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        });
    }

    function sendContent(contentToSend) {
        const content = contentToSend.trim();

        if (!content) return;

        // Immediately clear the composer input and reset height optimistically
        setText("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "42px";
        }

        // Sent before the request: the message arriving is the real "I'm done", so leaving the claim up
        // would keep the other end waiting for it to expire while the message sits in their thread.
        stopTyping();
        setShowEmojiPicker(false);

        const optimisticId = `pending-${Date.now()}`;

        onOptimisticMessage?.({
            id: optimisticId,
            content,
            createdAt: new Date().toISOString(),
            isMine: true,
            pending: true,
            failed: false,
        });

        sendMessage.mutate(
            { recipientUsername, content },
            {
                onSuccess: (result) => {
                    onOptimisticMessage?.({
                        ...result.data.message,
                        pending: false,
                        failed: false,
                    });
                },
                onError: (error) => {
                    onOptimisticMessage?.({
                        id: optimisticId,
                        content,
                        createdAt: new Date().toISOString(),
                        isMine: true,
                        pending: false,
                        failed: true,
                    });

                    // A server refusal carries its message; a local failure (crypto, the plaintext
                    // cap) has no response, so say what actually went wrong instead of a generic line.
                    toast.error(
                        error.response?.data?.message ||
                            (error.response
                                ? "Could not send the message"
                                : error.message)
                    );
                },
            }
        );
    }

    function handleSubmit(event) {
        event.preventDefault();
        sendContent(text);
    }

    // Auto-resend when retry is requested
    useEffect(() => {
        if (!retryText) return undefined;

        const timer = setTimeout(() => {
            sendContent(retryText);
            onRetryHandled?.();
        }, 0);

        return () => clearTimeout(timer);
    }, [retryText]); // eslint-disable-line react-hooks/exhaustive-deps

    const isNearLimit = text.length > 2500;

    return (
        <div className="relative border-t border-(--border) bg-(--surface-lowest)">
            {showEmojiPicker && (
                <EmojiPicker
                    onSelect={handleSelectEmoji}
                    onClose={() => setShowEmojiPicker(false)}
                />
            )}

            <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2 p-3"
            >
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    aria-label="Add emoji"
                    className={`flex size-10 shrink-0 mb-0.5 items-center justify-center rounded-full transition-colors ${
                        showEmojiPicker
                            ? "bg-(--surface-high) text-(--primary)"
                            : "text-secondary hover:bg-(--surface-low) hover:text-primary"
                    }`}
                >
                    <Smile size={20} />
                </button>

                <div className="relative flex min-w-0 flex-1 flex-col justify-center">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={text}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a message..."
                        aria-label="Message"
                        maxLength={MAX_PLAINTEXT_LENGTH}
                        style={{ height: "42px" }}
                        className={`input-surface type-body-sm min-w-0 w-full resize-none overflow-y-auto rounded-2xl border border-(--border) px-4 py-2.5 leading-relaxed focus:outline-none ${
                            isNearLimit ? "pr-24" : ""
                        }`}
                    />

                    {isNearLimit && (
                        <span
                            className={`pointer-events-none absolute right-3 bottom-2.5 select-none text-[11px] tabular-nums ${
                                text.length > 3800
                                    ? "font-semibold text-rose-500"
                                    : "text-secondary"
                            }`}
                        >
                            {text.length} / {MAX_PLAINTEXT_LENGTH}
                        </span>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!text.trim()}
                    aria-label="Send message"
                    className="flex size-10 shrink-0 mb-0.5 items-center justify-center rounded-full bg-(--primary) text-(--on-primary) transition-colors disabled:bg-(--surface-highest) disabled:text-(--text-secondary)"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
