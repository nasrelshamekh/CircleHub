import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
    appendMessageToThreadCache,
    patchConversationListOnMessage,
} from "@/lib/messageCacheHelpers";
import { queryKeys } from "@/lib/queryKeys";
import { sendMessage } from "@/services/messageApi";
import { encryptMessageContent } from "@/services/messageCrypto";

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        // The one mutation both send paths use (composer, share-post dialog), so it is the one place
        // that turns text into ciphertext. A post-only send carries no body: nothing to encrypt, the
        // postId travels in the clear by design.
        mutationFn: async ({ recipientUsername, content, postId }) =>
            sendMessage({
                recipientUsername,
                content: await encryptMessageContent({
                    recipientUsername,
                    plaintext: content,
                }),
                previewText: content ? content.trim().slice(0, 150) : undefined,
                postId,
            }),

        onSuccess: (result, variables) => {
            const conversationId = result?.data?.conversationId;
            const sentMessage = result?.data?.message;
            const trimmedPlaintext = variables?.content ? variables.content.trim() : "";

            if (conversationId && sentMessage) {
                const enrichedMessage = {
                    ...sentMessage,
                    ...(trimmedPlaintext ? { plaintext: trimmedPlaintext } : {}),
                };

                appendMessageToThreadCache(queryClient, conversationId, enrichedMessage, {
                    markReadUpTo: true,
                });

                const patchedList = patchConversationListOnMessage(queryClient, {
                    conversationId,
                    lastMessage: {
                        id: sentMessage.id,
                        content: sentMessage.content,
                        hasPost: Boolean(sentMessage.postId),
                        isMine: true,
                        createdAt: sentMessage.createdAt,
                    },
                    lastMessageAt: sentMessage.createdAt,
                    resetUnread: true,
                });

                if (!patchedList) {
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.conversations(),
                        exact: true,
                    });
                }
            } else {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.conversations(),
                    exact: true,
                });
            }

            if (variables?.recipientUsername) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.messageRecipients(),
                });
            }

            return result;
        },
    });
}
