import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";

import Avatar from "@/components/profileimages/Avatar";
import PresenceDot from "@/components/messages/PresenceDot";
import PresenceLabel from "@/components/messages/PresenceLabel";
import TypingLabel from "@/components/messages/TypingLabel";
import { isTypingNow, useTypingUsers } from "@/hooks/useTypingIndicator";
import { useDecryptedContent } from "@/hooks/useDecryptedContent";
import { formatShortTime } from "@/lib/formatDate";

function previewParts(conversation) {
    const last = conversation.lastMessage;

    if (!last) return null;

    const body = last.hasPost
        ? last.content || "Shared a post"
        : last.content || "";

    return { body, prefix: last.isMine ? "You: " : "" };
}

// Its own component because the preview body may be ciphertext and decrypting it is a hook: the row
// map can't call a hook per row from the list itself.
function ConversationPreview({ conversation }) {
    const parts = previewParts(conversation);
    const body = useDecryptedContent(parts ? parts.body : "");

    if (!parts) return <>No messages yet</>;

    return (
        <>
            {parts.prefix}
            {body}
        </>
    );
}

export default function ConversationList({ conversations, activeId }) {
    const typingUsers = useTypingUsers();

    if (conversations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-xl bg-(--surface-low) px-4 py-12 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                    <MessageCircle size={24} />
                </div>
                <h3 className="type-title-lg text-primary">No messages yet</h3>
                <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                    Share a post with a friend to start the conversation.
                </p>
            </div>
        );
    }

    return (
        <ul className="flex flex-col gap-1">
            {conversations.map((conversation) => {
                const isActive = conversation.id === activeId;
                const unread = conversation.unreadCount > 0;
                const isOtherTyping = isTypingNow(
                    typingUsers,
                    conversation.otherUser.id
                );

                return (
                    <li key={conversation.id}>
                        <Link
                            to={`/messages/${conversation.id}`}
                            className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
                                isActive
                                    ? "bg-(--active)"
                                    : "hover:bg-(--hover)"
                            }`}
                        >
                            <span className="relative shrink-0">
                                <Avatar
                                    src={conversation.otherUser.avatarUrl}
                                    alt={conversation.otherUser.name}
                                    className="avatar-md block"
                                />
                                <PresenceDot
                                    isOnline={conversation.otherUser.isOnline}
                                />
                            </span>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span
                                        className={`type-label-md truncate ${
                                            isActive
                                                ? "text-(--primary)"
                                                : "text-primary"
                                        }`}
                                    >
                                        {conversation.otherUser.name}
                                    </span>
                                    <span className="type-label-sm shrink-0 text-secondary">
                                        {formatShortTime(
                                            conversation.lastMessageAt
                                        )}
                                    </span>
                                </div>

                                <PresenceLabel
                                    isOnline={conversation.otherUser.isOnline}
                                    lastSeenAt={
                                        conversation.otherUser.lastSeenAt
                                    }
                                    className="type-label-sm block truncate"
                                />

                                <div className="flex items-center justify-between gap-2">
                                    {isOtherTyping ? (
                                        <TypingLabel className="type-body-sm truncate" />
                                    ) : (
                                        <span
                                            className={`type-body-sm min-w-0 flex-1 truncate ${
                                                unread
                                                    ? "font-semibold text-primary"
                                                    : "text-secondary"
                                            }`}
                                        >
                                            <ConversationPreview
                                                conversation={conversation}
                                            />
                                        </span>
                                    )}

                                    {unread && (
                                        <span className="type-label-sm flex min-w-5 items-center justify-center rounded-full bg-(--primary) px-1.5 py-0.5 text-(--on-primary)">
                                            {conversation.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
