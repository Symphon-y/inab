import { Header } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PieChart, BarChart3, LineChart } from 'lucide-react';
import Link from 'next/link';

export default function ReportsPage() {
  const reports = [
    {
      title: 'Spending',
      description: 'See where your money goes by category or payee',
      icon: PieChart,
      href: '/reports/spending',
    },
    {
      title: 'Net Worth',
      description: 'Track your net worth over time',
      icon: LineChart,
      href: '/reports/net-worth',
    },
    {
      title: 'Income vs Expense',
      description: 'Compare your income and expenses',
      icon: BarChart3,
      href: '/reports/income-expense',
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <Header title="Reports" />

      <div className="flex-1 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Link key={report.href} href={report.href}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{report.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 rounded-lg border bg-muted/30 p-8 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Start adding transactions to see your financial reports.
          </p>
        </div>
      </div>
    </div>
  );
}
