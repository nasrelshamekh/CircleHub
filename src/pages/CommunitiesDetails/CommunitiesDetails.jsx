import { useParams } from "react-router-dom";

import CommunityHeader from "@/components/communitydetails/CommunityHeader";
import CommunityInfoPanels from "@/components/communitydetails/CommunityInfoPanels";
import CommunityTabs from "@/components/communitydetails/CommunityTabs";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityMembership } from "@/hooks/useCommunityMembership";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { useCommunities } from "@/hooks/useCommunities";
import { toast } from "sonner";

export default function CommunitiesDetails() {
    const { slug } = useParams();
    const { communities } = useCommunities();
    const { communityPosts, setCommunityPosts } = useCommunityPosts();
    const { userData } = useAuth();
    const { handleCommunityMembershipChange } = useCommunityMembership();
    const community = communities.find((item) => item.slug === slug);

    function handleDeleteCommunityPost(postId) {
        setCommunityPosts((currentPosts) =>
            currentPosts.filter((post) => post.id !== postId)
        );

        toast.success("Community post deleted successfully");
    }

    function handleCreateCommunityPost(newPost) {
        setCommunityPosts((currentPosts) => [newPost, ...currentPosts]);
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

    const members = community.members || [community.admin];
    const posts = communityPosts
        .filter((post) => post.communitySlug === community.slug);
    const isAdmin = community.admin.id === userData.id;
    const currentUserMember = members.find((member) => member.id === userData.id);
    const isModerator = currentUserMember?.communityRole === "moderator";
    const isCommunityMember = Boolean(currentUserMember) || isAdmin;
    const canManagePosts = isAdmin || isModerator;

    return (
        <section className="w-full pb-20 lg:pb-0">
            <CommunityHeader
                community={community}
                membersCount={members.length}
                postsCount={posts.length}
                onMembershipChange={handleCommunityMembershipChange}
                isAdmin={isAdmin}
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
                        canCreatePost={isCommunityMember}
                        onCreatePost={handleCreateCommunityPost}
                    />
                </div>

                <div className="order-1 col-span-4 lg:order-2 lg:col-span-1">
                    <CommunityInfoPanels community={community} members={members} membersCount={members.length} posts={posts} />
                </div>
            </div>
        </section>
    );
}
