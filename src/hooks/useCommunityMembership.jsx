import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useCommunities } from "@/hooks/useCommunities";

export function useCommunityMembership() {
    const { communities, setCommunities } = useCommunities();
    const { userData } = useAuth();

    function handleCommunityMembershipChange(communityId) {
        const selectedCommunity = communities.find(
            (community) => community.id === communityId
        );

        if (!selectedCommunity) return;

        setCommunities((currentCommunities) =>
            currentCommunities.map((community) => {
                if (community.id !== communityId) return community;

                if (community.membershipStatus === "joined") {
                    return {
                        ...community,
                        membershipStatus: "not_joined",
                        members: community.members.filter(
                            (member) => member.id !== userData.id
                        ),
                    };
                }

                if (community.membershipStatus === "requested") {
                    return {
                        ...community,
                        membershipStatus: "not_joined",
                        requests: community.requests.filter(
                            (request) => request.user.id !== userData.id
                        ),
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

    return { handleCommunityMembershipChange };
}
