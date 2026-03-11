'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Separator } from '@/components/ui/separator';
import {
  SpendingPieChart,
  NetWorthLineChart,
  IncomeExpenseBarChart,
  TimeRangeSelector,
  DateRange
} from '@/components/features/reports';

export default function ReportsPage() {
  // Default to last 3 months
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);

  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: threeMonthsAgo,
    endDate: today,
  });

  return (
    <div className="flex h-full flex-col">
      <Header title="Reports" />

      <div className="flex-1 p-6 space-y-6">
        <TimeRangeSelector value={dateRange} onChange={setDateRange} />

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <SpendingPieChart
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                groupBy="category"
              />
              <NetWorthLineChart accountType="all" />
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-4">Income & Expenses</h2>
            <IncomeExpenseBarChart
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
