import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { useSendMessage } from "@/hooks/mutations/useSendMessage";

export default function MessageComposer({ recipientUsername }) {
    const [text, setText] = useState("");
    const sendMessage = useSendMessage();

    function handleSubmit(event) {
        event.preventDefault();

        const content = text.trim();

        if (!content || sendMessage.isPending) return;

        sendMessage.mutate(
            { recipientUsername, content },
            {
                onSuccess: () => setText(""),
                onError: (error) => {
                    toast.error(
                        error.response?.data?.message ||
                            "Could not send the message"
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
                onChange={(event) => setText(event.target.value)}
                placeholder="Write a message..."
                aria-label="Message"
                maxLength={2000}
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
