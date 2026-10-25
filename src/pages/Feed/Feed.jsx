import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowUp } from 'lucide-react'

import CreatePost from '@/components/createpost/CreatePost'
import PostCard from '@/components/post/Post'
import PostSkeleton from '@/components/Skeletons/PostSkeleton'
import CreatePostSkeleton from '@/components/Skeletons/CreatePostSkeleton'
import { useFeedPosts } from '@/hooks/useFeedPosts'
import { useDeletePost } from '@/hooks/mutations/useDeletePost'
import { useToggleLike } from '@/hooks/mutations/useToggleLike'
import { queryKeys } from '@/lib/queryKeys'
import { toast } from 'sonner'

export default function Feed() {
    const { posts, isLoading, isLoadingMore, hasMore, loadMore } = useFeedPosts();
    const queryClient = useQueryClient();
    const toggleLike = useToggleLike();
    const deletePost = useDeletePost();
    const sentinelRef = useRef(null);

    const [pendingPosts, setPendingPosts] = useState([]);
    const pendingPostsRef = useRef([]);

    useEffect(() => {
        pendingPostsRef.current = pendingPosts;
    }, [pendingPosts]);

    const handleRevealNewPosts = useCallback(() => {
        const toPrepend = pendingPostsRef.current;
        if (toPrepend.length === 0) return;

        queryClient.setQueryData(queryKeys.feed(), (old) => {
            if (!old || !old.pages || old.pages.length === 0) return old;
            const [firstPage, ...rest] = old.pages;
            const existingIds = new Set((firstPage.data || []).map((p) => p.id));
            const newItems = toPrepend.filter((p) => !existingIds.has(p.id));

            return {
                ...old,
                pages: [
                    {
                        ...firstPage,
                        data: [...newItems, ...(firstPage.data || [])],
                    },
                    ...rest,
                ],
            };
        });

        setPendingPosts([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [queryClient]);

    useEffect(() => {
        const handlePostCreated = (event) => {
            const newPost = event.detail;
            if (!newPost?.id) return;

            const alreadyInFeed = posts.some((p) => p.id === newPost.id);
            const alreadyPending = pendingPostsRef.current.some((p) => p.id === newPost.id);
            if (alreadyInFeed || alreadyPending) return;

            const isScrolledDown = window.scrollY > 120;
            if (isScrolledDown) {
                setPendingPosts((prev) => {
                    if (prev.some((p) => p.id === newPost.id)) return prev;
                    return [newPost, ...prev];
                });
            } else {
                queryClient.setQueryData(queryKeys.feed(), (old) => {
                    if (!old || !old.pages || old.pages.length === 0) return old;
                    const [firstPage, ...rest] = old.pages;
                    if (firstPage.data?.some((p) => p.id === newPost.id)) return old;
                    return {
                        ...old,
                        pages: [
                            {
                                ...firstPage,
                                data: [newPost, ...(firstPage.data || [])],
                            },
                            ...rest,
                        ],
                    };
                });
            }
        };

        window.addEventListener("circlehub:post-created", handlePostCreated);
        return () => window.removeEventListener("circlehub:post-created", handlePostCreated);
    }, [posts, queryClient]);

    useEffect(() => {
        const onScroll = () => {
            if (window.scrollY <= 10 && pendingPostsRef.current.length > 0) {
                handleRevealNewPosts();
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [handleRevealNewPosts]);

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
            <div className="content-stack max-w-4xl relative">
                {pendingPosts.length > 0 && (
                    <div className="sticky top-4 z-30 flex justify-center w-full pointer-events-none mb-2">
                        <button
                            type="button"
                            onClick={handleRevealNewPosts}
                            className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full bg-(--primary) px-4 py-2 text-sm font-semibold text-(--on-primary) shadow-(--shadow-md) transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
                            aria-label={`Show ${pendingPosts.length} new ${pendingPosts.length === 1 ? 'post' : 'posts'}`}
                        >
                            <ArrowUp className="h-4 w-4" />
                            <span>
                                {pendingPosts.length} New {pendingPosts.length === 1 ? 'Post' : 'Posts'}
                            </span>
                        </button>
                    </div>
                )}

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

                {!isLoading && hasMore && (
                    <div ref={sentinelRef} className="h-1" />
                )}

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
