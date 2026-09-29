import { Skeleton } from "@/components/ui/skeleton";

export default function CreatePostSkeleton() {
  return (
    <div
      className="content-card flex items-center gap-3 p-4"
      aria-hidden="true"
    >
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <Skeleton className="h-11 flex-1 rounded-full" />
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
    </div>
  );
}
