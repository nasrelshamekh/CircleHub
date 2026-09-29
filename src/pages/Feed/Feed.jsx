import { useEffect, useRef } from 'react'

import CreatePost from '@/components/createpost/CreatePost'
import PostCard from '@/components/post/Post'
import PostSkeleton from '@/components/Skeletons/PostSkeleton'
import CreatePostSkeleton from '@/components/Skeletons/CreatePostSkeleton'
import { useFeedPosts } from '@/hooks/useFeedPosts'
import { useDeletePost } from '@/hooks/mutations/useDeletePost'
import { useToggleLike } from '@/hooks/mutations/useToggleLike'
import { toast } from 'sonner'

export default function Feed() {
    const { posts, isLoading, isLoadingMore, hasMore, loadMore } = useFeedPosts();
    const toggleLike = useToggleLike();
    const deletePost = useDeletePost();
    const sentinelRef = useRef(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !isLoadingMore) {
                    loadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, loadMore]);

    function handleDeletePost(postId) {
        const post = posts.find((p) => p.id === postId);
        if (!post) {
            toast.error("Post not found");
            return;
        }
        deletePost.mutate(post);
    }

    return (
        <main>
            <div className="content-stack max-w-4xl">
                {isLoading ? (
                    <CreatePostSkeleton />
                ) : (
                    <CreatePost />
                )}

                {isLoading && Array.from({ length: 3 }, (_, index) => (
                    <PostSkeleton key={index} />
                ))}

                {!isLoading && posts.length === 0 && (
                    <div className="content-card-padded text-secondary">
                        No posts yet.
                    </div>
                )}

                {!isLoading && posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onDelete={handleDeletePost}
                        onToggleLike={(id) => toggleLike.mutate(id)}
                    />
                ))}

                {/* Invisible sentinel â€” triggers loadMore when it enters view. */}
                {!isLoading && hasMore && (
                    <div ref={sentinelRef} className="h-1" />
                )}

                {/* Skeletons at the bottom while the next page loads. */}
                {isLoadingMore && (
                    <>
                        <PostSkeleton />
                        <PostSkeleton />
                    </>
                )}

                {!isLoading && !hasMore && posts.length > 0 && (
                    <p className="mt-2 py-4 text-center text-(length:--text-label-sm) text-(--text-secondary)">
                        You're all caught up
                    </p>
                )}
            </div>
        </main>
    )
}
