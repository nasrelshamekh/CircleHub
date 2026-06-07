import CreatePost from '@/components/createpost/CreatePost'
import PostCard from '@/components/post/Post'
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { togglePostLikeInList } from '@/lib/postLikes';
import { toast } from 'sonner';

export default function Feed() {
    const { posts, setPosts } = usePosts();
    const { userData } = useAuth();

    function createPost(newPost) {
        setPosts((currentPosts) => [newPost, ...currentPosts]);
    }

    function deletePost(postId) {
        const postExists = posts.some((post) => post.id === postId);

        if (!postExists) {
            toast.error("Post not found");
            return;
        }

        setPosts((currentPosts) =>
            currentPosts.filter((post) => post.id !== postId)
        );

        toast.success("Post deleted successfully");
    }

    function toggleLike(postId) {
        setPosts((currentPosts) =>
            togglePostLikeInList(currentPosts, postId, userData.id)
        );
    }

    return (
        <>
            <main >
                <div className="content-stack max-w-4xl">
                    <CreatePost onCreatePost={createPost} />

                    {posts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onDelete={deletePost}
                            onToggleLike={toggleLike}
                        />
                    ))}

                </div>
            </main>
        </>
    )
}
