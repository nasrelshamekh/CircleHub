import CreatePost from '@/components/createpost/CreatePost'
import PostCard from '@/components/post/Post'
import { usePosts } from '@/hooks/usePosts';
import { toast } from 'sonner';

export default function Feed() {
    const { posts, setPosts } = usePosts();

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
                        />
                    ))}

                </div>
            </main>
        </>
    )
}
