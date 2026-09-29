import { Skeleton } from "@/components/ui/skeleton";

export default function ExplorePostCardSkeleton() {
  return (
    <article
      className="content-card-padded flex min-w-0 flex-col gap-4 overflow-hidden"
      aria-hidden="true"
    >
      {/* image (flush to card edges, mirroring the real card's -m-5 mb-0) */}
      <div className="-m-5 mb-0">
        <Skeleton className="h-40 w-full" />
      </div>

      {/* author row */}
      <div className="flex items-start gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>

      {/* content (matches line-clamp-3) */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* footer row: date + actions */}
      <div className="flex items-center justify-between gap-3 pt-3">
        <Skeleton className="h-3 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
    </article>
  );
}
