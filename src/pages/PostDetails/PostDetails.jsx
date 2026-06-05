import PostCard from '@/components/post/Post'
import { MoveLeft, SearchX } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import CommentList from "@/components/comment/CommentList"
import { useCommunityPosts } from "@/hooks/useCommunityPosts"
import { usePosts } from "@/hooks/usePosts"
import { toast } from "sonner"

export default function PostDetails() {
    const { posts: feedPosts, setPosts } = usePosts();
    const { communityPosts, setCommunityPosts } = useCommunityPosts();
    const posts = [...feedPosts, ...communityPosts];

    const { id } = useParams()
    const navigate = useNavigate()
    const post = posts.find((post) => post.id === Number(id));
    const isFeedPost = feedPosts.some((feedPost) => feedPost.id === post?.id);
    const backPath = post?.communitySlug ? `/communities/${post.communitySlug}` : "/feed";
    const backLabel = post?.communitySlug ? "Back To Community" : "Back To Feed";

    function handleDeletePost(postId) {
        const postExists = feedPosts.some((feedPost) => feedPost.id === postId);

        if (!postExists) {
            toast.error("Post not found");
            return;
        }

        setPosts((currentPosts) =>
            currentPosts.filter((currentPost) => currentPost.id !== postId)
        );

        toast.success("Post deleted successfully");
        navigate("/feed");
    }

    function handleAddComment(postId, newComment) {
        if (isFeedPost) {
            setPosts((currentPosts) =>
                currentPosts.map((currentPost) =>
                    currentPost.id === postId
                        ? {
                            ...currentPost,
                            comments: [newComment, ...(currentPost.comments || [])],
                            commentsCount: currentPost.commentsCount + 1,
                        }
                        : currentPost
                )
            );

            toast.success("Comment added successfully");
            return;
        }

        setCommunityPosts((currentPosts) =>
            currentPosts.map((currentPost) =>
                currentPost.id === postId
                    ? {
                        ...currentPost,
                        comments: [newComment, ...(currentPost.comments || [])],
                        commentsCount: currentPost.commentsCount + 1,
                    }
                    : currentPost
            )
        );

        toast.success("Comment added successfully");
    }

    function handleDeleteComment(postId, commentId) {
        if (isFeedPost) {
            setPosts((currentPosts) =>
                currentPosts.map((currentPost) =>
                    currentPost.id === postId
                        ? {
                            ...currentPost,
                            comments: (currentPost.comments || []).filter(
                                (comment) => comment.id !== commentId
                            ),
                            commentsCount: currentPost.commentsCount - 1,
                        }
                        : currentPost
                )
            );

            toast.success("Comment has been deleted");
            return;
        }

        setCommunityPosts((currentPosts) =>
            currentPosts.map((currentPost) =>
                currentPost.id === postId
                    ? {
                        ...currentPost,
                        comments: (currentPost.comments || []).filter(
                            (comment) => comment.id !== commentId
                        ),
                        commentsCount: currentPost.commentsCount - 1,
                    }
                    : currentPost
            )
        );

        toast.success("Comment has been deleted");
    }

    return (
        <>
            <div className="content-stack gap-4 max-w-5xl">

                {post ? (<>
                    <button type="button" onClick={() => navigate(backPath)} className="button-primary type-button inline-flex w-fit self-start items-center justify-center gap-1 rounded-full px-3 py-1">
                        <MoveLeft className="size-5 lg:size-6" />
                        {backLabel}
                    </button>
                    <PostCard
                        post={post}
                        onDelete={isFeedPost ? handleDeletePost : undefined}
                    />
                    <CommentList onDeleteComment={handleDeleteComment} onAddComment={handleAddComment} post={post} />
                </>) : (
                    <div className="content-card flex flex-col items-center justify-center gap-4 p-10 text-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-(--active) text-(--primary)">
                            <SearchX size={38} />
                        </div>

                        <div>
                            <h2 className="type-headline-md text-primary">
                                Post not found
                            </h2>

                            <p className="type-body-sm-readable mt-2 max-w-md text-secondary">
                                This post may have been removed, or the link you followed is no
                                longer available.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate("/feed")}
                            className="button-primary type-button flex gap-2 items-center mt-2 rounded-full px-5 py-3">
                            <MoveLeft />
                            Return to Feed
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
