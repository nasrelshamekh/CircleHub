import { useParams } from "react-router-dom";

import CommunityHeader from "@/components/communitydetails/CommunityHeader";
import CommunityInfoPanels from "@/components/communitydetails/CommunityInfoPanels";
import CommunityTabs from "@/components/communitydetails/CommunityTabs";
import CommunityDetailsSkeleton from "@/components/Skeletons/CommunityDetailsSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityMembers } from "@/hooks/useCommunityMembers";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { useCommunityDetails } from "@/hooks/useCommunityDetails";
import { useToggleLike } from '@/hooks/mutations/useToggleLike'
import { useDeletePost } from '@/hooks/mutations/useDeletePost'
import { useToggleCommunityMembership } from '@/hooks/mutations/useToggleCommunityMembership'

export default function CommunitiesDetails() {
    const { slug } = useParams();
    const { community, isLoading } = useCommunityDetails(slug);
    const { posts } = useCommunityPosts(community?.id);
    const { members } = useCommunityMembers(community?.id);
    const { userData } = useAuth();

    const toggleLike = useToggleLike();
    const deletePost = useDeletePost();
    const toggleMembership = useToggleCommunityMembership();

    function handleDeleteCommunityPost(postId) {
        const post = posts.find((p) => p.id === postId);
        if (!post) return;
        deletePost.mutate(post);
    }

    function handleCommunityMembershipChange() {
        if (!community) return;
        toggleMembership.mutate({ community });
    }

    if (isLoading) {
        return <CommunityDetailsSkeleton />;
    }

    if (!community) {
        return (
            <section className="content-stack max-w-4xl">
                <div className="content-card-padded text-center">
                    <h1 className="type-headline-md text-primary">Community not found</h1>
                    <p className="type-body-sm-readable mt-2 text-secondary">
                        The community you are looking for does not exist.
                    </p>
                </div>
            </section>
        );
    }

    const isAdmin = community.admin.id === userData.id;
    const currentUserMember = members.find((member) => member.id === userData.id);
    const isModerator = currentUserMember?.communityRole === "moderator";
    const isCommunityMember = Boolean(currentUserMember) || isAdmin;
    const canManagePosts = isAdmin || isModerator;

    return (
        <section className="w-full pb-20 lg:pb-0">
            <CommunityHeader
                community={community}
                membersCount={community.membersCount}
                postsCount={community.postsCount}
                onMembershipChange={handleCommunityMembershipChange}
            />

            <div className="mx-auto grid w-full max-w-7xl grid-cols-4 gap-6 p-6">
                <div className="order-2 col-span-4 lg:order-1 lg:col-span-3">
                    <CommunityTabs
                        community={community}
                        members={members}
                        posts={posts}
                        userData={userData}
                        canManagePosts={canManagePosts}
                        onDeletePost={handleDeleteCommunityPost}
                        onToggleLike={(id) => toggleLike.mutate(id)}
                        canCreatePost={isCommunityMember}
                    />
                </div>

                <div className="order-1 col-span-4 lg:order-2 lg:col-span-1">
                    <CommunityInfoPanels community={community} members={members} membersCount={community.membersCount} posts={posts} />
                </div>
            </div>
        </section>
    );
}
