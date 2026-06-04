import { useContext } from "react";

import { communityPostsContext } from "@/context/CommunityPostsContext";

export function useCommunityPosts() {
    const context = useContext(communityPostsContext);

    if (!context) {
        throw new Error("useCommunityPosts must be used within a CommunityPostsContextProvider");
    }

    return context;
}
