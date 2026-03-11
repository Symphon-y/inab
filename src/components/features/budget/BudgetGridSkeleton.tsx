import { Skeleton } from '@/components/ui/skeleton';

export function BudgetGridSkeleton() {
  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 px-4 py-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20 ml-auto" />
        <Skeleton className="h-5 w-20 ml-auto" />
        <Skeleton className="h-5 w-20 ml-auto" />
      </div>

      {/* Category Groups */}
      {[...Array(3)].map((_, groupIndex) => (
        <div key={groupIndex} className="border-b last:border-b-0">
          {/* Group Header */}
          <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
            <Skeleton className="h-5 w-32" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>

          {/* Categories */}
          {[...Array(2)].map((_, catIndex) => (
            <div
              key={catIndex}
              className="grid grid-cols-4 gap-4 px-4 py-3 hover:bg-muted/50"
            >
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20 ml-auto" />
              <Skeleton className="h-5 w-20 ml-auto" />
              <Skeleton className="h-5 w-20 ml-auto" />
            </div>
          ))}
        </div>
      ))}

      {/* Add Group Button */}
      <div className="p-4">
        <Skeleton className="h-9 w-40" />
      </div>
    </div>
  );
}
