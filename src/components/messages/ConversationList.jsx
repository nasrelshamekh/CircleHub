import { Link } from "react-router-dom";

import Avatar from "@/components/profileimages/Avatar";
import { formatShortTime } from "@/lib/formatDate";

function previewText(conversation) {
    const last = conversation.lastMessage;

    if (!last) return "No messages yet";

    const body = last.hasPost
        ? last.content || "Shared a post"
        : last.content || "";

    return last.isMine ? `You: ${body}` : body;
}

export default function ConversationList({ conversations, activeId }) {
    if (conversations.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                <p className="type-label-md text-primary">No messages yet</p>
                <p className="type-body-sm text-secondary">
                    Share a post with a friend to start the conversation.
                </p>
            </div>
        );
    }

    return (
        <ul className="flex flex-col">
            {conversations.map((conversation) => {
                const isActive = conversation.id === activeId;
                const unread = conversation.unreadCount > 0;

                return (
                    <li key={conversation.id}>
                        <Link
                            to={`/messages/${conversation.id}`}
                            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                                isActive
                                    ? "bg-(--active)"
                                    : "hover:bg-(--hover)"
                            }`}
                        >
                            <Avatar
                                src={conversation.otherUser.avatarUrl}
                                alt={conversation.otherUser.name}
                                className="avatar-md shrink-0"
                            />

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

                                <div className="flex items-center justify-between gap-2">
                                    <span
                                        className={`type-body-sm truncate ${
                                            unread
                                                ? "font-semibold text-primary"
                                                : "text-secondary"
                                        }`}
                                    >
                                        {previewText(conversation)}
                                    </span>

                                    {unread && (
                                        <span className="type-label-sm flex min-w-5 items-center justify-center rounded-full bg-(--primary) px-1.5 py-0.5 text-(--surface-lowest)">
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
