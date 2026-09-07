import { Skeleton } from "@/components/ui/skeleton";

export default function ProposalsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full sm:max-w-sm" />
        <Skeleton className="h-9 w-full sm:w-40" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-52 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
