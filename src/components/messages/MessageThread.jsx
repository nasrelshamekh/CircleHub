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
import PresenceLabel from "./PresenceLabel";
import SharedPostCard from "./SharedPostCard";
import TypingLabel from "./TypingLabel";
import { formatMessageDate, formatMessageTime } from "@/lib/formatDate";
import { useDecryptedContent } from "@/hooks/useDecryptedContent";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

function MessageBubble({ message, otherUser }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasContent = Boolean(message.content);
    // The stored row is ciphertext; the reader only ever sees the decrypted body (the optimistic
    // pending bubble never had it — that text came straight from the composer).
    const text = useDecryptedContent(message.content);

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
            await navigator.clipboard.writeText(text);
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
                    className={`flex min-w-0 max-w-[80%] flex-col ${
                        message.isMine ? "items-end" : "items-start"
                    }`}
                >
                    {hasContent && (
                        <div
                            className={`type-body-sm min-w-0 max-w-full whitespace-pre-wrap break-words rounded-2xl px-4 py-2 [overflow-wrap:anywhere] ${
                                message.isMine
                                    ? "bg-(--primary) text-(--on-primary)"
                                    : "bg-(--surface-container) text-primary"
                            }${message.pending ? " opacity-70" : ""}`}
                        >
                            {text}
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
    const previousConversationRef = useRef(conversationId);

    const [isAtBottom, setIsAtBottom] = useState(true);
    const [seen, setSeen] = useState({ conversationId: null, messageId: null });
    const [pendingMessage, setPendingMessage] = useState(null);

    // The header's second line, while the other person is writing: presence gives way to "typing…" rather
    // than sitting underneath it, which is where the eye already looks for their state.
    const isOtherTyping = useTypingIndicator(otherUser?.id);

    const firstMessageId = messages[0]?.id;
    const lastMessageId = messages[messages.length - 1]?.id;

    // Derived, not stored: a message is "new" only if it arrived after the reader scrolled away from the
    // bottom, so scrolling up by itself never raises the indicator.
    const hasNewMessages =
        !isAtBottom &&
        seen.conversationId === conversationId &&
        lastMessageId !== seen.messageId;

    const showPendingMessage =
        Boolean(pendingMessage) &&
        !messages.some((message) => message.id === pendingMessage.id);

    useEffect(() => {
        const conversationChanged =
            previousConversationRef.current !== conversationId;
        previousConversationRef.current = conversationId;

        // A conversation always opens at its latest message; a new one only follows the reader down when
        // they are already at the bottom, so catching up on history is not interrupted.
        if (conversationChanged || isAtBottom) {
            bottomRef.current?.scrollIntoView({ block: "end" });
        }
    }, [conversationId, lastMessageId, isAtBottom]);

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

    function scrollToLatest() {
        bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
        setIsAtBottom(true);
        setSeen({ conversationId, messageId: lastMessageId });
    }

    function handleOptimisticMessage(message) {
        setPendingMessage(message);

        // Sending is a deliberate jump to the end, even when the reader had scrolled up.
        if (message) {
            bottomRef.current?.scrollIntoView({
                block: "end",
                behavior: "smooth",
            });
        }
    }

    function handleScroll(event) {
        const element = event.currentTarget;
        const distanceFromBottom =
            element.scrollHeight - element.scrollTop - element.clientHeight;
        const nearBottom = distanceFromBottom < 80;

        setIsAtBottom((current) =>
            current === nearBottom ? current : nearBottom
        );

        // Recorded on any scroll, not only at the bottom: a thread that opens already at the bottom has no
        // baseline until the reader scrolls, and without one no arrival could ever count as new.
        setSeen((current) =>
            current.conversationId === conversationId &&
            current.messageId === lastMessageId
                ? current
                : { conversationId, messageId: lastMessageId }
        );

        if (element.scrollTop <= 120) {
            onLoadOlder?.();
        }
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
                            {isOtherTyping ? (
                                <TypingLabel className="type-body-sm block truncate" />
                            ) : (
                                <PresenceLabel
                                    isOnline={otherUser.isOnline}
                                    lastSeenAt={otherUser.lastSeenAt}
                                    className="type-body-sm block truncate"
                                />
                            )}
                        </div>
                    </Link>
                )}
            </div>

            <div className="relative flex min-h-0 flex-1 flex-col">
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

                            <MessageBubble
                                message={message}
                                otherUser={otherUser}
                            />
                        </Fragment>
                    ))}

                    {showPendingMessage && (
                        <MessageBubble
                            message={pendingMessage}
                            otherUser={otherUser}
                        />
                    )}

                    <div ref={bottomRef} />
                </div>

                {hasNewMessages && (
                    <button
                        type="button"
                        onClick={scrollToLatest}
                        className="type-label-sm absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-(--primary) px-3 py-1.5 text-(--on-primary) shadow-md"
                    >
                        New message
                    </button>
                )}
            </div>

            {otherUser && (
                <MessageComposer
                    recipientId={otherUser.id}
                    recipientUsername={otherUser.username}
                    onOptimisticMessage={handleOptimisticMessage}
                />
            )}
        </div>
    );
}
