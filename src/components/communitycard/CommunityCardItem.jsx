import { Check, Clock, FileText, Hash, Lock, ShieldUser, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";

export default function CommunityCardItem({
    community,
    onMembershipChange,
    showAdminBadge = false,
    displayOnly = false,
    adminBadgeLabel = "Admin",
}) {
    const isRequested = community.membershipStatus === "requested";
    const isPrivate = community.visibility === "private";
    const membersCount = community.members.length;
    const { communityPosts } = useCommunityPosts();
    const postsCount = communityPosts.filter((post) => post.communitySlug === community.slug).length;

    return (
        <article className="flex min-w-0 flex-col overflow-hidden rounded-lg bg-(--surface-low)">
            <Link to={`/communities/${community.slug}`}>
                <img
                    src={community.image}
                    alt={community.name}
                    className="h-36 w-full object-cover"
                />
            </Link>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                        <Link
                            to={`/communities/${community.slug}`}
                            className="min-w-0 text-(length:--text-body-md) font-semibold text-(--text-primary) transition hover:text-(--primary)"
                        >
                            <span className="block truncate">{community.name}</span>
                        </Link>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                            <span className="type-label-sm rounded-full bg-(--active) px-3 py-1 text-(--primary)">
                                {community.category}
                            </span>

                            {showAdminBadge && (
                                <span className="flex items-center gap-1.5 type-label-sm rounded-full bg-(--surface-lowest) px-3 py-1 text-(--primary)">
                                    <ShieldUser size={14} />
                                    {adminBadgeLabel}
                                </span>
                            )}
                        </div>
                    </div>

                    <p className="mt-1 flex items-center gap-1.5 text-(length:--text-label-sm) text-(--text-secondary)">
                        <Hash size={14} />
                        {community.slug}
                    </p>
                </div>

                <p className="line-clamp-2 text-(length:--text-body-sm) leading-6 text-(--text-secondary)">
                    {community.description}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-(length:--text-label-sm) text-(--text-secondary)">
                    <span className="flex items-center gap-1.5">
                        <Users size={15} />
                        {membersCount} members
                    </span>

                    <span className="flex items-center gap-1.5">
                        <FileText size={15} />
                        {postsCount} posts
                    </span>

                    <span className="flex items-center gap-1.5">
                        {isPrivate ? <Lock size={15} /> : <Hash size={15} />}
                        {isPrivate ? "Private" : "Public"}
                    </span>

                </div>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-(--border) pt-3">
                    <span className="flex items-center gap-1.5 text-(length:--text-label-sm) text-(--text-secondary)">
                        {isRequested ? <Clock size={15} /> : <Check size={15} />}
                        {showAdminBadge ? adminBadgeLabel : isRequested ? "Request pending" : "Member"}
                    </span>

                    {!showAdminBadge && !displayOnly && (
                        <button
                            type="button"
                            onClick={() => onMembershipChange?.(community.id)}
                            className="cursor-pointer rounded-xl bg-(--surface-lowest) px-4 py-2 text-(length:--text-label-sm) font-medium text-(--error) transition hover:bg-(--error-container) hover:text-(--on-error-container)"
                        >
                            {isRequested ? "Cancel" : "Leave"}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
