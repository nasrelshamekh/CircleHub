import {
    Fragment,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { isSameDay } from "date-fns";
import { toast } from "sonner";

import Avatar from "@/components/profileimages/Avatar";
import MessageComposer from "./MessageComposer";
import SharedPostCard from "./SharedPostCard";
import { formatMessageDate, formatMessageTime } from "@/lib/formatDate";

function MessageBubble({ message, otherUser }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasContent = Boolean(message.content);

    function toggleDetails() {
        setIsExpanded((expanded) => !expanded);
    }

    function handleKeyDown(event) {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        toggleDetails();
    }

    async function handleCopy(event) {
        event.stopPropagation();

        try {
            await navigator.clipboard.writeText(message.content);
            toast.success("Message copied");
        } catch {
            toast.error("Could not copy the message.");
        }
    }

    return (
        <div
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            onClick={toggleDetails}
            onKeyDown={handleKeyDown}
            className="flex cursor-pointer flex-col"
        >
            <div
                className={`flex items-end gap-2 ${
                    message.isMine ? "justify-end" : "justify-start"
                }`}
            >
                {!message.isMine && (
                    <Avatar
                        src={otherUser?.avatarUrl}
                        alt={otherUser?.name}
                        className="avatar-sm shrink-0"
                    />
                )}

                <div
                    className={`flex max-w-[80%] flex-col ${
                        message.isMine ? "items-end" : "items-start"
                    }`}
                >
                    {hasContent && (
                        <div
                            className={`type-body-sm whitespace-pre-wrap break-words rounded-2xl px-4 py-2 ${
                                message.isMine
                                    ? "bg-(--primary) text-(--on-primary)"
                                    : "bg-(--surface-container) text-primary"
                            }`}
                        >
                            {message.content}
                        </div>
                    )}

                    {message.postId && <SharedPostCard post={message.post} />}
                </div>
            </div>

            {isExpanded && (
                <div
                    className={`type-label-sm mt-1 flex items-center gap-3 text-secondary ${
                        message.isMine ? "justify-end" : "pl-10"
                    }`}
                >
                    <span>{formatMessageTime(message.createdAt)}</span>

                    {hasContent && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="font-semibold text-(--primary) hover:underline"
                        >
                            Copy
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

function DateDivider({ value }) {
    return (
        <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-(--border)" />
            <span className="type-label-sm text-secondary">
                {formatMessageDate(value)}
            </span>
            <span className="h-px flex-1 bg-(--border)" />
        </div>
    );
}

function isNewDay(current, previous) {
    if (!previous) return true;

    return !isSameDay(new Date(current), new Date(previous));
}

export default function MessageThread({
    conversationId,
    otherUser,
    messages,
    isLoading,
    isLoadingOlder,
    onLoadOlder,
}) {
    const bottomRef = useRef(null);
    const scrollRef = useRef(null);
    const anchorRef = useRef({ conversationId: null, firstId: null, height: 0 });

    const firstMessageId = messages[0]?.id;
    const lastMessageId = messages[messages.length - 1]?.id;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [conversationId, lastMessageId]);

    useLayoutEffect(() => {
        const element = scrollRef.current;
        if (!element) return;

        const anchor = anchorRef.current;
        const prepended =
            anchor.conversationId === conversationId &&
            Boolean(anchor.firstId) &&
            anchor.firstId !== firstMessageId;

        if (prepended) {
            element.scrollTop += element.scrollHeight - anchor.height;
        }

        anchorRef.current = {
            conversationId,
            firstId: firstMessageId,
            height: element.scrollHeight,
        };
    }, [conversationId, firstMessageId, messages.length]);

    function handleScroll(event) {
        if (event.currentTarget.scrollTop > 120) return;

        onLoadOlder?.();
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b border-(--border) px-4 py-3">
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

            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 [overflow-anchor:none]"
            >
                {isLoading && (
                    <p className="type-body-sm text-secondary">Loading…</p>
                )}

                {isLoadingOlder && (
                    <p className="type-body-sm text-center text-secondary">
                        Loading earlier messages…
                    </p>
                )}

                {!isLoading && messages.length === 0 && (
                    <p className="type-body-sm m-auto text-secondary">
                        No messages yet. Say hello.
                    </p>
                )}

                {messages.map((message, index) => (
                    <Fragment key={message.id}>
                        {isNewDay(
                            message.createdAt,
                            messages[index - 1]?.createdAt
                        ) && <DateDivider value={message.createdAt} />}

                        <MessageBubble message={message} otherUser={otherUser} />
                    </Fragment>
                ))}

                <div ref={bottomRef} />
            </div>

            {otherUser && <MessageComposer recipientUsername={otherUser.username} />}
        </div>
    );
}
