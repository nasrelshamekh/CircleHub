/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";

import initialPosts from "@/data/posts";
import users from "@/data/users";

export const postsContext = createContext(null);

export default function PostsContextProvider({ children }) {
    const [posts, setPosts] = useState(() => {
        const savedPosts = localStorage.getItem("posts");

        if (!savedPosts) {
            return initialPosts;
        }

        try {
            return JSON.parse(savedPosts).map((post) => {
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
            return initialPosts;
        }
    });

    useEffect(() => {
        localStorage.setItem("posts", JSON.stringify(posts));
    }, [posts]);

    return (
        <postsContext.Provider value={{ posts, setPosts }}>
            {children}
        </postsContext.Provider>
    );
}
