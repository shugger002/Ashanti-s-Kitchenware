import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="Loading desk">
      <Skeleton className="h-16 w-full rounded-xl" />
      <ul className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="admin-stat">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-8 w-12" />
          </li>
        ))}
      </ul>
      <div className="admin-panel mt-6">
        <Skeleton className="h-5 w-36" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
