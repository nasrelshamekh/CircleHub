import { Skeleton } from "@/components/ui/skeleton";

export default function PostSkeleton() {
  return (
    <div
      className="content-card-padded flex flex-col gap-4"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />

        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      <Skeleton className="aspect-video w-full rounded-lg" />
    </div>
  );
}
