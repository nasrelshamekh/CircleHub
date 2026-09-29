import { FileText, Lock, LockOpen, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/profileimages/Avatar";

export default function CommunityInfoPanels({ community, members, membersCount, posts }) {
    const { userData } = useAuth();

    const displayAdmin =
        community.admin.id === userData.id ? userData : community.admin;
    const isPrivateLocked =
        community.visibility === "private" && !community.communityRole;

    return (
        <aside className="space-y-5">
            <div className="content-card-padded">
                <h2 className="type-title-lg text-primary">About</h2>

                <p className="type-body-sm-readable mt-3 text-secondary">
                    {community.description}
                </p>

                <div className="type-body-sm mt-5 space-y-3 text-secondary">
                    <p className="flex items-center gap-2">
                        <Users size={18} />
                        {membersCount} total members
                    </p>

                    <p className="flex items-center gap-2">
                        <FileText size={18} />
                        {community.postsCount} posts
                    </p>

                    {community.visibility === "private" ? (
                        <p className="flex items-center gap-2">
                            <Lock size={18} />
                            Approval required
                        </p>
                    ) : (
                        <p className="flex items-center gap-2">
                            <LockOpen size={18} />
                            Open to join
                        </p>
                    )}
                </div>
            </div>

            <div className="content-card-padded">
                <h2 className="type-title-lg text-primary">Admin</h2>

                <Link
                    to={`/profile/${displayAdmin.username}`}
                    className="mt-4 flex items-center gap-3 rounded-xl p-2 transition hover:bg-(--hover)"
                >
                    <Avatar
                        src={displayAdmin.avatarUrl}
                        alt={displayAdmin.name}
                        className="avatar-lg"
                    />

                    <div className="min-w-0">
                        <h3 className="type-label-md truncate text-primary">
                            {displayAdmin.name}
                        </h3>

                        <p className="type-label-sm truncate text-secondary">
                            {displayAdmin.jobTitle}
                        </p>
                    </div>
                </Link>
            </div>

            <div className="content-card-padded">
                <h2 className="type-title-lg text-primary">Active Members</h2>

                {isPrivateLocked ? (
                    <div className="mt-4 flex flex-col items-center justify-center rounded-xl bg-(--surface-low) py-6 text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-(--radius-full) bg-(--active) text-(--primary)">
                            <Lock size={20} />
                        </div>

                        <p className="type-body-sm-readable max-w-sm px-4 text-secondary">
                            Request to join {community.name} to view its active members.
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {members.slice(0, 4).map((member) => {
                            const displayMember =
                                member.id === userData.id ? userData : member;

                            return (
                                <Link
                                    key={member.id}
                                    to={`/profile/${displayMember.username}`}
                                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-(--hover)"
                                >
                                    <Avatar
                                        src={displayMember.avatarUrl}
                                        alt={displayMember.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                    />

                                    <div className="min-w-0">
                                        <h3 className="type-label-md truncate text-primary">
                                            {displayMember.name}
                                        </h3>

                                        <p className="type-label-sm truncate text-secondary">
                                            {displayMember.jobTitle}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="content-card-padded">
                <h2 className="type-title-lg text-primary">Highlights</h2>

                <div className="mt-4 flex flex-wrap gap-2">
                    {[
                        community.category,
                        `${community.postsCount} featured posts`,
                        community.visibility,
                    ].map((tag) => (
                        <span
                            key={tag}
                            className="type-label-sm rounded-full bg-(--active) px-3 py-1.5 capitalize text-(--primary)"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </aside>
    );
}
