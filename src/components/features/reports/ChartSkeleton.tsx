import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function ChartSkeleton() {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="h-[400px] flex items-center justify-center">
        <Skeleton className="h-[350px] w-full" />
      </div>
    </Card>
  );
}
