import { ShieldUser, Shield, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

import ThemedDropdownSelect from "@/components/ui/ThemedDropdownSelect";
import { useAuth } from "@/hooks/useAuth";

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

export default function CommunityMembersManager({ members, adminUsername, onRoleChange }) {
    const { userData } = useAuth();

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
                                <img
                                    src={displayMember.avatar}
                                    alt={displayMember.name}
                                    className="avatar-lg"
                                />
                                <div className="min-w-0">
                                    <h3 className="type-label-md truncate text-primary">
                                        {displayMember.name}
                                    </h3>
                                    <p className="type-label-sm truncate text-secondary">
                                        {displayMember.role}
                                    </p>
                                </div>
                            </Link>

                            {isAdmin ? (
                                <span className="type-label-sm flex w-fit items-center gap-1.5 rounded-full bg-(--active) px-3 py-1.5 text-(--primary)">
                                    <ShieldUser size={15} />
                                    Admin
                                </span>
                            ) : (
                                <div className="flex w-full items-center gap-2 sm:w-44">
                                    {isModerator ? (
                                        <Shield size={16} className="text-(--primary)" />
                                    ) : (
                                        <UserRound size={16} className="text-(--primary)" />
                                    )}
                                    <ThemedDropdownSelect
                                        value={memberRole}
                                        options={roleOptions}
                                        ariaLabel={`Select role for ${displayMember.name}`}
                                        onChange={(role) => onRoleChange(member.username, role)}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
