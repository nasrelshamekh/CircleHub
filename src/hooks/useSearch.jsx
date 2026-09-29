import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { search } from "@/services/searchApi";
import { queryKeys } from "@/lib/queryKeys";

function useDebouncedValue(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export function useSearch(term) {
    const debouncedTerm = useDebouncedValue(term, 300);
    const isDebouncing = term !== debouncedTerm;

    const query = useQuery({
        queryKey: queryKeys.search(debouncedTerm),
        queryFn: async () => {
            const { data } = await search(debouncedTerm.trim());
            return data;
        },
    });

    return {
        users: query.data?.users ?? [],
        communities: query.data?.communities ?? [],
        posts: query.data?.posts ?? [],
        isLoading: query.isPending || isDebouncing,
    };
}
