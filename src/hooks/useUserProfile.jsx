import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { getUserProfile } from "@/services/userApi";
import { queryKeys } from "@/lib/queryKeys";

export function useUserProfile(username) {
    const query = useQuery({
        queryKey: queryKeys.user(username),
        queryFn: async () => {
            try {
                const { data } = await getUserProfile(username);
                return data;
            } catch (error) {
                if (error.response?.status === 404) {
                    return null;
                }

                toast.error(
                    error.response?.data?.message ||
                    error.message ||
                    "Could not load profile"
                );
                throw error;
            }
        },
        enabled: Boolean(username),
    });

    return {
        user: query.data ?? null,
        isLoading: query.isPending,
    };
}
