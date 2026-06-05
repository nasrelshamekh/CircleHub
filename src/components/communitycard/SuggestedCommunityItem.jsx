import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, FileText, Hash, Lock, Plus, ShieldUser, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";

export default function SuggestedCommunityItem({ community, onMembershipChange }) {
    const { userData } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const isPrivate = community.visibility === "private";
    const displayAdmin = community.admin.id === userData.id ? userData : community.admin;
    const membersCount = community.members.length;
    const { communityPosts } = useCommunityPosts();
    const postsCount = communityPosts.filter((post) => post.communitySlug === community.slug).length;

    return (
        <article className="rounded-lg bg-(--surface-low) p-3">
            <Link to={`/communities/${community.slug}`} className="block overflow-hidden rounded-lg">
                <img
                    src={community.image}
                    alt={community.name}
                    className="h-24 w-full object-cover"
                />
            </Link>

            <div className="mt-3 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <Link
                        to={`/communities/${community.slug}`}
                        className="min-w-0 text-(length:--text-label-md) font-semibold text-(--text-primary) transition hover:text-(--primary)"
                    >
                        <span className="block truncate">{community.name}</span>
                    </Link>

                    <span className="type-label-sm shrink-0 rounded-full bg-(--active) px-2.5 py-1 text-(--primary)">
                        {community.category}
                    </span>
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-(length:--text-label-sm) text-(--text-secondary)">
                    <Hash size={14} />
                    {community.slug}
                </p>

                <p className="mt-3 line-clamp-2 text-(length:--text-label-sm) leading-5 text-(--text-secondary)">
                    {community.description}
                </p>
            </div>

            <button
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                className="mt-3 flex w-full cursor-pointer items-center justify-between rounded-lg bg-(--surface-lowest) px-3 py-2 text-left text-(length:--text-label-sm) font-medium text-(--primary) transition hover:bg-(--hover)"
                aria-expanded={isExpanded}
            >
                <span>{isExpanded ? "Hide details" : "View details"}</span>
                <ChevronDown
                    size={16}
                    className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 1, y: -4 }}
                        transition={{ duration: 0.12, ease: "easeOut" }}
                    >
                        <div className="mt-3 space-y-3 border-t border-(--border) pt-3">
                            <div>
                                <h3 className="type-label-md text-primary">About</h3>
                                <p className="type-body-sm-readable mt-1 text-secondary">
                                    {community.description}
                                </p>
                            </div>

                            <Link
                                to={`/profile/${displayAdmin.username}`}
                                className="flex items-center gap-2 rounded-lg bg-(--surface-lowest) px-3 py-2 transition hover:bg-(--hover)"
                            >
                                <img
                                    src={displayAdmin.avatar}
                                    alt={displayAdmin.name}
                                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                                />

                                <div className="min-w-0">
                                    <p className="flex items-center gap-1.5 text-(length:--text-label-sm) font-semibold text-(--text-primary)">
                                        <ShieldUser size={14} />
                                        Admin
                                    </p>
                                    <p className="truncate text-(length:--text-label-sm) text-(--text-secondary)">
                                        {displayAdmin.name}
                                    </p>
                                </div>
                            </Link>

                            <div className="grid grid-cols-1 gap-2 text-(length:--text-label-sm) text-(--text-secondary)">
                                <div className="flex items-start gap-2 rounded-lg bg-(--surface-lowest) px-3 py-2">
                                    <Hash size={14} className="mt-0.5 shrink-0 text-(--primary)" />
                                    <div className="min-w-0">
                                        <p className="type-label-sm text-primary">Category</p>
                                        <p className="type-body-sm-readable wrap-break-word text-secondary">{community.category}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 rounded-lg bg-(--surface-lowest) px-3 py-2">
                                    <Hash size={14} className="mt-0.5 shrink-0 text-(--primary)" />
                                    <div className="min-w-0">
                                        <p className="type-label-sm text-primary">Slug</p>
                                        <p className="type-body-sm-readable wrap-break-word text-secondary">{community.slug}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 rounded-lg bg-(--surface-lowest) px-3 py-2">
                                    <Users size={14} className="mt-0.5 shrink-0 text-(--primary)" />
                                    <div className="min-w-0">
                                        <p className="type-label-sm text-primary">Members</p>
                                        <p className="type-body-sm-readable wrap-break-word text-secondary">{membersCount} members</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 rounded-lg bg-(--surface-lowest) px-3 py-2">
                                    <FileText size={14} className="mt-0.5 shrink-0 text-(--primary)" />
                                    <div className="min-w-0">
                                        <p className="type-label-sm text-primary">Posts</p>
                                        <p className="type-body-sm-readable wrap-break-word text-secondary">{postsCount} posts</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 rounded-lg bg-(--surface-lowest) px-3 py-2">
                                    {isPrivate ? (
                                        <Lock size={14} className="mt-0.5 shrink-0 text-(--primary)" />
                                    ) : (
                                        <Hash size={14} className="mt-0.5 shrink-0 text-(--primary)" />
                                    )}
                                    <div className="min-w-0">
                                        <p className="type-label-sm text-primary">Visibility</p>
                                        <p className="type-body-sm-readable wrap-break-word text-secondary">
                                            {isPrivate ? "Private community" : "Public community"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                type="button"
                onClick={() => onMembershipChange(community.id)}
                className="button-primary mt-3 flex w-full items-center justify-center gap-2 px-4 py-2 text-(length:--text-label-sm)"
            >
                <Plus size={15} />
                {isPrivate ? "Request" : "Join"}
            </button>
        </article>
    );
}
