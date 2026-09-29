import PostCard from '@/components/post/Post'
import { MoveLeft, SearchX } from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import CommentList from "@/components/comment/CommentList"
import { useAuth } from "@/hooks/useAuth"
import { useCommunities } from "@/hooks/useCommunities"
import { useToggleLike } from '@/hooks/mutations/useToggleLike'
import { useDeletePost } from '@/hooks/mutations/useDeletePost'
import { usePostDetails } from "@/hooks/usePostDetails"
import PostDetailsSkeleton from '@/components/Skeletons/PostDetailsSkeleton'
import { toast } from "sonner"

export default function PostDetails() {
    const { communities } = useCommunities();
    const { userData } = useAuth();
    const { id: postId } = useParams();
    const { post, isLoading } = usePostDetails(postId);
    const navigate = useNavigate();
    const toggleLike = useToggleLike();
    const deletePost = useDeletePost();

    const community = communities.find((c) => c.slug === post?.community?.slug);
    const currentUserMember = community?.members?.find((m) => m.id === userData.id);
    const isCommunityAdmin = community?.admin.id === userData.id;
    const isCommunityModerator = currentUserMember?.communityRole === "moderator";
    const isPostOwner = post?.author.id === userData.id;
    const isCommunityPost = Boolean(post?.community?.slug);
    const canDelete =
        isPostOwner ||
        (isCommunityPost && (isCommunityAdmin || isCommunityModerator));

    const backPath = isCommunityPost ? `/communities/${post.community?.slug}` : "/feed";
    const backLabel = isCommunityPost ? "Back To Community" : "Back To Feed";

    function handleDeletePost() {
        if (!post) return;
        if (!canDelete) {
            toast.error("You do not have permission to delete this post");
            return;
        }
        deletePost.mutate(post, {
            onSuccess: () => navigate(backPath),
        });
    }

    return (
        <>
            <div className="content-stack gap-4 max-w-5xl">
                {isLoading ? (
                    <PostDetailsSkeleton />
                ) : post ? (
                    <>
                        <button
                            type="button"
                            onClick={() => navigate(backPath)}
                            className="button-primary type-button inline-flex w-fit self-start items-center justify-center gap-1 rounded-full px-3 py-1"
                        >
                            <MoveLeft className="size-5 lg:size-6" />
                            {backLabel}
                        </button>
                        <PostCard
                            post={post}
                            onDelete={canDelete ? handleDeletePost : undefined}
                            canDelete={canDelete}
                            onToggleLike={(id) => toggleLike.mutate(id)}
                        />
                        <CommentList post={post} />
                    </>
                ) : (
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
    );
}
