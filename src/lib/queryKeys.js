export const queryKeys = {
    me: () => ["users", "me"],

    feed: () => ["feed"],

    post: (id) => ["post", id],

    user: (username) => ["user", username],
    userPosts: (username) => ["user", username, "posts"],
    userLikedPosts: (username) => ["user", username, "liked-posts"],
    userFollowers: (username) => ["user", username, "followers"],
    userFollowing: (username) => ["user", username, "following"],
    userCommunities: (username) => ["user", username, "communities"],
    suggestedUsers: () => ["users", "suggested"],

    communities: () => ["communities"],
    communityCategories: () => ["communities", "categories"],
    community: (slug) => ["community", slug],
    communityMembers: (id) => ["community", id, "members"],
    communityPosts: (id) => ["community", id, "posts"],
    communityRequests: (id) => ["community", id, "requests"],

    search: (params) => [
        "search",
        typeof params === "string"
            ? { q: params }
            : {
                  q: params?.q ?? "",
                  type: params?.type ?? "all",
                  sort: params?.sort ?? "latest",
                  mediaOnly: Boolean(params?.mediaOnly),
              },
    ],

    conversations: () => ["messages", "conversations"],
    conversation: (id) => ["messages", "conversations", id],
    messageRecipients: () => ["messages", "recipients"],

    notifications: () => ["notifications"],
};
