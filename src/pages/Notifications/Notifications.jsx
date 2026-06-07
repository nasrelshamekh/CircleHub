import {
    Bell,
    CheckCircle2,
    Heart,
    MessageCircle,
    UserPlus,
    Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

const notificationItems = [
    {
        id: 1,
        type: "follow",
        actor: "Elena Rodriguez",
        username: "elena.designs",
        message: "started following you.",
        time: "12 minutes ago",
        unread: true,
        icon: UserPlus,
        to: "/profile/elena.designs",
    },
    {
        id: 2,
        type: "like",
        actor: "David Chen",
        username: "davidcodes",
        message: "liked your post about reusable layouts.",
        time: "34 minutes ago",
        unread: true,
        icon: Heart,
        to: "/post/2",
    },
    {
        id: 3,
        type: "comment",
        actor: "Maya Hassan",
        username: "maya.creates",
        message: "commented on your profile page update.",
        time: "1 hour ago",
        unread: false,
        icon: MessageCircle,
        to: "/post/1",
    },
    {
        id: 4,
        type: "community",
        actor: "Full-Stack Circle",
        username: "full-stack-circle",
        message: "approved your latest community post.",
        time: "Yesterday",
        unread: false,
        icon: Users,
        to: "/communities/full-stack-circle",
    },
];

export default function Notifications() {
    const { userData } = useAuth();
    const unreadCount = notificationItems.filter((notification) => notification.unread).length;

    return (
        <section className="content-stack max-w-5xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="type-headline-responsive text-primary">
                        Notifications
                    </h1>

                    <p className="type-body-md mt-2 text-secondary">
                        Keep up with activity around your posts, profile, and communities.
                    </p>
                </div>

                <div className="flex w-fit items-center gap-2 rounded-full bg-(--active) px-4 py-2 text-(--primary)">
                    <Bell size={17} />
                    <span className="type-label-md">
                        {unreadCount} unread
                    </span>
                </div>
            </div>

            <div className="content-card-padded">
                <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="type-title-lg text-primary">
                            Recent Activity
                        </h2>

                        <p className="type-body-sm mt-1 text-secondary">
                            Updates for @{userData.username}
                        </p>
                    </div>

                    <CheckCircle2 size={22} className="text-(--primary)" />
                </div>

                <div className="space-y-3">
                    {notificationItems.map((notification) => {
                        const Icon = notification.icon;

                        return (
                            <Link
                                key={notification.id}
                                to={notification.to}
                                className="flex gap-4 rounded-xl bg-(--surface-low) p-4 transition hover:bg-(--hover)"
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--active) text-(--primary)">
                                    <Icon size={19} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <p className="type-body-sm-readable text-primary">
                                            <span className="font-semibold">
                                                {notification.actor}
                                            </span>{" "}
                                            {notification.message}
                                        </p>

                                        {notification.unread && (
                                            <span className="h-2 w-2 rounded-full bg-(--primary)" />
                                        )}
                                    </div>

                                    <p className="type-label-sm mt-1 text-secondary">
                                        {notification.time}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
