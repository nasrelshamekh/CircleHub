import { useContext } from "react";

import { communityPostsContext } from "@/context/CommunityPostsContext.jsx";

export function useCommunityPosts() {
    const context = useContext(communityPostsContext);

    if (!context) {
        throw new Error("useCommunityPosts must be used within a CommunityPostsContextProvider");
    }

    return context;
}
