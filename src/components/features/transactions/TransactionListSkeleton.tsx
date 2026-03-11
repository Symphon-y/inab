import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function TransactionListSkeleton() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="rounded-lg border">
        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4 border-b bg-muted/50 px-4 py-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-16 ml-auto" />
          <Skeleton className="h-5 w-16 ml-auto" />
          <Skeleton className="h-5 w-20 ml-auto" />
        </div>

        {/* Table Rows */}
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="grid grid-cols-7 gap-4 px-4 py-3 border-b last:border-b-0"
          >
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-16 ml-auto" />
            <Skeleton className="h-5 w-16 ml-auto" />
            <Skeleton className="h-5 w-20 ml-auto" />
          </div>
        ))}
      </div>
    </Card>
  );
}
