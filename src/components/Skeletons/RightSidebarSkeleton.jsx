import { Skeleton } from "@/components/ui/skeleton";

export default function RightSidebarSkeleton() {
    return (
        <div className="space-y-6" aria-hidden="true">
            {/* Suggested People â€” 5 ghost rows */}
            <div className="content-card p-4">
                <Skeleton className="mb-4 h-6 w-40" />

                <div className="space-y-3">
                    {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center justify-between rounded-xl p-2">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <Skeleton className="h-9 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Suggested Communities â€” 2 ghost cards */}
            <div className="content-card p-4">
                <Skeleton className="mb-4 h-6 w-52" />

                <div className="space-y-4">
                    {[0, 1].map((i) => (
                        <div key={i} className="rounded-xl bg-(--surface-low) p-3">
                            <div className="flex items-start gap-3">
                                <Skeleton className="h-14 w-14 shrink-0 rounded-lg" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-20" />
                                    <Skeleton className="h-3 w-28" />
                                </div>
                            </div>

                            <div className="mt-3 space-y-2">
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <Skeleton className="h-7 rounded-lg" />
                                <Skeleton className="h-7 rounded-lg" />
                            </div>

                            <Skeleton className="mt-3 h-9 w-full rounded-xl" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
