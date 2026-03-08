import { redirect } from 'next/navigation';

export default function BudgetPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  redirect(`/budget/${year}/${month}`);
}
