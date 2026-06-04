import { Check, Clock, FileText, Hash, Lock, Settings, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function CommunityHeader({ community, membersCount, postsCount, onMembershipChange, isAdmin }) {
    const isJoined = community.membershipStatus === "joined";
    const isRequested = community.membershipStatus === "requested";
    const isPrivate = community.visibility === "private";
    const actionLabel = isJoined ? "Leave" : isRequested ? "Requested" : isPrivate ? "Request" : "Join";

    return (
        <section className="w-full">
            <div className="relative h-48 w-full bg-(--surface-high) md:h-72">
                <img
                    src={community.image}
                    alt={`${community.name} cover`}
                    className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/35 to-transparent" />
            </div>

            <div className="relative -mt-12 z-10 mx-auto w-full max-w-7xl px-4 lg:px-6">
                <div className="content-card relative overflow-hidden p-4 md:p-6">
                    <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/2 rounded-full bg-(--active) blur-3xl" />

                    <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
                        <img
                            src={community.image}
                            alt={community.name}
                            className="h-28 w-28 rounded-xl border-4 border-(--surface-lowest) object-cover shadow-sm md:h-36 md:w-36"
                        />

                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h1 className="type-headline-responsive text-primary">
                                            {community.name}
                                        </h1>

                                        <span className="type-label-sm rounded-full bg-(--active) px-3 py-1 text-(--primary)">
                                            {community.category}
                                        </span>
                                    </div>

                                    <p className="type-body-sm mt-1 flex items-center gap-1.5 text-secondary">
                                        <Hash size={15} />
                                        {community.slug}
                                    </p>
                                </div>

                                {isAdmin ? (
                                    <Link
                                        to={`/communities/${community.slug}/manage`}
                                        className="button-primary flex w-full items-center justify-center gap-2 px-5 py-2 text-(length:--text-label-md) font-semibold md:w-auto"
                                    >
                                        <Settings size={16} />
                                        Manage
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => onMembershipChange(community.id)}
                                        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2 text-(length:--text-label-md) font-semibold transition md:w-auto ${
                                            isJoined
                                                ? "bg-(--surface-low) text-(--error) hover:bg-(--error-container) hover:text-(--on-error-container)"
                                                : isRequested
                                                    ? "bg-(--surface-low) text-(--text-secondary) hover:bg-(--hover) hover:text-(--primary)"
                                                    : "button-primary"
                                        }`}
                                    >
                                        {isJoined && <Check size={16} />}
                                        {isRequested && <Clock size={16} />}
                                        {actionLabel}
                                    </button>
                                )}
                            </div>

                            <p className="type-body-sm-readable max-w-3xl text-secondary">
                                {community.description}
                            </p>

                            <div className="type-body-sm flex flex-wrap gap-x-6 gap-y-2 text-secondary">
                                <span className="flex items-center gap-1.5">
                                    <Users size={16} />
                                    {membersCount} featured members
                                </span>

                                <span className="flex items-center gap-1.5">
                                    <FileText size={16} />
                                    {postsCount} posts
                                </span>

                                <span className="flex items-center gap-1.5">
                                    {isPrivate ? <Lock size={16} /> : <Hash size={16} />}
                                    {isPrivate ? "Private community" : "Public community"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
