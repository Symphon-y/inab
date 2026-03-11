'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Plan {
  id: string;
  name: string;
  icon: string;
  lastUsedAt: Date | string;
}

interface PlanCardProps {
  plan: Plan;
  onSelect: () => void;
  onRefresh?: () => void;
}

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

export function PlanCard({ plan, onSelect }: PlanCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onSelect}>
      <CardHeader>
        <div className="text-5xl mb-3">{plan.icon}</div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        <CardDescription>
          Last used {formatRelativeTime(plan.lastUsedAt)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="secondary">
          Open Plan
        </Button>
      </CardContent>
    </Card>
  );
}
