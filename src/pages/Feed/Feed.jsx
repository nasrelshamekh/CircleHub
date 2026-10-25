import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowUp } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

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
            const existingIds = new Set((firstPage.data || []).map((p) => p.id || p.Id));
            const newItems = toPrepend.filter((p) => !existingIds.has(p.id || p.Id));

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
            const postId = newPost?.id || newPost?.Id;
            if (!postId) return;

            const alreadyInFeed = posts.some((p) => (p.id || p.Id) === postId);
            const alreadyPending = pendingPostsRef.current.some((p) => (p.id || p.Id) === postId);
            if (alreadyInFeed || alreadyPending) return;

            const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
            const isScrolledDown = scrollY > 60;
            if (isScrolledDown) {
                setPendingPosts((prev) => {
                    if (prev.some((p) => (p.id || p.Id) === postId)) return prev;
                    return [newPost, ...prev];
                });
            } else {
                queryClient.setQueryData(queryKeys.feed(), (old) => {
                    if (!old || !old.pages || old.pages.length === 0) return old;
                    const [firstPage, ...rest] = old.pages;
                    if (firstPage.data?.some((p) => (p.id || p.Id) === postId)) return old;
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
            const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
            if (scrollY <= 10 && pendingPostsRef.current.length > 0) {
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
                <AnimatePresence>
                    {pendingPosts.length > 0 && (
                        <div className="sticky top-24 z-40 flex justify-center w-full pointer-events-none -mt-2 mb-2">
                            <motion.button
                                type="button"
                                onClick={handleRevealNewPosts}
                                initial={{ opacity: 0, y: -16, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -16, scale: 0.9 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-(--primary-gradient-start) to-(--primary-gradient-end) px-4 py-2.5 text-sm font-semibold text-(--button-gradient-text) shadow-(--shadow-lg) transition-transform duration-200 ease-out hover:scale-105 active:scale-95"
                                aria-label={`Show ${pendingPosts.length} new ${pendingPosts.length === 1 ? 'post' : 'posts'}`}
                            >
                                <ArrowUp className="h-4 w-4" />
                                <span>
                                    {pendingPosts.length} New {pendingPosts.length === 1 ? 'Post' : 'Posts'}
                                </span>
                            </motion.button>
                        </div>
                    )}
                </AnimatePresence>

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
