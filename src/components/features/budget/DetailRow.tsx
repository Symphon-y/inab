import { cn } from '@/lib/utils';

interface DetailRowProps {
  label: string;
  value: string;
  variant?: 'default' | 'positive' | 'negative';
}

export function DetailRow({ label, value, variant = 'default' }: DetailRowProps) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-sm font-semibold tabular-nums',
          variant === 'positive' && 'text-green-600',
          variant === 'negative' && 'text-red-600'
        )}
      >
        {value}
      </span>
    </div>
  );
}
