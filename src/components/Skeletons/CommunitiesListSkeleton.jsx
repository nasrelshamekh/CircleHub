import { Skeleton } from "@/components/ui/skeleton";

export default function CommunitiesListSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-hidden="true">
            <div className="space-y-6 lg:col-span-2">
                <div className="content-card-padded space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <Skeleton className="h-6 w-44" />
                            <Skeleton className="h-4 w-72" />
                        </div>
                        <Skeleton className="h-6 w-8 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <Skeleton className="h-40 rounded-xl" />
                        <Skeleton className="h-40 rounded-xl" />
                    </div>
                </div>

                <div className="content-card-padded space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-6 w-8 rounded-full" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                        <Skeleton className="h-40 rounded-xl" />
                        <Skeleton className="h-40 rounded-xl" />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1">
                <div className="content-card-padded space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <Skeleton className="h-6 w-36" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-6 w-8 rounded-full" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-28 rounded-xl" />
                        <Skeleton className="h-28 rounded-xl" />
                        <Skeleton className="h-28 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
