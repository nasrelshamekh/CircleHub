import {
    CalendarDays,
    MapPin,
    MessageCircle,
    Pencil,
    Settings,
} from "lucide-react";
import FollowButton from "@/components/followers/FollowButton";
import { getAvatarImage, getCoverImage } from "@/lib/profileImages";
import { useNavigate } from "react-router-dom";

export default function ProfileHeader({ user, isCurrentUser, postsCount, followsMe }) {
    const networkPath = `/followers/${user.username}`;
    const stats = [
        {
            label: "Posts",
            value: postsCount,
        },
        {
            label: "Followers",
            value: user.followersCount,
            to: `${networkPath}?tab=followers`,
        },
        {
            label: "Following",
            value: user.followingCount,
            to: `${networkPath}?tab=following`,
        },
    ];

    const navigate = useNavigate();
    const avatarImage = getAvatarImage(user.avatar);
    const coverImage = getCoverImage(user.coverImage);

    return (
        <section className="w-full">
            <div className="relative h-48 w-full bg-(--surface-high) md:h-72">
                <img
                    src={coverImage}
                    alt={`${user.name} cover`}
                    className="h-full w-full object-cover object-center"
                />

                <div className="absolute inset-0 bg-linear-to-t from-black/25 to-transparent" />
            </div>

            <div className="relative -mt-12 z-10 mx-auto w-full max-w-7xl px-4 lg:px-6">
                <div className="content-card relative overflow-hidden p-4 md:p-6">
                    <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 translate-x-1/3 -translate-y-1/2 rounded-full bg-(--active) blur-3xl" />

                    <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
                        <div>
                            <img
                                src={avatarImage}
                                alt={user.name}
                                className="h-30 w-30 rounded-full border-4 border-(--surface-lowest) object-cover shadow-sm md:h-40 md:w-40"
                            />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="type-headline-responsive text-primary">
                                            {user.name}
                                        </h1>
                                        {!isCurrentUser && followsMe && (
                                            <span className="flex items-center gap-1.5 type-label-sm rounded-full bg-(--surface-low) px-3 py-1 text-(--primary)">
                                                Follows you
                                            </span>
                                        )}
                                    </div>
                                    <p className="type-body-sm mt-1 text-secondary">
                                        @{user.username} &bull; {user.role}
                                    </p>
                                </div>

                                <div className="flex w-full gap-2 md:w-auto">
                                    {isCurrentUser ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => navigate('/settings/profile?tab=settings')}
                                                className="icon-button-soft flex h-10 w-10 items-center justify-center bg-(--surface-low)"
                                                aria-label="Open profile settings"
                                            >
                                                <Settings size={18} />
                                            </button>

                                            <button type="button" onClick={() => navigate('/settings/profile?tab=profile')} className="button-primary type-button flex flex-1 items-center justify-center gap-2 px-4 py-2 md:flex-none">
                                                <Pencil size={16} />
                                                Edit Profile
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <FollowButton user={user} variant="text" />

                                            <button type="button" className="type-button flex flex-1 items-center justify-center gap-2 rounded-xl bg-(--surface-low) px-4 py-2 text-(--primary) transition hover:bg-(--hover) md:flex-none">
                                                <MessageCircle size={16} />
                                                Message
                                            </button>
                                            {/* Keep this for now just in case */}
                                            {/* <button type="button" className="icon-button-soft hidden h-10 w-10 items-center justify-center bg-(--surface-low) md:flex" aria-label="Open profile actions">
                                                <MoreHorizontal size={18} />
                                            </button> */}
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className="type-body-sm-readable max-w-2xl text-secondary">
                                {user.bio}
                            </p>

                            <div className="type-body-sm flex flex-wrap gap-x-6 gap-y-2 text-secondary">
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={16} />
                                    {user.location}
                                </span>

                                <span className="flex items-center gap-1.5">
                                    <CalendarDays size={16} />
                                    Joined {user.joinedAt}
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                                {stats.map((stat) => {
                                    const Comp = stat.to ? "button" : "div";

                                    return (
                                        <Comp
                                            key={stat.label}
                                            onClick={stat.to ? () => navigate(stat.to) : undefined}
                                            className={`flex items-baseline gap-2 ${stat.to ? "cursor-pointer rounded-lg transition hover:text-(--primary)" : ""}`}
                                            type={stat.to ? "button" : undefined}
                                        >
                                            <span className="type-label-md text-primary">
                                                {stat.value.toLocaleString()}
                                            </span>

                                            <span className="type-body-sm text-secondary">
                                                {stat.label}
                                            </span>
                                        </Comp>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
