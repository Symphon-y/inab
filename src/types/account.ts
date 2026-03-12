import type { Account } from '@/db/schema/accounts';

export interface AccountWithConnection extends Account {
  hasConnection: boolean;
  lastSyncAt?: Date | null;
}
