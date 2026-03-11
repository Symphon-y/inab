'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { BudgetGrid, ReadyToAssignCard } from '@/components/features/budget';
import { use } from 'react';

interface BudgetMonthPageProps {
  params: Promise<{
    year: string;
    month: string;
  }>;
}

export default function BudgetMonthPage({ params }: BudgetMonthPageProps) {
  const { year, month } = use(params);
  const yearNum = parseInt(year, 10);
  const monthNum = parseInt(month, 10);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshSummary = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const monthName = new Date(yearNum, monthNum - 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
  const prevYear = monthNum === 1 ? yearNum - 1 : yearNum;
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
  const nextYear = monthNum === 12 ? yearNum + 1 : yearNum;

  return (
    <div className="flex h-full flex-col">
      <Header
        title="Budget"
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/budget/${prevYear}/${prevMonth}`}>
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="min-w-[140px] text-center font-medium">
              {monthName}
            </span>
            <Link href={`/budget/${nextYear}/${nextMonth}`}>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 p-6 overflow-auto">
        {/* Ready to Assign Header */}
        <ReadyToAssignCard year={yearNum} month={monthNum} refreshTrigger={refreshTrigger} />

        {/* Budget Grid */}
        <BudgetGrid year={yearNum} month={monthNum} onRefreshSummary={handleRefreshSummary} />
      </div>
    </div>
  );
}
