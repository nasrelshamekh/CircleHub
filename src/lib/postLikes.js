export function togglePostLikeInList(posts, postId, userId) {
    return posts.map((post) => {
        if (post.id !== postId) return post;

        const currentLikedBy = post.likedBy || [];
        const isLiked = currentLikedBy.includes(userId);
        const likedBy = isLiked
            ? currentLikedBy.filter((likedUserId) => likedUserId !== userId)
            : [...currentLikedBy, userId];

        return {
            ...post,
            likedBy,
            likesCount: likedBy.length,
        };
    });
}
