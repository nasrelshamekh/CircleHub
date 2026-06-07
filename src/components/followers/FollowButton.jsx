import { Check, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

export default function FollowButton({ user, variant = "icon" }) {
    const { userData, setUserData } = useAuth();

    const isMyself = user.id === userData.id;
    const isFollowing = userData.followingIds?.includes(user.id);

    function handleToggleFollow() {
        if (isMyself) {
            toast.error("You cannot follow yourself");
            return;
        }

        setUserData((currentUser) => {
            const followingIds = currentUser.followingIds || [];
            const alreadyFollowing = followingIds.includes(user.id);
            const nextFollowingIds = alreadyFollowing
                ? followingIds.filter((id) => id !== user.id)
                : [...followingIds, user.id];

            return {
                ...currentUser,
                followingIds: nextFollowingIds,
                followingCount: nextFollowingIds.length,
            };
        });

        toast.success(
            isFollowing
                ? `Unfollowed ${user.name}`
                : `You are now following ${user.name}`
        );
    }

    if (isMyself) return null;

    if (variant === "text") {
        return (
            <button
                type="button"
                onClick={handleToggleFollow}
                className={
                    isFollowing
                        ? "rounded-(--radius-full) bg-(--active) px-4 py-2 type-button text-(--primary)"
                        : "button-primary px-4 py-2 type-button"
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
            className={
                isFollowing
                    ? "icon-button-soft flex h-10 w-10 shrink-0 items-center justify-center bg-(--active) text-(--primary)"
                    : "icon-button-soft flex h-10 w-10 shrink-0 items-center justify-center bg-(--surface-low) text-(--primary)"
            }
            aria-label={isFollowing ? `Following ${user.name}` : `Follow ${user.name}`}
            title={isFollowing ? "Following" : "Follow"}
        >
            {isFollowing ? <Check size={18} /> : <UserPlus size={18} />}
        </button>
    );
}
