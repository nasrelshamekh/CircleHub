import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { useTypingBroadcast } from "@/hooks/useTypingBroadcast";
import { MAX_PLAINTEXT_LENGTH } from "@/services/messageCrypto";

export default function MessageComposer({
    recipientId,
    recipientUsername,
    onOptimisticMessage,
}) {
    const [text, setText] = useState("");
    const sendMessage = useSendMessage();
    const { reportTyping, stopTyping } = useTypingBroadcast(recipientId);

    function handleChange(event) {
        setText(event.target.value);
        reportTyping();
    }

    function handleSubmit(event) {
        event.preventDefault();

        const content = text.trim();

        if (!content || sendMessage.isPending) return;

        // Sent before the request: the message arriving is the real "I'm done", so leaving the claim up
        // would keep the other end waiting for it to expire while the message sits in their thread.
        stopTyping();

        // Rendered by the thread right away so the message does not wait for the round trip; the stored
        // message replaces it as soon as the thread next loads.
        onOptimisticMessage?.({
            id: `pending-${Date.now()}`,
            content,
            createdAt: new Date().toISOString(),
            isMine: true,
            pending: true,
        });

        sendMessage.mutate(
            { recipientUsername, content },
            {
                onSuccess: (result) => {
                    setText("");
                    onOptimisticMessage?.({
                        ...result.data.message,
                        pending: false,
                    });
                },
                onError: (error) => {
                    onOptimisticMessage?.(null);

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

    return (
        <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-(--border) bg-(--surface-lowest) p-3"
        >
            <input
                value={text}
                onChange={handleChange}
                placeholder="Write a message..."
                aria-label="Message"
                maxLength={MAX_PLAINTEXT_LENGTH}
                className="input-surface type-body-sm min-w-0 flex-1 rounded-full border border-(--border) px-4 py-2.5"
            />

            <button
                type="submit"
                disabled={!text.trim() || sendMessage.isPending}
                aria-label="Send message"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--primary) text-(--on-primary) transition-colors disabled:bg-(--surface-highest) disabled:text-(--text-secondary)"
            >
                <Send size={18} />
            </button>
        </form>
    );
}
