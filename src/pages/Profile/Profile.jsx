import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileInfoPanels from "@/components/profile/ProfileInfoPanels"
import ProfileTabs from "@/components/profile/ProfileTabs"
import users from "@/data/users"
import networks from "@/data/network";
import { useAuth } from "@/hooks/useAuth"
import { usePosts } from "@/hooks/usePosts"
import { togglePostLikeInList } from "@/lib/postLikes";
import { useParams } from "react-router-dom"

export default function Profile() {
    const { username } = useParams();
    const { userData } = useAuth();
    const { posts, setPosts } = usePosts();
    const routeUser = users.find((user) => user.username === username);
    const user = username === userData.username || routeUser?.id === userData.id ? userData : routeUser;
    const isCurrentUser = user?.id === userData.id;
    const followingIds = userData.followingIds || [];
    const profileNetwork = networks.find((network) => network.userId === user?.id);
    const currentUserNetwork = networks.find(
        (network) => network.userId === userData.id
    );
    const profileFollowers = profileNetwork?.followers || [];
    const profileFollowing = profileNetwork?.following || [];
    const profileFollowingIds = profileFollowing.map((followedUser) => followedUser.id);
    const connectionUsers = isCurrentUser
        ? users.filter((profileUser) => followingIds.includes(profileUser.id))
        : users.filter(
            (profileUser) =>
                followingIds.includes(profileUser.id) &&
                profileFollowingIds.includes(profileUser.id)
        );
    const connectionsTitle = isCurrentUser ? "Your Connections" : "Mutual Connections";
    const currentUserFollowsProfile = user ? followingIds.includes(user.id) : false;
    const profileFollowersIncludeCurrentUser = profileFollowers.some(
        (follower) => follower.id === userData.id
    );
    const followersCount =
        profileFollowers.length +
        (!isCurrentUser && currentUserFollowsProfile && !profileFollowersIncludeCurrentUser ? 1 : 0);
    const followingCount = isCurrentUser ? followingIds.length : profileFollowing.length;
    const displayUser = user
        ? {
            ...user,
            followersCount,
            followingCount,
        }
        : user;

    const followsMe = currentUserNetwork?.followers.some(
        (follower) => follower.id === user?.id
    );
    const profilePosts = posts.map((post) =>
        post.author.id === userData.id
            ? { ...post, author: userData, authorUsername: userData.username }
            : post
    );
    const userPostsCount = user
        ? profilePosts.filter((post) => post.author.id === user.id).length
        : 0;

    function toggleLike(postId) {
        setPosts((currentPosts) =>
            togglePostLikeInList(currentPosts, postId, userData.id)
        );
    }

    if (!user) {
        return (
            <section className="content-stack max-w-4xl">
                <div className="content-card-padded text-center">
                    <h1 className="type-headline-md text-primary">Profile not found</h1>
                    <p className="type-body-sm-readable mt-2 text-secondary">
                        The profile you are looking for does not exist.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <>
            <section className="w-full pb-20 lg:pb-0">
                <ProfileHeader followsMe={followsMe} user={displayUser} isCurrentUser={isCurrentUser} postsCount={userPostsCount} />

                <div className="mx-auto grid w-full max-w-7xl grid-cols-4 gap-6 p-6">
                    <div className="order-2 lg:order-1 col-span-4 lg:col-span-3">
                        <ProfileTabs user={displayUser} posts={profilePosts} onToggleLike={toggleLike} />
                    </div>

                    <div className="order-1 lg:order-2 col-span-4 lg:col-span-1">
                        <ProfileInfoPanels
                            user={displayUser}
                            connections={connectionUsers}
                            connectionsTitle={connectionsTitle}
                        />
                    </div>

                </div>
            </section>
        </>
    )
}
