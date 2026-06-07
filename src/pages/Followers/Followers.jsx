import { useParams, useSearchParams } from "react-router-dom";

import FollowersTabs from "@/components/followers/FollowersTabs";
import networks from "@/data/network";
import users from "@/data/users";
import { useAuth } from "@/hooks/useAuth";

export default function Followers() {
    const { username } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { userData } = useAuth();
    const activeTab = searchParams.get("tab") === "following" ? "following" : "followers";
    const routeUser = users.find((user) => user.username === username);
    const profileUser = username === userData.username || routeUser?.id === userData.id ? userData : routeUser;

    function handleTabChange(tab) {
        setSearchParams({ tab });
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

    const profileNetwork = networks.find((network) => network.userId === profileUser.id);
    const followingIds = userData.followingIds || [];
    const profileFollowing =
        profileUser.id === userData.id
            ? users.filter((user) => followingIds.includes(user.id))
            : profileNetwork?.following || [];
    const followers = (profileNetwork?.followers || []).map((user) => ({
        ...(user.id === userData.id ? userData : user),
        isFollowing: followingIds.includes(user.id),
    }));
    const following = profileFollowing.map((user) => ({
        ...(user.id === userData.id ? userData : user),
        isFollowing: followingIds.includes(user.id),
    }));

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
