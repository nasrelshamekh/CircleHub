import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Check, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import {
    deleteNotification,
    markNotificationRead,
    markNotificationsSeen,
} from "@/services/notificationApi";
import { notificationIcon, notificationLink, notificationSentence } from "@/lib/notificationCopy";
import { formatShortTime } from "@/lib/formatDate";
import { queryKeys } from "@/lib/queryKeys";

export default function Notifications() {
    const { userData } = useAuth();
    const queryClient = useQueryClient();
    const { items, unreadCount, isLoading, isLoadingMore, hasMore, loadMore } =
        useNotifications();
    const sentinelRef = useRef(null);

    // The pill counts the dots actually on screen, rather than echoing the cached `unreadCount`. Opening the
    // feed stamps it seen, which zeroes that cached field so the bell and the sidebar badge clear — but the
    // rows keep the unread flag they were fetched with, so their dots, Check buttons and this total all stay
    // for the visit. Echoing the cached field was the bug: it printed "0 unread" above a list of unread rows,
    // and a frozen snapshot was no better, since resolving both rows left "2 unread" above an empty list.
    // Counting the rendered rows cannot disagree with them: a new arrival bumps both, and a row the reader
    // clears drops both. Unread rows are the newest and the feed is newest-first, so page one cannot miss one.
    const visitUnreadCount = useMemo(
        () => items.filter((notification) => notification.unread).length,
        [items]
    );

    // One stamp per visit, taken the moment the feed has loaded — never again while the page is open, so a
    // notification arriving mid-visit bumps the pill and stays until the next open, exactly as before.
    const stampedRef = useRef(false);

    useEffect(() => {
        if (stampedRef.current || isLoading) return undefined;

        stampedRef.current = true;

        if (unreadCount === 0) return undefined;

        // No cancellation guard: the only write is to the query cache, which outlives this component, and
        // guarding it is what used to leave the badge unpatched when React StrictMode re-ran the effect.
        markNotificationsSeen()
            .then(() => {
                queryClient.setQueryData(queryKeys.notifications(), (data) =>
                    data
                        ? {
                              ...data,
                              pages: data.pages.map((page) => ({
                                  ...page,
                                  data: { ...page.data, unreadCount: 0 },
                              })),
                          }
                        : data
                );
            })
            .catch(() => {
                // A failed stamp is not worth an error toast: the badge simply survives until the next visit.
            });

        return undefined;
    }, [isLoading, unreadCount, queryClient]);

    // Both row actions follow the same rule as everything else here: the server is the source of truth, so
    // one invalidation refetches the feed and both badge counts rather than patching them by hand.
    const invalidateFeed = () =>
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });

    const readMutation = useMutation({
        mutationFn: markNotificationRead,
        onSuccess: invalidateFeed,
        onError: () => toast.error("Couldn't mark that notification as read."),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: invalidateFeed,
        onError: () => toast.error("Couldn't delete that notification."),
    });

    // Opening a row counts as reading it: the reader is being taken to the thing it points at, so the dot
    // must not still be there when they come back. The same mutation as the check button — one path, one
    // invalidation moves pill, dot, check button and both badges together — and a row that is already read
    // costs no request. The navigation proceeds either way.
    const openRow = (notification) => {
        if (notification.unread) readMutation.mutate(notification.id);
    };

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !isLoadingMore) {
                    loadMore();
                }
            },
            { rootMargin: "200px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, loadMore]);

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
                        {visitUnreadCount} unread
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
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map((index) => (
                            <div
                                key={index}
                                className="flex animate-pulse gap-4 rounded-xl bg-(--surface-low) p-4"
                            >
                                <div className="h-11 w-11 shrink-0 rounded-full bg-(--hover)" />
                                <div className="flex-1 space-y-2 py-1">
                                    <div className="h-3 w-2/3 rounded bg-(--hover)" />
                                    <div className="h-3 w-16 rounded bg-(--hover)" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl bg-(--surface-low) px-6 py-12 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--active) text-(--primary)">
                            <Bell size={20} />
                        </div>

                        <p className="type-body-sm-readable text-primary">
                            You&apos;re all caught up.
                        </p>

                        <p className="type-body-sm text-secondary">
                            Follows, likes, comments and community updates will show up here.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {items.map((notification) => {
                                const Icon = notificationIcon(notification.type);
                                const to = notificationLink(notification);

                                const content = (
                                    <>
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--active) text-(--primary)">
                                            <Icon size={19} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <p className="type-body-sm-readable text-primary">
                                                    <span className="font-semibold">
                                                        {notification.actor?.name}
                                                    </span>{" "}
                                                    {notificationSentence(notification)}
                                                </p>

                                                {notification.unread && (
                                                    <span className="h-2 w-2 rounded-full bg-(--primary)" />
                                                )}
                                            </div>

                                            <p className="type-label-sm mt-1 text-secondary">
                                                {formatShortTime(notification.createdAt)}
                                            </p>
                                        </div>
                                    </>
                                );

                                // The actions sit *outside* the link: a button inside an anchor is invalid
                                // HTML and its click would navigate. The link keeps covering the icon and
                                // text, so opening a row still works exactly as before.
                                return (
                                    <div
                                        key={notification.id}
                                        className="flex items-center gap-2 rounded-xl bg-(--surface-low) p-4 transition hover:bg-(--hover)"
                                    >
                                        {to ? (
                                            <Link
                                                to={to}
                                                onClick={() => openRow(notification)}
                                                className="flex min-w-0 flex-1 items-center gap-4"
                                            >
                                                {content}
                                            </Link>
                                        ) : (
                                            <div className="flex min-w-0 flex-1 items-center gap-4">
                                                {content}
                                            </div>
                                        )}

                                        <div className="flex shrink-0 items-center gap-1">
                                            {notification.unread && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        readMutation.mutate(notification.id)
                                                    }
                                                    disabled={readMutation.isPending}
                                                    aria-label="Mark as read"
                                                    title="Mark as read"
                                                    className="icon-button rounded-full p-2"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    deleteMutation.mutate(notification.id)
                                                }
                                                disabled={deleteMutation.isPending}
                                                aria-label="Delete notification"
                                                title="Delete"
                                                className="icon-button rounded-full p-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div ref={sentinelRef} className="h-1" />
                    </>
                )}
            </div>
        </section>
    );
}
