'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface CreatePlanCardProps {
  onClick: () => void;
}

export function CreatePlanCard({ onClick }: CreatePlanCardProps) {
  return (
    <Card
      className="border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] py-12">
        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-medium">Create New Plan</p>
      </CardContent>
    </Card>
  );
}
