import {
    Fragment,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { isSameDay } from "date-fns";
import { toast } from "sonner";

import Avatar from "@/components/profileimages/Avatar";
import MessageComposer from "./MessageComposer";
import PresenceLabel from "./PresenceLabel";
import SharedPostCard from "./SharedPostCard";
import TypingLabel from "./TypingLabel";
import { formatMessageDate, formatMessageTime } from "@/lib/formatDate";
import { useDecryptedContent } from "@/hooks/useDecryptedContent";
import { peekDecrypted } from "@/services/messageCrypto";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

function MessageBubble({ message, otherUser, onRetry }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasContent = Boolean(message.content || message.plaintext);
    // The stored row is ciphertext; the reader only ever sees the decrypted body (the optimistic
    // pending bubble never had it — that text came straight from the composer).
    const decryptedText = useDecryptedContent(message.plaintext ? null : message.content);
    const text = message.plaintext ?? decryptedText;

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
                                    ? message.failed
                                        ? "border border-rose-500/50 bg-rose-500/10 text-rose-300"
                                        : "bg-(--primary) text-(--on-primary)"
                                    : "bg-(--surface-container) text-primary"
                            }${message.pending ? " opacity-70" : ""}`}
                        >
                            {text}
                        </div>
                    )}

                    {message.postId && <SharedPostCard post={message.post} />}

                    {message.failed && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-500">
                            <AlertCircle size={13} />
                            <span>Failed to send</span>
                            {onRetry && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRetry(message);
                                    }}
                                    className="ml-1 font-semibold underline hover:text-rose-600"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    )}
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
    const contentRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const lastScrollTopRef = useRef(0);
    const anchorRef = useRef({ conversationId: null, firstId: null, height: 0 });
    const previousConversationRef = useRef(conversationId);

    const [isAtBottom, setIsAtBottom] = useState(true);
    const [retryText, setRetryText] = useState(null);
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

    const showPendingMessage = useMemo(() => {
        if (!pendingMessage) return false;
        if (pendingMessage.failed) return true;

        const alreadyInThread = messages.some((message) => {
            if (message.id === pendingMessage.id) return true;
            if (pendingMessage.realId && message.id === pendingMessage.realId) return true;
            if (message.isMine) {
                const messageText = message.plaintext ?? peekDecrypted(message.content) ?? message.content;
                const pendingText = pendingMessage.plaintext ?? pendingMessage.content;
                if (messageText && pendingText && messageText === pendingText) {
                    const timeDiff = Math.abs(
                        new Date(message.createdAt).getTime() - new Date(pendingMessage.createdAt).getTime()
                    );
                    if (timeDiff < 60000) return true;
                }
            }
            return false;
        });

        return !alreadyInThread;
    }, [pendingMessage, messages]);

    useLayoutEffect(() => {
        const element = scrollRef.current;
        const conversationChanged =
            previousConversationRef.current !== conversationId;
        previousConversationRef.current = conversationId;

        if (conversationChanged) {
            isAtBottomRef.current = true;
            lastScrollTopRef.current = 0;
        }

        // A conversation always opens at its latest message; a new one only follows the reader down when
        // they are already at the bottom, so catching up on history is not interrupted.
        if (element && (conversationChanged || isAtBottomRef.current)) {
            element.scrollTop = element.scrollHeight;
            lastScrollTopRef.current = element.scrollTop;
        }
    }, [conversationId, lastMessageId]);

    useEffect(() => {
        const contentEl = contentRef.current;
        const scrollEl = scrollRef.current;
        if (!contentEl || !scrollEl || typeof ResizeObserver === "undefined") {
            return undefined;
        }

        // Encrypted messages resolve asynchronously via WebCrypto after initial mount; keep the scroll
        // container pinned to the bottom as message bubbles expand while the reader is at the bottom.
        const observer = new ResizeObserver(() => {
            if (isAtBottomRef.current) {
                scrollEl.scrollTop = scrollEl.scrollHeight;
                lastScrollTopRef.current = scrollEl.scrollTop;
            }
        });

        observer.observe(contentEl);
        return () => observer.disconnect();
    }, [conversationId]);

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
            lastScrollTopRef.current = element.scrollTop;
        }

        anchorRef.current = {
            conversationId,
            firstId: firstMessageId,
            height: element.scrollHeight,
        };
    }, [conversationId, firstMessageId, messages.length]);

    function scrollToLatest() {
        isAtBottomRef.current = true;
        setIsAtBottom(true);
        setSeen({ conversationId, messageId: lastMessageId });
        bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
    }

    function handleOptimisticMessage(message) {
        setPendingMessage(message);

        // Sending is a deliberate jump to the end, even when the reader had scrolled up.
        if (message) {
            isAtBottomRef.current = true;
            setIsAtBottom(true);
            const element = scrollRef.current;
            if (element) {
                element.scrollTop = element.scrollHeight;
                lastScrollTopRef.current = element.scrollTop;
            }
        }
    }

    function handleScroll(event) {
        const element = event.currentTarget;
        const currentScrollTop = element.scrollTop;
        const scrolledUp = currentScrollTop < lastScrollTopRef.current - 2;
        lastScrollTopRef.current = currentScrollTop;

        const distanceFromBottom =
            element.scrollHeight - currentScrollTop - element.clientHeight;
        const nearBottom = distanceFromBottom < 80;
        const nextAtBottom =
            nearBottom || (isAtBottomRef.current && !scrolledUp);
        isAtBottomRef.current = nextAtBottom;

        setIsAtBottom((current) =>
            current === nextAtBottom ? current : nextAtBottom
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
            <div className="flex items-center gap-3 border-b border-(--border) px-5 py-4">
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
                    className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 [overflow-anchor:none]"
                >
                    <div ref={contentRef} className="flex flex-col gap-4">
                        {isLoading && (
                            <p className="type-body-sm text-secondary">
                                Loading…
                            </p>
                        )}

                        {isLoadingOlder && (
                            <p className="type-body-sm text-center text-secondary">
                                Loading earlier messages…
                            </p>
                        )}

                        {!isLoading && messages.length === 0 && (
                            <p className="type-body-sm m-auto py-12 text-secondary">
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
                                onRetry={(msg) => setRetryText(msg.content)}
                            />
                        )}
                    </div>

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
                    retryText={retryText}
                    onRetryHandled={() => setRetryText(null)}
                />
            )}
        </div>
    );
}
