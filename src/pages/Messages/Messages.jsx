import { MessageCircle } from "lucide-react";
import { useParams } from "react-router-dom";

import ConversationList from "@/components/messages/ConversationList";
import MessageThread from "@/components/messages/MessageThread";
import { useConversations } from "@/hooks/useConversations";
import { useConversation } from "@/hooks/useConversation";

export default function Messages() {
    const { id } = useParams();

    const { conversations, isLoading: isLoadingConversations } =
        useConversations();

    const {
        messages,
        otherUser,
        isLoading: isLoadingThread,
        isLoadingOlder,
        loadOlder,
    } = useConversation(id);

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col p-4 sm:p-6">
            <h1 className="type-headline-md mb-4 text-primary">Messages</h1>

            <div className="grid h-[calc(100vh-14.625rem)] grid-cols-1 gap-4 sm:h-[calc(100vh-15.125rem)] lg:h-[calc(100vh-13rem)] lg:min-h-96 lg:grid-cols-[20rem_minmax(0,1fr)]">
                <div
                    className={`content-card overflow-y-auto ${
                        id ? "hidden lg:block" : "block"
                    }`}
                >
                    {isLoadingConversations ? (
                        <p className="type-body-sm p-4 text-secondary">
                            Loading conversations…
                        </p>
                    ) : (
                        <ConversationList
                            conversations={conversations}
                            activeId={id}
                        />
                    )}
                </div>

                <div
                    className={`content-card overflow-hidden ${
                        id ? "block" : "hidden lg:block"
                    }`}
                >
                    {id ? (
                        <MessageThread
                            conversationId={id}
                            otherUser={otherUser}
                            messages={messages}
                            isLoading={isLoadingThread}
                            isLoadingOlder={isLoadingOlder}
                            onLoadOlder={loadOlder}
                        />
                    ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                            <MessageCircle
                                size={28}
                                className="text-secondary"
                            />
                            <p className="type-label-md text-primary">
                                Select a conversation
                            </p>
                            <p className="type-body-sm text-secondary">
                                Choose someone on the left to read or reply.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
