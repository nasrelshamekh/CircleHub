import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sendMessage } from "@/services/messageApi";
import { encryptMessageContent } from "@/services/messageCrypto";
import { queryKeys } from "@/lib/queryKeys";

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
            queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });

            if (variables?.recipientUsername) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.messageRecipients(),
                });
            }

            return result;
        },
    });
}
