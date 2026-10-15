import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
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

export function SharePostDialog({ open, onOpenChange, post }) {
    const navigate = useNavigate();
    const { recipients, isLoading } = useMessageRecipients({ enabled: open });
    const sendMessage = useSendMessage();

    function handleSend(recipient) {
        if (!recipient.canMessage || sendMessage.isPending) return;

        sendMessage.mutate(
            { recipientUsername: recipient.username, postId: post.id },
            {
                onSuccess: (response) => {
                    const conversationId = response?.data?.conversationId;

                    toast.success(`Post sent to ${recipient.name}`);
                    onOpenChange(false);

                    if (conversationId) {
                        navigate(`/messages/${conversationId}`);
                    }
                },
                onError: (error) => {
                    toast.error(
                        error.response?.data?.message ||
                            "Could not send this post"
                    );
                },
            }
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="content-card max-h-[calc(100vh-2rem)] overflow-y-auto text-primary">
                <DialogHeader>
                    <DialogTitle>Send post</DialogTitle>
                    <DialogDescription>
                        Choose a friend to send this post to.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-1">
                    {isLoading && (
                        <p className="type-body-sm p-3 text-secondary">
                            Loading your friends…
                        </p>
                    )}

                    {!isLoading && recipients.length === 0 && (
                        <p className="type-body-sm p-3 text-secondary">
                            Follow someone, or wait for them to follow you, to
                            send them a post.
                        </p>
                    )}

                    {recipients.map((recipient) => (
                        <button
                            key={recipient.id}
                            type="button"
                            disabled={!recipient.canMessage}
                            onClick={() => handleSend(recipient)}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors enabled:hover:bg-(--surface-high) disabled:opacity-50"
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
                                        : ""}
                                </span>
                            </span>

                            {recipient.canMessage && (
                                <Send
                                    size={18}
                                    className="shrink-0 text-(--primary)"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
