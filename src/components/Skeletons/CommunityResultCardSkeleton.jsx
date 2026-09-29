import { Skeleton } from "@/components/ui/skeleton";

export default function CommunityResultCardSkeleton() {
  return (
    <div
      className="content-card-padded flex min-w-0 flex-col gap-4"
      aria-hidden="true"
    >
      <div className="flex items-start gap-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-lg sm:h-24 sm:w-24" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>

      <Skeleton className="h-12 w-full rounded-lg" />

      <div className="flex items-center justify-between border-t border-(--border) pt-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  );
}
