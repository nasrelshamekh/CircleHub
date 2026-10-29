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

export function useSearch(options) {
    const parsedOptions =
        typeof options === "string"
            ? { q: options, type: "all", sort: "latest", mediaOnly: false }
            : {
                  q: options?.q ?? "",
                  type: options?.type ?? "all",
                  sort: options?.sort ?? "latest",
                  mediaOnly: Boolean(options?.mediaOnly),
              };

    const debouncedTerm = useDebouncedValue(parsedOptions.q, 300);
    const isDebouncing = parsedOptions.q !== debouncedTerm;

    const query = useQuery({
        queryKey: queryKeys.search({
            q: debouncedTerm.trim(),
            type: parsedOptions.type,
            sort: parsedOptions.sort,
            mediaOnly: parsedOptions.mediaOnly,
        }),
        queryFn: async () => {
            const { data } = await search({
                q: debouncedTerm.trim(),
                type: parsedOptions.type,
                sort: parsedOptions.sort,
                mediaOnly: parsedOptions.mediaOnly,
            });
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
