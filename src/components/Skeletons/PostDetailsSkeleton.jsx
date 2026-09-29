import { Skeleton } from "@/components/ui/skeleton";

import PostSkeleton from "./PostSkeleton";

export default function PostDetailsSkeleton() {
  return (
    <>
      {/* Back-to-feed pill, matches button-primary px-3 py-1 rounded-full */}
      <Skeleton className="h-8 w-32 self-start rounded-full" />

      {/* Post card */}
      <PostSkeleton />

      {/* Comments section */}
      <div
        className="content-card flex flex-col gap-5 p-5"
        aria-hidden="true"
      >
        {/* "Comments" header */}
        <Skeleton className="h-5 w-28" />

        {/* Add-a-comment form */}
        <div className="flex w-full flex-col items-end gap-3">
          <div className="flex w-full gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <Skeleton className="min-h-26 flex-1 rounded-2xl" />
          </div>
          <Skeleton className="h-10 w-16 rounded-md" />
        </div>

        {/* Two ghost comment rows */}
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2 rounded-2xl bg-(--surface-low) p-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
