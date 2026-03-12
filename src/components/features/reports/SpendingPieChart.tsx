'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import { Card } from '@/components/ui/card';
import { ChartSkeleton } from './ChartSkeleton';

interface SpendingData {
  id?: string;
  name: string;
  group?: string;
  value: number;
}

interface SpendingPieChartProps {
  startDate: Date;
  endDate: Date;
  groupBy?: 'category' | 'payee';
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // purple
];

export function SpendingPieChart({ startDate, endDate, groupBy = 'category' }: SpendingPieChartProps) {
  const [data, setData] = useState<SpendingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          groupBy,
        });

        const res = await fetch(`/api/reports/spending?${params}`);
        if (res.ok) {
          const responseData = await res.json();
          setData(responseData);
        }
      } catch (error) {
        console.error('Failed to fetch spending data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, groupBy]);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Format currency with no decimal places for the chart
  const formatChartCurrency = (value: number) => {
    return formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{item.name}</p>
          {item.payload.group && (
            <p className="text-xs text-muted-foreground">{item.payload.group}</p>
          )}
          <p className="text-sm mt-1">{formatChartCurrency(item.value)}</p>
          <p className="text-xs text-muted-foreground">{percentage}% of total</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show label if less than 5%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return <ChartSkeleton />;
  }

  if (data.length === 0 || total === 0) {
    return (
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <PieChartIcon className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium mb-2">No spending data</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Add some transactions with categories to see your spending breakdown for this period.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Spending by {groupBy === 'category' ? 'Category' : 'Payee'}</h3>
        <p className="text-sm text-muted-foreground">Total: {formatChartCurrency(total)}</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => {
              const percentage = ((entry.payload.value / total) * 100).toFixed(1);
              return `${value} (${percentage}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
