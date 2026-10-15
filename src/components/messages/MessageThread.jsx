import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import Avatar from "@/components/profileimages/Avatar";
import MessageComposer from "./MessageComposer";
import SharedPostCard from "./SharedPostCard";

function MessageBubble({ message }) {
    return (
        <div className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}>
            <div
                className={`flex max-w-[80%] flex-col ${
                    message.isMine ? "items-end" : "items-start"
                }`}
            >
                {message.content && (
                    <div
                        className={`type-body-sm whitespace-pre-wrap break-words rounded-2xl px-4 py-2 ${
                            message.isMine
                                ? "bg-(--primary) text-(--surface-lowest)"
                                : "bg-(--surface-container) text-primary"
                        }`}
                    >
                        {message.content}
                    </div>
                )}

                {message.postId && <SharedPostCard post={message.post} />}

                <span className="type-label-sm mt-1 text-secondary">
                    {formatPostTime(message.createdAt)}
                </span>
            </div>
        </div>
    );
}

function formatPostTime(value) {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function MessageThread({
    conversationId,
    otherUser,
    messages,
    isLoading,
}) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [conversationId, messages.length]);

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-(--surface-high) px-4 py-3">
                <Link
                    to="/messages"
                    aria-label="Back to conversations"
                    className="icon-button lg:hidden"
                >
                    <ArrowLeft size={20} />
                </Link>

                {otherUser && (
                    <Link
                        to={`/profile/${otherUser.username}`}
                        className="flex min-w-0 items-center gap-3"
                    >
                        <Avatar
                            src={otherUser.avatarUrl}
                            alt={otherUser.name}
                            className="avatar-md shrink-0"
                        />
                        <div className="min-w-0">
                            <p className="type-label-md truncate text-primary">
                                {otherUser.name}
                            </p>
                            <p className="type-body-sm truncate text-secondary">
                                @{otherUser.username}
                            </p>
                        </div>
                    </Link>
                )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
                {isLoading && (
                    <p className="type-body-sm text-secondary">Loading…</p>
                )}

                {!isLoading && messages.length === 0 && (
                    <p className="type-body-sm m-auto text-secondary">
                        No messages yet. Say hello.
                    </p>
                )}

                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                <div ref={bottomRef} />
            </div>

            {otherUser && <MessageComposer recipientUsername={otherUser.username} />}
        </div>
    );
}
