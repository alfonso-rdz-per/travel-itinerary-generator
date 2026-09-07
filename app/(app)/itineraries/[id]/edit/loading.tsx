import { Skeleton } from "@/components/ui/skeleton";

export default function EditorLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pb-16 lg:p-8">
      <div className="flex flex-col gap-3 border-b border-border pb-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-64" />
      </div>

      <Skeleton className="h-40 w-full rounded-xl" />

      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
