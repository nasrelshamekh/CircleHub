import { useContext } from "react";

import { postsContext } from "@/context/PostsContext.jsx";

export function usePosts() {
    const context = useContext(postsContext);

    if (!context) {
        throw new Error("usePosts must be used within a PostsContextProvider");
    }

    return context;
}
