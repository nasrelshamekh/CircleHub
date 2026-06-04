import CommunityCard from "@/components/communitycard/CommunityCard";
import CommunityCardSuggestion from "@/components/communitycard/CommunityCardSuggestion";
import { useAuth } from "@/hooks/useAuth";
import { useCommunities } from "@/hooks/useCommunities";
import { toast } from "sonner";

export default function Communities() {
    const { communities, setCommunities } = useCommunities();
    const { userData } = useAuth();

    function handleCommunityMembershipChange(communityId) {
        const selectedCommunity = communities.find((community) => community.id === communityId);
        if (!selectedCommunity) return;

        setCommunities((currentCommunities) =>
            currentCommunities.map((community) => {
                if (community.id !== communityId) return community;

                if (community.membershipStatus === "joined") {
                    return {
                        ...community,
                        membershipStatus: "not_joined",
                        members: community.members.filter((member) => member.id !== userData.id),
                    };
                }

                if (community.membershipStatus === "requested") {
                    return {
                        ...community,
                        membershipStatus: "not_joined",
                        requests: community.requests.filter((request) => request.user.id !== userData.id),
                    };
                }

                if (community.visibility === "private") {
                    return {
                        ...community,
                        membershipStatus: "requested",
                        requests: [
                            ...community.requests,
                            {
                                id: Date.now(),
                                user: userData,
                                requestedAt: "Just now",
                                note: "Requested to join this community.",
                            },
                        ],
                    };
                }

                return {
                    ...community,
                    membershipStatus: "joined",
                    members: [
                        ...community.members,
                        {
                            ...userData,
                            communityRole: "member",
                        },
                    ],
                };
            })
        );

        if (selectedCommunity.membershipStatus === "joined") {
            toast.success(`You left ${selectedCommunity.name}`);
            return;
        }

        if (selectedCommunity.membershipStatus === "requested") {
            toast.success(`Request cancelled for ${selectedCommunity.name}`);
            return;
        }

        toast.success(
            selectedCommunity.visibility === "private"
                ? `Request sent to ${selectedCommunity.name}`
                : `Joined ${selectedCommunity.name}`
        );
    }

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
