import { useQuery } from "@tanstack/react-query";

import { getMessageRecipients } from "@/services/messageApi";
import { queryKeys } from "@/lib/queryKeys";

export function useMessageRecipients(options = {}) {
    const { enabled = true } = options;

    const query = useQuery({
        queryKey: queryKeys.messageRecipients(),
        enabled,
        queryFn: async () => {
            const { data } = await getMessageRecipients();
            return data;
        },
    });

    return {
        recipients: query.data ?? [],
        isLoading: query.isPending && enabled,
        isError: query.isError,
    };
}
