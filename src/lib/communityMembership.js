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
