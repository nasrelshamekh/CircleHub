/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";

import initialCommunityPosts from "@/data/communityPosts";
import users from "@/data/users";

export const communityPostsContext = createContext(null);

export default function CommunityPostsContextProvider({ children }) {
    const [communityPosts, setCommunityPosts] = useState(() => {
        const savedCommunityPosts = localStorage.getItem("community-posts");

        if (!savedCommunityPosts) {
            return initialCommunityPosts;
        }

        try {
            return JSON.parse(savedCommunityPosts).map((post) => {
                const likedBy = (post.likedBy || [])
                    .map((likedUser) =>
                        typeof likedUser === "number"
                            ? likedUser
                            : users.find((user) => user.username === likedUser)?.id
                    )
                    .filter(Boolean);

                return {
                    ...post,
                    likedBy,
                    likesCount: likedBy.length,
                };
            });
        } catch {
            return initialCommunityPosts;
        }
    });

    useEffect(() => {
        localStorage.setItem("community-posts", JSON.stringify(communityPosts));
    }, [communityPosts]);

    return (
        <communityPostsContext.Provider
            value={{
                communityPosts,
                setCommunityPosts,
            }}
        >
            {children}
        </communityPostsContext.Provider>
    );
}
