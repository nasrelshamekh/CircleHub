import { FileText, Lock, Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { useCommunityMembership } from "@/hooks/useCommunityMembership";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { useCommunities } from "@/hooks/useCommunities";

export default function SuggestedCommunitiesCard() {
    const { communities } = useCommunities();
    const { communityPosts } = useCommunityPosts();
    const { handleCommunityMembershipChange } = useCommunityMembership();
    const suggestedCommunities = communities
        .filter((community) => community.membershipStatus === "not_joined")
        .slice(0, 3);

    if (suggestedCommunities.length === 0) return null;

    return (
        <div className="content-card p-4">
            <h2 className="type-title-lg mb-4 text-primary">
                Suggested Communities
            </h2>

            <div className="space-y-3">
                {suggestedCommunities.map((community) => {
                    const isPrivate = community.visibility === "private";
                    const membersCount = community.members.length;
                    const postsCount = communityPosts.filter((post) => post.communitySlug === community.slug).length;

                    return (
                        <article key={community.id} className="rounded-xl p-2 transition hover:bg-(--hover)">
                            <Link to={`/communities/${community.slug}`} className="flex items-center gap-3">
                                <img
                                    src={community.image}
                                    alt={community.name}
                                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                />

                                <div className="min-w-0 flex-1">
                                    <h3 className="type-label-md truncate text-primary">
                                        {community.name}
                                    </h3>

                                    <p className="type-label-sm truncate text-secondary">
                                        {community.category}
                                    </p>
                                </div>
                            </Link>

                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-(length:--text-label-sm) text-(--text-secondary)">
                                <span className="flex items-center gap-1">
                                    <Users size={14} />
                                    {membersCount}
                                </span>

                                <span className="flex items-center gap-1">
                                    <FileText size={14} />
                                    {postsCount}
                                </span>

                                {isPrivate && (
                                    <span className="flex items-center gap-1">
                                        <Lock size={14} />
                                        Private
                                    </span>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => handleCommunityMembershipChange(community.id)}
                                className="button-primary mt-2 flex w-full items-center justify-center gap-2 px-4 py-2 text-(length:--text-label-sm)"
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
