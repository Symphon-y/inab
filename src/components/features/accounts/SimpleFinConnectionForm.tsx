'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { AccountType } from '@/db/schema';

interface SimpleFinAccount {
  id: string;
  name: string;
  balance: number;
  type?: string;
}

interface SimpleFinConnectionFormProps {
  onAccountSelected: (data: {
    accessUrl: string;
    accounts: Array<{
      externalAccountId: string;
      accountName: string;
      accountType: AccountType;
      balance: number;
    }>;
    syncStartDate?: string;
  }) => void;
}

export function SimpleFinConnectionForm({ onAccountSelected }: SimpleFinConnectionFormProps) {
  const [setupToken, setSetupToken] = useState('');
  const [accessUrl, setAccessUrl] = useState(''); // Store the claimed access URL
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState<SimpleFinAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [syncStartDate, setSyncStartDate] = useState('');

  const handleTestConnection = async () => {
    if (!setupToken.trim()) {
      setErrorMessage('Please enter a SimpleFin setup token');
      setTestStatus('error');
      return;
    }

    setTestStatus('testing');
    setErrorMessage('');
    setAvailableAccounts([]);
    setAccessUrl(''); // Clear previous access URL

    try {
      // Claim the setup token and fetch accounts
      const response = await fetch('/api/simplefin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to connect to SimpleFin');
      }

      const data = await response.json();
      setAvailableAccounts(data.accounts || []);
      setAccessUrl(data.accessUrl); // Store the claimed access URL
      setTestStatus('success');
    } catch (error) {
      setTestStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAccountIds(availableAccounts.map((acc) => acc.id));
    } else {
      setSelectedAccountIds([]);
    }
  };

  const handleSelectAccounts = () => {
    const selectedAccounts = availableAccounts
      .filter((acc) => selectedAccountIds.includes(acc.id))
      .map((acc) => ({
        externalAccountId: acc.id,
        accountName: acc.name,
        accountType: mapSimpleFinType(acc.type),
        balance: acc.balance,
      }));

    onAccountSelected({
      accessUrl,
      accounts: selectedAccounts,
      syncStartDate: syncStartDate || undefined,
    });
  };

  const isReadyToSelect = testStatus === 'success' && selectedAccountIds.length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="setupToken" className="text-sm font-medium">
            SimpleFin Setup Token
          </label>
          <a
            href="https://bridge.simplefin.org/simplefin/create"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Get Setup Token
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <Input
          id="setupToken"
          value={setupToken}
          onChange={(e) => setSetupToken(e.target.value)}
          placeholder="Paste your setup token here..."
          disabled={testStatus === 'testing'}
        />
        <p className="text-xs text-muted-foreground">
          You'll need a SimpleFin Bridge subscription ($1.50/month). Click the link above to generate a setup token.
        </p>
      </div>

      <Button
        type="button"
        onClick={handleTestConnection}
        disabled={testStatus === 'testing' || !setupToken.trim()}
        className="w-full"
        variant="outline"
      >
        {testStatus === 'testing' ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Claiming Token & Testing...
          </>
        ) : (
          'Connect to SimpleFin'
        )}
      </Button>

      {testStatus === 'success' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Successfully connected to SimpleFin! Select an account below.
          </AlertDescription>
        </Alert>
      )}

      {testStatus === 'error' && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
        </Alert>
      )}

      {testStatus === 'success' && availableAccounts.length > 0 && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select SimpleFin Accounts</label>

            {/* Select All checkbox */}
            <div className="flex items-center gap-2 p-2 border-b">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectedAccountIds.length === availableAccounts.length && availableAccounts.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                Select All ({availableAccounts.length} account{availableAccounts.length !== 1 ? 's' : ''})
              </label>
            </div>

            {/* Account list with checkboxes */}
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {availableAccounts.map((account) => (
                <div key={account.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    id={account.id}
                    checked={selectedAccountIds.includes(account.id)}
                    onChange={() => toggleAccountSelection(account.id)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={account.id} className="flex-1 text-sm cursor-pointer">
                    <div className="font-medium">{account.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Balance: {formatCurrency(account.balance)} • Type: {account.type || 'Unknown'}
                    </div>
                  </label>
                </div>
              ))}
            </div>

            {/* Selection summary */}
            <div className="text-sm text-muted-foreground">
              {selectedAccountIds.length} of {availableAccounts.length} account{availableAccounts.length !== 1 ? 's' : ''} selected
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="syncStartDate" className="text-sm font-medium">
              Import Transactions Since (Optional)
            </label>
            <Input
              id="syncStartDate"
              type="date"
              value={syncStartDate}
              onChange={(e) => setSyncStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to import all available transactions (usually last 90 days)
            </p>
          </div>

          <Button
            type="button"
            onClick={handleSelectAccounts}
            disabled={!isReadyToSelect}
            className="w-full"
          >
            Connect {selectedAccountIds.length} Account{selectedAccountIds.length !== 1 ? 's' : ''}
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * Map SimpleFin account type to our AccountType
 */
function mapSimpleFinType(type?: string): AccountType {
  if (!type) return 'other';

  const lowerType = type.toLowerCase();
  if (lowerType.includes('check')) return 'checking';
  if (lowerType.includes('sav')) return 'savings';
  if (lowerType.includes('credit')) return 'credit_card';
  if (lowerType.includes('cash')) return 'cash';
  if (lowerType.includes('invest') || lowerType.includes('brokerage')) return 'investment';
  if (lowerType.includes('line')) return 'line_of_credit';

  return 'other';
}
