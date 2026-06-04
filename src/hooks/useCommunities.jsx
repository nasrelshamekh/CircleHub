import { useContext } from "react";

import { CommunitiesContext } from "@/context/CommunitiesContext";

export function useCommunities() {
    const context = useContext(CommunitiesContext);

    if (!context) {
        throw new Error("useCommunities must be used within a CommunitiesContextProvider");
    }

    return context;
}
