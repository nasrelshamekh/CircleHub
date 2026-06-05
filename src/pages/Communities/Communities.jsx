import CommunityCard from "@/components/communitycard/CommunityCard";
import CommunityCardSuggestion from "@/components/communitycard/CommunityCardSuggestion";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityMembership } from "@/hooks/useCommunityMembership";
import { useCommunities } from "@/hooks/useCommunities";

export default function Communities() {
    const { communities } = useCommunities();
    const { userData } = useAuth();
    const { handleCommunityMembershipChange } = useCommunityMembership();

    const adminCommunities = communities.filter(
        (community) => community.admin.id === userData.id
    );
    const joinedCommunities = communities.filter(
        (community) =>
            community.admin.id !== userData.id &&
            ["joined", "requested"].includes(community.membershipStatus)
    );
    const suggestedCommunities = communities.filter(
        (community) => community.membershipStatus === "not_joined"
    );

    return (
        <section className="content-stack max-w-7xl">
            <div>
                <h1 className="type-headline-responsive text-primary">Communities</h1>
                <p className="type-body-md mt-2 text-secondary">
                    Keep up with the communities you joined and discover new ones.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="space-y-6">
                        <CommunityCard
                            communities={adminCommunities}
                            onMembershipChange={handleCommunityMembershipChange}
                            title="Communities You Manage"
                            description="Communities where you are the admin."
                            emptyTitle="No managed communities"
                            emptyDescription="Communities you create or manage will appear here."
                            showAdminBadge
                        />

                        <CommunityCard
                            communities={joinedCommunities}
                            onMembershipChange={handleCommunityMembershipChange}
                        />
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <CommunityCardSuggestion
                        communities={suggestedCommunities}
                        onMembershipChange={handleCommunityMembershipChange}
                    />
                </div>
            </div>
        </section>
    );
}
