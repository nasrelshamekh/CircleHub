import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import FollowButton from "../followers/FollowButton";
import Avatar from "@/components/profileimages/Avatar";
import { queryKeys } from "@/lib/queryKeys";

const FOLLOWED_DISMISS_DELAY_MS = 4000;

export default function SuggestedItem({ user }) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!user.isFollowedByMe) return;

        const timer = setTimeout(() => {
            queryClient.setQueryData(queryKeys.suggestedUsers(), (old) =>
                Array.isArray(old) ? old.filter((u) => u.id !== user.id) : old
            );
        }, FOLLOWED_DISMISS_DELAY_MS);

        return () => clearTimeout(timer);
    }, [user.id, user.isFollowedByMe, queryClient]);

    return (
        <div className="flex items-center justify-between rounded-xl p-2">
            <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                <Avatar
                    src={user.avatarUrl}
                    alt={user.name}
                    className="avatar-lg"
                />

                <div>
                    <h3 className="type-label-md text-primary">
                        {user.name}
                    </h3>

                    <p className="type-label-sm text-secondary">
                        {user.jobTitle}
                    </p>
                </div>
            </Link>

            <FollowButton user={user} variant="text" />
        </div>
    )
}
