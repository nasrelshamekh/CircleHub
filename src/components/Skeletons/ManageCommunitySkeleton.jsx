import { Skeleton } from "@/components/ui/skeleton";

export default function ManageCommunitySkeleton() {
    return (
        <section className="content-stack max-w-7xl" aria-hidden="true">
            {/* Back button */}
            <Skeleton className="h-8 w-45 rounded-full" />

            {/* Title block */}
            <div className="space-y-2">
                <Skeleton className="h-8 w-72" />
                <Skeleton className="h-4 w-96" />
            </div>

            {/* Admin Access banner */}
            <div className="content-card-padded flex flex-wrap items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-56" />
                </div>
            </div>

            {/* Tabs strip */}
            <div className="flex gap-2 py-2">
                {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-9 w-28 rounded-md" />
                ))}
            </div>

            {/* Content panel â€” approximates the shape of the Members tab. */}
            <div className="content-card-padded space-y-3">
                <div className="mb-5 space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3 w-72" />
                </div>

                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-3 rounded-xl bg-(--surface-low) p-3"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                            <Skeleton className="h-10 w-32 rounded-lg" />
                            <Skeleton className="h-8 w-24 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
