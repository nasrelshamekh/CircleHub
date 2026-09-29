import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useToggleFollow } from "@/hooks/mutations/useToggleFollow";

export default function FollowButton({ user, variant = "icon" }) {
    const toggleFollow = useToggleFollow();
    const isFollowing = Boolean(user.isFollowedByMe);

    if (user.isCurrentUser) return null;

    function handleToggleFollow() {
        if (toggleFollow.isPending) return;

        const shouldFollow = !isFollowing;

        toggleFollow.mutate(
            {
                userId: user.id,
                shouldFollow,
                targetUsername: user.username,
            },
            {
                onSuccess: () => {
                    toast.success(
                        shouldFollow
                            ? `${user.name} has been followed`
                            : `${user.name} has been unfollowed`
                    );
                },
            }
        );
    }

    if (variant === "text") {
        return (
            <button
                type="button"
                onClick={handleToggleFollow}
                disabled={toggleFollow.isPending}
                className={
                    isFollowing
                        ? "rounded-(--radius-full) bg-(--active) px-4 py-2 type-button text-(--primary) disabled:opacity-60"
                        : "button-primary px-4 py-2 type-button disabled:opacity-60"
                }
            >
                {isFollowing ? "Following" : "Follow"}
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={handleToggleFollow}
            disabled={toggleFollow.isPending}
            className={
                isFollowing
                    ? "icon-button-soft flex h-10 w-10 shrink-0 items-center justify-center bg-(--active) text-(--primary) disabled:opacity-60"
                    : "icon-button-soft flex h-10 w-10 shrink-0 items-center justify-center bg-(--surface-low) text-(--primary) disabled:opacity-60"
            }
            aria-label={isFollowing ? `Following ${user.name}` : `Follow ${user.name}`}
            title={isFollowing ? "Following" : "Follow"}
        >
            {isFollowing ? <Check size={18} /> : <UserPlus size={18} />}
        </button>
    );
}
