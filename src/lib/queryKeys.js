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

    search: (query) => ["search", query],
};
