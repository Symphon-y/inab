import { useState } from 'react';

export function useAccountRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAccounts = async (accountIds: string[]) => {
    if (accountIds.length === 0) return;

    setIsRefreshing(true);
    setError(null);

    try {
      // Sync all accounts in parallel
      const results = await Promise.allSettled(
        accountIds.map(id =>
          fetch(`/api/accounts/${id}/sync`, { method: 'POST' })
            .then(res => res.json())
        )
      );

      // Check for failures
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`Failed to sync ${failures.length} account(s)`);
      }

      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refreshAccounts, isRefreshing, error };
}
