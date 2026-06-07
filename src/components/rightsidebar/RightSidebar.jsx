import { CheckCircle2 } from "lucide-react";

import suggestedUsers from "@/data/suggestedUsers";
import { useAuth } from "@/hooks/useAuth";
import { useCommunities } from "@/hooks/useCommunities";
import SuggestedCard from "../suggestedcard/SuggestedCard";
import SuggestedCommunitiesCard from "../suggestedcard/SuggestedCommunitiesCard";

export default function RightSidebar() {
    const { userData } = useAuth();
    const { communities } = useCommunities();
    const followingIds = userData.followingIds || [];
    const hasSuggestedPeople = suggestedUsers.some(
        (user) => !followingIds.includes(user.id)
    );
    const hasSuggestedCommunities = communities.some(
        (community) => community.membershipStatus === "not_joined"
    );
    const isAllCaughtUp = !hasSuggestedPeople && !hasSuggestedCommunities;

    return (
        <div className="h-[calc(100vh-5rem)] top-20 space-y-6 pt-6 pr-6 w-full mx-auto">
            {isAllCaughtUp ? (
                <div className="content-card p-4 text-center">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                        <CheckCircle2 size={22} />
                    </div>

                    <h2 className="type-title-lg mt-3 text-primary">
                        You're all caught up
                    </h2>

                    <p className="type-body-sm-readable mt-2 text-secondary">
                        No new people or communities to suggest right now.
                    </p>
                </div>
            ) : (
                <>
                    <SuggestedCard />
                    <SuggestedCommunitiesCard />
                </>
            )}
        </div>
    )
}
