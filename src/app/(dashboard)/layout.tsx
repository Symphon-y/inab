import { Sidebar } from '@/components/layout';
import { BudgetRefreshProvider } from '@/contexts/BudgetRefreshContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BudgetRefreshProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </BudgetRefreshProvider>
  );
}
