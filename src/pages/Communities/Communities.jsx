import { CirclePlus } from "lucide-react";
import { useState } from "react";

import CommunityCard from "@/components/communitycard/CommunityCard";
import CommunityCardSuggestion from "@/components/communitycard/CommunityCardSuggestion";
import CreateCommunityModal from "@/components/createcommunity/CreateCommunityModal";
import { useCommunities } from "@/hooks/useCommunities";
import { useToggleCommunityMembership } from "@/hooks/mutations/useToggleCommunityMembership";

export default function Communities() {
    const { communities } = useCommunities();
    const toggleMembership = useToggleCommunityMembership();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const managedCommunities = communities.filter(
        (community) =>
            community.viewerRole === "admin" ||
            community.viewerRole === "moderator"
    );
    const joinedCommunities = communities.filter(
        (community) =>
            community.viewerRole === "member" ||
            community.membershipStatus === "requested"
    );
    const suggestedCommunities = communities.filter(
        (community) => community.membershipStatus === "not_joined"
    );

    function handleCommunityMembershipChange(communityId) {
        const community = communities.find((c) => c.id === communityId);
        if (!community) return;
        toggleMembership.mutate({ community });
    }

    return (
        <section className="content-stack max-w-7xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="type-headline-responsive text-primary">Communities</h1>
                    <p className="type-body-md mt-2 text-secondary">
                        Keep up with the communities you joined and discover new ones.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="button-primary flex items-center gap-2 rounded-full px-4 py-2"
                >
                    <CirclePlus size={18} />
                    Create Community
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <div className="space-y-6">
                        <CommunityCard
                            communities={managedCommunities}
                            onMembershipChange={handleCommunityMembershipChange}
                            title="Communities You Manage"
                            description="Communities where you are an admin or moderator."
                            emptyTitle="No managed communities"
                            emptyDescription="Communities you create or moderate will appear here."
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

            <CreateCommunityModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
            />
        </section>
    );
}
