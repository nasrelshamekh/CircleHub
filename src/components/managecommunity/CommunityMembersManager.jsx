import { LoaderCircle, Shield, ShieldUser, UserMinus, UserRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import ThemedDropdownSelect from "@/components/ui/ThemedDropdownSelect";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/profileimages/Avatar";

const roleOptions = [
    {
        value: "member",
        label: "Member",
    },
    {
        value: "moderator",
        label: "Moderator",
    },
];

export default function CommunityMembersManager({ members, adminUsername, viewerIsAdmin = true, onRoleChange, onRemoveMember, community }) {
    const { userData } = useAuth();
    const [removingIds, setRemovingIds] = useState(() => new Set());
    const [changingRoleIds, setChangingRoleIds] = useState(() => new Set());

    async function handleRemove(membershipId) {
        setRemovingIds((current) => new Set(current).add(membershipId));

        try {
            await onRemoveMember(community.id, membershipId);
        } finally {
            setRemovingIds((current) => {
                const next = new Set(current);
                next.delete(membershipId);
                return next;
            });
        }
    }

    async function handleRoleChange(membershipId, role) {
        setChangingRoleIds((current) => new Set(current).add(membershipId));

        try {
            await onRoleChange(membershipId, role);
        } finally {
            setChangingRoleIds((current) => {
                const next = new Set(current);
                next.delete(membershipId);
                return next;
            });
        }
    }

    return (
        <section className="content-card-padded">
            <div className="mb-5">
                <h2 className="type-title-lg text-primary">Members & Roles</h2>
                <p className="type-body-sm mt-1 text-secondary">
                    Review members and assign moderation roles.
                </p>
            </div>

            <div className="space-y-3">
                {members.map((member) => {
                    const displayMember = member.id === userData.id ? userData : member;
                    const isAdmin = member.username === adminUsername;
                    const memberRole = member.communityRole || "member";
                    const isModerator = memberRole === "moderator";

                    return (
                        <div
                            key={member.id}
                            className="flex flex-col gap-3 rounded-xl bg-(--surface-low) p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <Link to={`/profile/${displayMember.username}`} className="flex min-w-0 items-center gap-3">
                                <Avatar
                                    src={displayMember.avatarUrl}
                                    alt={displayMember.name}
                                    className="avatar-lg"
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

                            {isAdmin ? (
                                <span className="type-label-sm flex w-fit items-center gap-1.5 rounded-full bg-(--active) px-3 py-1.5 text-(--primary)">
                                    <ShieldUser size={15} />
                                    Admin
                                </span>
                            ) : (
                                <div className="flex w-full items-center gap-1 sm:w-fit">
                                    <div className="flex items-center gap-3">
                                        <div className="flex w-fit items-center gap-1">
                                            {isModerator ? (
                                                <Shield size={18} className="text-(--primary)" />
                                            ) : (
                                                <UserRound size={18} className="text-(--primary)" />
                                            )}

                                            {viewerIsAdmin ? (
                                                <div className="flex items-center gap-2">
                                                    <ThemedDropdownSelect
                                                        value={memberRole}
                                                        options={roleOptions}
                                                        ariaLabel={`Select role for ${displayMember.name}`}
                                                        disabled={changingRoleIds.has(member.membershipId)}
                                                        onChange={(role) => handleRoleChange(member.membershipId, role)}
                                                    />
                                                    {changingRoleIds.has(member.membershipId) && (
                                                        <LoaderCircle size={15} className="shrink-0 animate-spin text-(--primary)" />
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="type-label-sm px-2 text-(--primary)">
                                                    {isModerator ? "Moderator" : "Member"}
                                                </span>
                                            )}
                                        </div>

                                        {(() => {
                                            const canRemove = viewerIsAdmin || !isModerator;
                                            if (!canRemove) return null;

                                            const isRemoving = removingIds.has(member.membershipId);

                                            return (
                                                <button
                                                    type="button"
                                                    disabled={isRemoving}
                                                    onClick={() => handleRemove(member.membershipId)}
                                                    className="type-label-sm flex cursor-pointer items-center gap-1.5 rounded-lg bg-(--surface) px-3 py-1.5 text-(--error) transition hover:bg-(--error-container) hover:text-(--on-error-container) disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-(--surface) disabled:hover:text-(--error)"
                                                >
                                                    {isRemoving ? (
                                                        <LoaderCircle size={15} className="animate-spin" />
                                                    ) : (
                                                        <UserMinus size={15} />
                                                    )}
                                                    {isRemoving ? "Removing..." : "Remove"}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
