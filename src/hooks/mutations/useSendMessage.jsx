import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sendMessage } from "@/services/messageApi";
import { queryKeys } from "@/lib/queryKeys";

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: sendMessage,

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
