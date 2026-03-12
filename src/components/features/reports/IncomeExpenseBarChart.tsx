'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Card } from '@/components/ui/card';
import { ChartSkeleton } from './ChartSkeleton';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
  netSavings: number;
}

interface IncomeExpenseBarChartProps {
  startDate: Date;
  endDate: Date;
}

export function IncomeExpenseBarChart({ startDate, endDate }: IncomeExpenseBarChartProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const res = await fetch(`/api/reports/income-expense?${params}`);
        if (res.ok) {
          const responseData = await res.json();
          setData(responseData);
        }
      } catch (error) {
        console.error('Failed to fetch income vs expense data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  // Format currency with no decimal places for the chart
  const formatChartCurrency = (value: number) => {
    return formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{formatMonth(label)}</p>
          {payload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-medium">{formatChartCurrency(item.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calculate totals
  const totals = data.reduce(
    (acc, item) => ({
      income: acc.income + item.income,
      expense: acc.expense + item.expense,
      netSavings: acc.netSavings + item.netSavings,
    }),
    { income: 0, expense: 0, netSavings: 0 }
  );

  const avgSavingsRate = totals.income > 0 ? (totals.netSavings / totals.income) * 100 : 0;

  if (loading) {
    return <ChartSkeleton />;
  }

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium mb-2">No income or expense data</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Add some transactions to see your income and spending trends for this period.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Income vs Expense</h3>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Income</p>
            <p className="text-sm font-medium mt-1 text-green-600">{formatChartCurrency(totals.income)}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-sm font-medium mt-1 text-red-600">{formatChartCurrency(totals.expense)}</p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Net Savings</p>
            <p className={`text-sm font-medium mt-1 ${totals.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatChartCurrency(totals.netSavings)}
            </p>
          </div>
          <div className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Avg. Savings Rate</p>
            <p className={`text-sm font-medium mt-1 ${avgSavingsRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {avgSavingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            className="text-xs"
          />
          <YAxis
            tickFormatter={(value) => formatChartCurrency(value)}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
          <Line
            type="monotone"
            dataKey="netSavings"
            name="Net Savings"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}
