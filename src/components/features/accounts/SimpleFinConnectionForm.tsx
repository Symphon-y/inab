'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react';
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
    externalAccountId: string;
    accountName: string;
    accountType: AccountType;
    balance: number;
    syncStartDate?: string;
  }) => void;
}

export function SimpleFinConnectionForm({ onAccountSelected }: SimpleFinConnectionFormProps) {
  const [setupToken, setSetupToken] = useState('');
  const [accessUrl, setAccessUrl] = useState(''); // Store the claimed access URL
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState<SimpleFinAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
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

  const handleSelectAccount = () => {
    const selected = availableAccounts.find((acc) => acc.id === selectedAccountId);
    if (!selected) return;

    // Map SimpleFin account type to our AccountType
    const accountType = mapSimpleFinType(selected.type);

    onAccountSelected({
      accessUrl,
      externalAccountId: selected.id,
      accountName: selected.name,
      accountType,
      balance: selected.balance,
      syncStartDate: syncStartDate || undefined,
    });
  };

  const isReadyToSelect = testStatus === 'success' && selectedAccountId;

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
            <label htmlFor="account" className="text-sm font-medium">
              Select SimpleFin Account
            </label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an account" />
              </SelectTrigger>
              <SelectContent>
                {availableAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} - ${(account.balance / 100).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            onClick={handleSelectAccount}
            disabled={!isReadyToSelect}
            className="w-full"
          >
            Connect Account
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
