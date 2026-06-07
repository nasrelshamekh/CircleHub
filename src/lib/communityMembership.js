export function updateCommunityMembership(communities, communityId, userData) {
    return communities.map((community) => {
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
    });
}

export function getCommunityMembershipToast(community) {
    if (community.membershipStatus === "joined") {
        return `You left ${community.name}`;
    }

    if (community.membershipStatus === "requested") {
        return `Request cancelled for ${community.name}`;
    }

    return community.visibility === "private"
        ? `Request sent to ${community.name}`
        : `Joined ${community.name}`;
}

export function resetCommunitiesForNewUser(communities) {
    return communities.map((community) => ({
        ...community,
        membershipStatus: "not_joined",
        requests: community.requests || [],
    }));
}
