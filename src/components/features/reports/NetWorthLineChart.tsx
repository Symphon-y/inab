'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency } from '@/lib/currency';
import { Card } from '@/components/ui/card';
import { ChartSkeleton } from './ChartSkeleton';

interface AccountBreakdown {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface HistoryPoint {
  date: string;
  value: number;
}

interface NetWorthData {
  current: number;
  accounts: AccountBreakdown[];
  history: HistoryPoint[];
}

interface NetWorthLineChartProps {
  accountType?: 'all' | 'budget';
}

export function NetWorthLineChart({ accountType = 'all' }: NetWorthLineChartProps) {
  const [data, setData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams({ accountType });
        const res = await fetch(`/api/reports/net-worth?${params}`);
        if (res.ok) {
          const responseData = await res.json();
          setData(responseData);
        }
      } catch (error) {
        console.error('Failed to fetch net worth data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [accountType]);

  // Format currency with no decimal places for the chart
  const formatChartCurrency = (value: number) => {
    return formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground">{formatDate(item.payload.date)}</p>
          <p className="text-sm font-medium mt-1">{formatChartCurrency(item.value)}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <ChartSkeleton />;
  }

  if (!data || data.history.length === 0) {
    return (
      <Card className="p-6">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No net worth history available.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Historical tracking will be implemented in a future update.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Calculate account type breakdown
  const accountsByType = data.accounts.reduce((acc, account) => {
    const type = account.type || 'other';
    if (!acc[type]) {
      acc[type] = { balance: 0, count: 0 };
    }
    acc[type].balance += account.balance;
    acc[type].count += 1;
    return acc;
  }, {} as Record<string, { balance: number; count: number }>);

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">
          Net Worth {accountType === 'budget' ? '(Budget Accounts)' : '(All Accounts)'}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-3xl font-bold">{formatChartCurrency(data.current)}</p>
          <p className="text-sm text-muted-foreground">Current</p>
        </div>
      </div>

      {/* Account breakdown */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(accountsByType).map(([type, info]) => (
          <div key={type} className="border rounded-lg p-3">
            <p className="text-xs text-muted-foreground capitalize">{type}</p>
            <p className="text-sm font-medium mt-1">{formatChartCurrency(info.balance)}</p>
            <p className="text-xs text-muted-foreground">{info.count} account{info.count !== 1 ? 's' : ''}</p>
          </div>
        ))}
      </div>

      {data.history.length > 1 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.history}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              className="text-xs"
            />
            <YAxis
              tickFormatter={(value) => formatChartCurrency(value)}
              className="text-xs"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              name="Net Worth"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center border rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Not enough historical data to display chart.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Historical snapshots will appear here once tracking is implemented.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
