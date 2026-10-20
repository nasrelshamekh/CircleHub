import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquarePlus, Search, Send } from "lucide-react";
import { toast } from "sonner";

import Avatar from "@/components/profileimages/Avatar";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useMessageRecipients } from "@/hooks/useMessageRecipients";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { MAX_PLAINTEXT_LENGTH } from "@/services/messageCrypto";

export default function NewMessageDialog({
    open,
    onOpenChange,
    conversations = [],
}) {
    const navigate = useNavigate();
    const { recipients, isLoading } = useMessageRecipients({ enabled: open });
    const sendMessage = useSendMessage();

    const [search, setSearch] = useState("");
    const [selectedRecipient, setSelectedRecipient] = useState(null);
    const [firstMessage, setFirstMessage] = useState("");

    const existingByUserId = useMemo(() => {
        const map = new Map();
        for (const conv of conversations) {
            if (conv.otherUser?.id) {
                map.set(conv.otherUser.id, conv.id);
            }
        }
        return map;
    }, [conversations]);

    const filteredRecipients = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return recipients;
        return recipients.filter(
            (r) =>
                r.name?.toLowerCase().includes(q) ||
                r.username?.toLowerCase().includes(q)
        );
    }, [recipients, search]);

    function handleOpenChange(nextOpen) {
        if (!nextOpen) {
            setSearch("");
            setSelectedRecipient(null);
            setFirstMessage("");
        }
        onOpenChange(nextOpen);
    }

    function handleSelectRecipient(recipient) {
        if (!recipient.canMessage) return;

        const existingConversationId = existingByUserId.get(recipient.id);
        if (existingConversationId) {
            handleOpenChange(false);
            navigate(`/messages/${existingConversationId}`);
            return;
        }

        setSelectedRecipient(recipient);
    }

    function handleSendFirstMessage(event) {
        event.preventDefault();
        const content = firstMessage.trim();
        if (!selectedRecipient || !content || sendMessage.isPending) return;

        sendMessage.mutate(
            {
                recipientUsername: selectedRecipient.username,
                content,
            },
            {
                onSuccess: (response) => {
                    const conversationId = response?.data?.conversationId;
                    handleOpenChange(false);
                    if (conversationId) {
                        navigate(`/messages/${conversationId}`);
                    }
                },
                onError: (error) => {
                    toast.error(
                        error.response?.data?.message ||
                            (error.response
                                ? "Could not start the conversation"
                                : error.message)
                    );
                },
            }
        );
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="content-card max-h-[calc(100vh-2rem)] overflow-y-auto text-primary sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {selectedRecipient ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedRecipient(null);
                                    setFirstMessage("");
                                }}
                                aria-label="Back to people"
                                className="icon-button -ml-1 rounded-full p-1"
                            >
                                <ArrowLeft size={18} />
                            </button>
                        ) : (
                            <MessageSquarePlus
                                size={18}
                                className="text-(--primary)"
                            />
                        )}
                        {selectedRecipient
                            ? `Message ${selectedRecipient.name}`
                            : "New Message"}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedRecipient
                            ? `Send an end-to-end encrypted message to @${selectedRecipient.username}.`
                            : "Choose someone from your network to open or start a conversation."}
                    </DialogDescription>
                </DialogHeader>

                {selectedRecipient ? (
                    <form
                        onSubmit={handleSendFirstMessage}
                        className="flex flex-col gap-4 pt-2"
                    >
                        <div className="flex items-center gap-3 rounded-xl bg-(--surface-low) p-3">
                            <Avatar
                                src={selectedRecipient.avatarUrl}
                                alt={selectedRecipient.name}
                                className="avatar-md shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="type-label-md truncate text-primary">
                                    {selectedRecipient.name}
                                </p>
                                <p className="type-body-sm truncate text-secondary">
                                    @{selectedRecipient.username}
                                </p>
                            </div>
                        </div>

                        <textarea
                            rows={3}
                            value={firstMessage}
                            onChange={(e) => setFirstMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendFirstMessage(e);
                                }
                            }}
                            maxLength={MAX_PLAINTEXT_LENGTH}
                            placeholder={`Write a message to ${selectedRecipient.name}...`}
                            autoFocus
                            className="input-surface type-body-sm w-full resize-none rounded-xl border border-(--border) p-3 focus:outline-none"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => handleOpenChange(false)}
                                className="type-button rounded-full px-4 py-2 text-secondary hover:bg-(--hover)"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    !firstMessage.trim() ||
                                    sendMessage.isPending
                                }
                                className="button-primary flex items-center gap-2 rounded-full px-4 py-2 disabled:opacity-50"
                            >
                                <Send size={16} />
                                {sendMessage.isPending ? "Sending…" : "Send"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-3 pt-1">
                        <div className="relative flex items-center">
                            <Search
                                size={16}
                                className="pointer-events-none absolute left-3.5 text-secondary"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search people by name or @username..."
                                aria-label="Search people"
                                className="input-surface type-body-sm w-full rounded-full border border-(--border) py-2 pr-4 pl-9"
                            />
                        </div>

                        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
                            {isLoading && (
                                <p className="type-body-sm p-3 text-secondary">
                                    Loading your connections…
                                </p>
                            )}

                            {!isLoading && recipients.length === 0 && (
                                <p className="type-body-sm p-3 text-secondary">
                                    Follow someone, or wait for them to follow
                                    you, to start a conversation.
                                </p>
                            )}

                            {!isLoading &&
                                recipients.length > 0 &&
                                filteredRecipients.length === 0 && (
                                    <p className="type-body-sm p-3 text-secondary">
                                        No connections matching &ldquo;{search}
                                        &rdquo;.
                                    </p>
                                )}

                            {filteredRecipients.map((recipient) => {
                                const hasExisting = existingByUserId.has(
                                    recipient.id
                                );

                                return (
                                    <button
                                        key={recipient.id}
                                        type="button"
                                        disabled={!recipient.canMessage}
                                        onClick={() =>
                                            handleSelectRecipient(recipient)
                                        }
                                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors enabled:hover:bg-(--hover) disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <Avatar
                                            src={recipient.avatarUrl}
                                            alt={recipient.name}
                                            className="avatar-md shrink-0"
                                        />

                                        <span className="min-w-0 flex-1">
                                            <span className="type-label-md block truncate text-primary">
                                                {recipient.name}
                                            </span>
                                            <span className="type-body-sm block truncate text-secondary">
                                                @{recipient.username}
                                                {!recipient.canMessage
                                                    ? " · Not accepting messages"
                                                    : hasExisting
                                                      ? " · Open chat"
                                                      : ""}
                                            </span>
                                        </span>

                                        {recipient.canMessage && (
                                            <Send
                                                size={16}
                                                className="shrink-0 text-(--primary)"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
