import { Header } from '@/components/layout';
import { AccountTransactions } from '@/components/features/accounts/AccountTransactions';
import { db } from '@/db';
import { accounts } from '@/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';

interface AccountPageProps {
  params: Promise<{
    accountId: string;
  }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { accountId } = await params;

  // Fetch account from database
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), isNull(accounts.deletedAt)));

  if (!account) {
    notFound();
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <div className="flex h-full flex-col">
      <Header
        title={account.name}
        subtitle={formatCurrency(account.balance)}
      />

      <div className="flex-1 p-6 overflow-auto">
        <AccountTransactions account={account} />
      </div>
    </div>
  );
}
