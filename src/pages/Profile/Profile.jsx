import ProfileHeader from "@/components/profile/ProfileHeader"
import ProfileInfoPanels from "@/components/profile/ProfileInfoPanels"
import ProfileTabs from "@/components/profile/ProfileTabs"
import ProfileSkeleton from "@/components/Skeletons/ProfileSkeleton"
import { useAuth } from "@/hooks/useAuth"
import { useProfileLikedPosts } from "@/hooks/useProfileLikedPosts"
import { useUserCommunities } from "@/hooks/useUserCommunities"
import { useUserFollowing } from "@/hooks/useUserFollowing"
import { useUserPosts } from "@/hooks/useUserPosts"
import { useUserProfile } from "@/hooks/useUserProfile"
import { useToggleLike } from '@/hooks/mutations/useToggleLike'
import { useParams } from "react-router-dom"

export default function Profile() {
    const { username } = useParams();
    const { userData } = useAuth();
    const { user, isLoading: isLoadingProfile } = useUserProfile(username);
    const {
        posts: userPosts,
        isLoading: isLoadingUserPosts,
    } = useUserPosts(username);
    const {
        likedPosts,
        isLoading: isLoadingLikedPosts,
    } = useProfileLikedPosts(username);
    const { communities: userCommunities } = useUserCommunities(username);

    const { following: myFollowing } = useUserFollowing(userData.username);
    const { following: profileFollowing } = useUserFollowing(
        user && !user.isCurrentUser ? username : userData.username
    );

    const connectionUsers = user?.isCurrentUser
        ? myFollowing
        : myFollowing.filter((u) =>
            profileFollowing.some((pf) => pf.id === u.id)
        );
    const connectionsTitle = user?.isCurrentUser ? "Your Connections" : "Mutual Connections";

    const toggleLike = useToggleLike();

    if (isLoadingProfile) {
        return <ProfileSkeleton />;
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
        <section className="w-full pb-20 lg:pb-0">
            <ProfileHeader
                followsMe={user.followsMe}
                user={user}
                isCurrentUser={user.isCurrentUser}
                postsCount={user.postsCount}
            />

            <div className="mx-auto grid w-full max-w-7xl grid-cols-4 gap-6 p-6">
                <div className="order-2 lg:order-1 col-span-4 lg:col-span-3">
                    <ProfileTabs
                        user={user}
                        posts={userPosts}
                        likedPosts={likedPosts}
                        isLoadingPosts={isLoadingUserPosts}
                        isLoadingLikedPosts={isLoadingLikedPosts}
                        onToggleLike={(id) => toggleLike.mutate(id)}
                    />
                </div>

                <div className="order-1 lg:order-2 col-span-4 lg:col-span-1">
                    <ProfileInfoPanels
                        user={user}
                        connections={connectionUsers}
                        connectionsTitle={connectionsTitle}
                        userCommunities={userCommunities}
                    />
                </div>
            </div>
        </section>
    )
}
