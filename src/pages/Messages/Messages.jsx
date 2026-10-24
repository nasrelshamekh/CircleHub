import { useState } from "react";
import { MessageCircle, MessageSquarePlus } from "lucide-react";
import { useParams } from "react-router-dom";

import ChatConnectionStatus from "@/components/messages/ChatConnectionStatus";
import ConversationList from "@/components/messages/ConversationList";
import MessageThread from "@/components/messages/MessageThread";
import NewMessageDialog from "@/components/messages/NewMessageDialog";
import { useConversations } from "@/hooks/useConversations";
import { useConversation } from "@/hooks/useConversation";

export default function Messages() {
    const { id } = useParams();
    const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);

    const { conversations, isLoading: isLoadingConversations } =
        useConversations();

    const {
        messages,
        otherUser,
        isLoading: isLoadingThread,
        isLoadingOlder,
        loadOlder,
    } = useConversation(id);

    const activeConversation = conversations.find(
        (c) => String(c.id).toLowerCase() === String(id).toLowerCase()
    );
    const resolvedOtherUser = otherUser || activeConversation?.otherUser;

    // Same shell as Explore / Communities (`content-stack`, responsive headline + subtitle), centred in the
    // main column. AppLayout drops the right rail on this route, so the cap is wider (96rem) to let the
    // conversation use that space. The section is pinned to the viewport so the two panes scroll on their
    // own instead of the page: the height subtracts the 5rem navbar, and below lg also the 5rem bottom
    // margin `content-stack` reserves for the fixed MobileBottomNav; the panes then take whatever the
    // header leaves via `flex-1 min-h-0`.
    return (
        <section className="content-stack max-w-[96rem] h-[calc(100dvh-10rem)] min-h-[32rem] lg:h-[calc(100dvh-5rem)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="type-headline-responsive text-primary">
                        Messages
                    </h1>
                    <p className="type-body-md mt-2 hidden text-secondary sm:block">
                        Catch up on your private conversations and keep chatting.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <ChatConnectionStatus />

                    <button
                        type="button"
                        onClick={() => setIsNewMessageOpen(true)}
                        className="button-primary flex items-center gap-2 rounded-full px-4 py-2"
                    >
                        <MessageSquarePlus size={18} />
                        New Message
                    </button>
                </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
                <div
                    className={`content-card min-h-0 flex-col overflow-hidden ${
                        id ? "hidden lg:flex" : "flex"
                    }`}
                >
                    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
                        <div>
                            <h2 className="type-title-lg text-primary">
                                Conversations
                            </h2>
                            <p className="type-body-sm mt-1 text-secondary">
                                Your recent chats.
                            </p>
                        </div>

                        <span className="type-label-sm rounded-full bg-(--active) px-3 py-1 text-(--primary)">
                            {conversations.length}
                        </span>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
                        {isLoadingConversations ? (
                            <p className="type-body-sm p-3 text-secondary">
                                Loading conversations…
                            </p>
                        ) : (
                            <ConversationList
                                conversations={conversations}
                                activeId={id}
                            />
                        )}
                    </div>
                </div>

                <div
                    className={`content-card min-h-0 overflow-hidden ${
                        id ? "block" : "hidden lg:block"
                    }`}
                >
                    {id ? (
                        <MessageThread
                            conversationId={id}
                            otherUser={resolvedOtherUser}
                            messages={messages}
                            isLoading={isLoadingThread}
                            isLoadingOlder={isLoadingOlder}
                            onLoadOlder={loadOlder}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                                <MessageCircle size={24} />
                            </div>

                            <h3 className="type-title-lg text-primary">
                                Select a conversation
                            </h3>

                            <p className="type-body-sm-readable mt-2 max-w-sm text-secondary">
                                Choose someone on the left to read or reply.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <NewMessageDialog
                open={isNewMessageOpen}
                onOpenChange={setIsNewMessageOpen}
                conversations={conversations}
            />
        </section>
    );
}
