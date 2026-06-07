import { FileText, Lock, Plus, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { useCommunities } from "@/hooks/useCommunities";
import { getCommunityMembershipToast, updateCommunityMembership } from "@/lib/communityMembership";
import { toast } from "sonner";

export default function SuggestedCommunitiesCard() {
    const { communities, setCommunities } = useCommunities();
    const { communityPosts } = useCommunityPosts();
    const { userData } = useAuth();
    const suggestedCommunities = communities
        .filter((community) => community.membershipStatus === "not_joined")
        .slice(0, 3);

    function handleCommunityMembershipChange(communityId) {
        const selectedCommunity = communities.find((community) => community.id === communityId);

        if (!selectedCommunity) return;

        setCommunities((currentCommunities) =>
            updateCommunityMembership(currentCommunities, communityId, userData)
        );

        toast.success(getCommunityMembershipToast(selectedCommunity));
    }

    if (suggestedCommunities.length === 0) return null;

    return (
        <div className="content-card p-4">
            <h2 className="type-title-lg mb-4 text-primary">
                Suggested Communities
            </h2>

            <div className="space-y-4">
                {suggestedCommunities.map((community) => {
                    const isPrivate = community.visibility === "private";
                    const membersCount = community.members.length;
                    const postsCount = communityPosts.filter((post) => post.communitySlug === community.slug).length;

                    return (
                        <article key={community.id} className="rounded-xl bg-(--surface-low) p-3 transition hover:bg-(--hover)">
                            <Link to={`/communities/${community.slug}`} className="flex items-start gap-3">
                                <img
                                    src={community.image}
                                    alt={community.name}
                                    className="h-14 w-14 shrink-0 rounded-lg object-cover"
                                />

                                <div className="min-w-0 flex-1">
                                    <h3 className="type-label-md truncate text-primary">
                                        {community.name}
                                    </h3>

                                    <p className="type-label-sm truncate text-secondary">
                                        {community.category}
                                    </p>

                                    <p className="type-label-sm mt-1 flex items-center gap-1 truncate text-secondary">
                                        <ShieldCheck size={13} />
                                        {community.admin.name}
                                    </p>
                                </div>
                            </Link>

                            <p className="type-body-sm-readable mt-3 line-clamp-2 text-secondary">
                                {community.description}
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-(length:--text-label-sm) text-(--text-secondary)">
                                <span className="flex items-center gap-1.5 rounded-lg bg-(--surface) px-2 py-1.5">
                                    <Users size={14} />
                                    {membersCount} members
                                </span>

                                <span className="flex items-center gap-1.5 rounded-lg bg-(--surface) px-2 py-1.5">
                                    <FileText size={14} />
                                    {postsCount} posts
                                </span>

                                {isPrivate && (
                                    <span className="col-span-2 flex items-center gap-1.5 rounded-lg bg-(--surface) px-2 py-1.5">
                                        <Lock size={14} />
                                        Private community
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => handleCommunityMembershipChange(community.id)}
                                className="button-primary mt-3 flex w-full items-center justify-center gap-2 px-4 py-2 text-(length:--text-label-sm)"
                            >
                                <Plus size={15} />
                                {isPrivate ? "Request" : "Join"}
                            </button>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
