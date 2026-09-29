import { useParams, useSearchParams } from "react-router-dom";

import FollowersTabs from "@/components/followers/FollowersTabs";
import { useUserFollowers } from "@/hooks/useUserFollowers";
import { useUserFollowing } from "@/hooks/useUserFollowing";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Followers() {
    const { username } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: profileUser, isLoading: isLoadingProfile } = useUserProfile(username);
    const { followers } = useUserFollowers(username);
    const { following } = useUserFollowing(username);


    const activeTab = searchParams.get("tab") === "following" ? "following" : "followers";

    function handleTabChange(tab) {
        setSearchParams({ tab });
    }

    if (isLoadingProfile) {
        return null;
    }

    if (!profileUser) {
        return (
            <section className="content-stack max-w-4xl">
                <div className="content-card-padded text-center">
                    <h1 className="type-headline-md text-primary">Profile not found</h1>
                    <p className="type-body-sm-readable mt-2 text-secondary">
                        The profile network you are looking for does not exist.
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="content-stack max-w-7xl">
            <div>
                <h1 className="type-headline-responsive text-primary">
                    {profileUser.name}
                </h1>

                <p className="type-body-md mt-2 text-secondary">
                    View @{profileUser.username}'s followers and following.
                </p>
            </div>

            <FollowersTabs
                followers={followers}
                following={following}
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />
        </section>
    );
}
