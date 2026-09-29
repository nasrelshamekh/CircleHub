import { Skeleton } from "@/components/ui/skeleton";

import PostSkeleton from "./PostSkeleton";

export default function CommunityDetailsSkeleton() {
    return (
        <section className="w-full pb-20 lg:pb-0" aria-hidden="true">
            {/* Cover banner */}
            <div className="relative mt-4 h-48 w-full overflow-hidden rounded-xl md:h-72">
                <Skeleton className="h-full w-full rounded-none" />
            </div>

            {/* Overlapping header card */}
            <div className="relative -mt-12 z-10 mx-auto w-full max-w-7xl px-4 lg:px-6">
                <div className="content-card relative overflow-hidden p-4 md:p-6">
                    <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
                        <Skeleton className="h-28 w-28 rounded-xl md:h-36 md:w-36" />

                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Skeleton className="h-8 w-48" />
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                    <Skeleton className="h-4 w-32" />
                                </div>

                                <Skeleton className="h-9 w-full rounded-xl md:w-28" />
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-3 w-full max-w-3xl" />
                                <Skeleton className="h-3 w-3/4 max-w-2xl" />
                            </div>

                            <div className="flex flex-wrap gap-x-6 gap-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-40" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-column layout: tabs + posts on the left, info panels on the right */}
            <div className="mx-auto grid w-full max-w-7xl grid-cols-4 gap-6 p-6">
                <div className="order-2 col-span-4 lg:order-1 lg:col-span-3 space-y-5">
                    {/* Tabs strip */}
                    <div className="flex gap-2 py-2">
                        {[0, 1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-9 w-24 rounded-md" />
                        ))}
                    </div>

                    {/* Create-post placeholder */}
                    <div className="content-card-padded flex gap-3">
                        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
                        <Skeleton className="h-11 flex-1 rounded-xl" />
                    </div>

                    {/* Two ghost posts */}
                    <PostSkeleton />
                    <PostSkeleton />
                </div>

                <div className="order-1 col-span-4 space-y-5 lg:order-2 lg:col-span-1">
                    {/* About panel */}
                    <div className="content-card-padded space-y-3">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                        <div className="space-y-2 pt-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                    </div>

                    {/* Admin panel */}
                    <div className="content-card-padded space-y-3">
                        <Skeleton className="h-5 w-16" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    </div>

                    {/* Active members panel */}
                    <div className="content-card-padded space-y-3">
                        <Skeleton className="h-5 w-32" />
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Highlights panel */}
                    <div className="content-card-padded space-y-3">
                        <Skeleton className="h-5 w-24" />
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-7 w-16 rounded-full" />
                            <Skeleton className="h-7 w-24 rounded-full" />
                            <Skeleton className="h-7 w-14 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
