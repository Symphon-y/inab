# Bank Transaction Import Documentation

## Overview

This feature enables cost-effective bank transaction imports using SimpleFin API ($1.50/month per user) with a bring-your-own-API-key (BYOK) model. Users pay for their own SimpleFin subscriptions, keeping costs predictable and scalable.

## Features

- **SimpleFin Integration**: Automatic transaction imports from 16,000+ US banks
- **CSV Import Fallback**: Manual upload for users who prefer not to use API
- **Deduplication**: Prevents duplicate transactions using `importId` field
- **Balance Tracking**: Automatic updates to account balances (total, cleared, uncleared)
- **Budget Integration**: Categorized transactions automatically update budget activity
- **Audit Trail**: Complete import history with sync logs
- **Secure Storage**: AES-256-GCM encrypted credential storage

## Architecture

### Database Schema

**`account_connections`** - Stores encrypted API credentials per account
```typescript
{
  id: uuid,
  accountId: uuid,
  provider: 'simplefin' | 'manual',
  encryptedCredentials: text, // AES-256-GCM encrypted
  externalAccountId: string,
  status: 'active' | 'error' | 'disconnected' | 'expired',
  lastSyncAt: timestamp,
  lastSyncStatus: 'success' | 'partial' | 'failed',
  syncStartDate: timestamp // Only import after this date
}
```

**`import_sync_logs`** - Audit trail for all imports
```typescript
{
  id: uuid,
  connectionId: uuid,
  status: 'in_progress' | 'success' | 'partial' | 'failed',
  transactionsImported: number,
  transactionsUpdated: number,
  transactionsSkipped: number,
  errorMessage: text,
  startedAt: timestamp,
  completedAt: timestamp
}
```

### API Endpoints

#### Connect Account to SimpleFin
```http
POST /api/accounts/{accountId}/connect

Request Body:
{
  "provider": "simplefin",
  "credentials": {
    "accessUrl": "https://..."
  },
  "externalAccountId": "acc-123",
  "syncStartDate": "2024-01-01T00:00:00Z" // Optional
}

Response: 201 Created
{
  "id": "conn-123",
  "accountId": "...",
  "provider": "simplefin",
  "status": "active",
  "createdAt": "..."
}
```

#### Trigger Manual Sync
```http
POST /api/accounts/{accountId}/sync

Response: 200 OK
{
  "success": true,
  "imported": 25,
  "updated": 3,
  "skipped": 150,
  "errors": []
}
```

#### Get Connection Status
```http
GET /api/accounts/{accountId}/connection

Response: 200 OK
{
  "connection": {
    "id": "conn-123",
    "provider": "simplefin",
    "status": "active",
    "lastSyncAt": "2024-01-15T10:30:00Z",
    "lastSyncStatus": "success"
  },
  "recentSyncs": [
    {
      "id": "sync-456",
      "status": "success",
      "transactionsImported": 25,
      "startedAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T10:30:05Z"
    }
  ]
}
```

#### Disconnect
```http
DELETE /api/accounts/{accountId}/connection

Response: 200 OK
{
  "success": true
}
```

#### CSV Import
```http
POST /api/accounts/{accountId}/import-csv
Content-Type: multipart/form-data

Form Data:
- file: transactions.csv

Response: 200 OK
{
  "success": true,
  "imported": 50,
  "skipped": 0,
  "total": 50,
  "errors": []
}
```

### CSV Format

**Required Columns:**
- `date` - Transaction date (YYYY-MM-DD or any standard format)
- `amount` - Amount in dollars (negative for outflows, positive for inflows)

**Optional Columns:**
- `payee` or `description` - Payee name
- `memo` or `notes` - Transaction memo

**Example CSV:**
```csv
date,payee,amount,memo
2024-01-15,Starbucks,-5.50,Morning coffee
2024-01-16,Paycheck,1500.00,Salary
2024-01-17,Grocery Store,-125.43,Weekly groceries
```

**Notes:**
- Column names are case-insensitive
- Empty lines are skipped
- Whitespace is automatically trimmed
- Quoted fields with commas are supported

## Setup

### 1. Environment Variables

Add to `.env`:
```bash
# Generate strong keys using:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

ENCRYPTION_KEY=your-64-char-hex-string-here
ENCRYPTION_SALT=your-64-char-hex-string-here
```

### 2. Database Migration

```bash
npm run db:migrate
```

This creates the `account_connections` and `import_sync_logs` tables.

### 3. User Setup (SimpleFin)

Users need to:
1. Subscribe to SimpleFin Bridge ($1.50/month or $15/year) at simplefin.org
2. Connect their bank accounts through SimpleFin Bridge
3. Obtain their SimpleFin access URL
4. Provide the access URL when connecting in your app

## Usage Flow

### SimpleFin Import

1. **Connect Account**
   ```typescript
   const response = await fetch(`/api/accounts/${accountId}/connect`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       provider: 'simplefin',
       credentials: {
         accessUrl: 'https://...' // From SimpleFin Bridge
       },
       externalAccountId: 'acc-123', // SimpleFin account ID
       syncStartDate: '2024-01-01T00:00:00Z' // Optional
     })
   });
   ```

2. **Trigger Sync**
   ```typescript
   const response = await fetch(`/api/accounts/${accountId}/sync`, {
     method: 'POST'
   });
   const result = await response.json();
   console.log(`Imported ${result.imported} new transactions`);
   ```

3. **Check Status**
   ```typescript
   const response = await fetch(`/api/accounts/${accountId}/connection`);
   const { connection, recentSyncs } = await response.json();
   ```

### CSV Import

1. **Upload File**
   ```typescript
   const formData = new FormData();
   formData.append('file', csvFile);

   const response = await fetch(`/api/accounts/${accountId}/import-csv`, {
     method: 'POST',
     body: formData
   });
   const result = await response.json();
   ```

## Transaction Deduplication

The system prevents duplicate imports using the `importId` field:

- **SimpleFin**: `simplefin:{transactionId}`
- **CSV**: `csv:{accountId}:{date}:{amount}:{payee}`

When re-syncing or re-uploading:
- Existing transactions are skipped
- Transactions with changed amounts/status are updated
- Account balances are recalculated correctly

## Security

### Credential Encryption

All SimpleFin access URLs are encrypted using AES-256-GCM before storage:

```typescript
import { encrypt, decrypt } from '@/lib/encryption';

// Storing credentials
const encrypted = encrypt(JSON.stringify({ accessUrl: '...' }));

// Retrieving credentials
const decrypted = decrypt(encrypted);
const credentials = JSON.parse(decrypted);
```

### Best Practices

- ✅ Encryption keys stored in environment variables (not in code)
- ✅ Different keys for dev/staging/production
- ✅ Credentials never logged or exposed in errors
- ✅ HTTPS required for all API communications
- ✅ Soft delete for connections (data retained for audit)

## Testing

### Run Unit Tests
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:ui          # Visual UI
npm run test:coverage    # Coverage report
```

### Test Coverage

- **Encryption**: 12 tests - Round-trip, error handling, key rotation
- **CSV Parser**: 16 tests - Various formats, error cases, edge cases
- **SimpleFin**: 14 tests - API calls, error handling, network failures

**Total: 42 tests passing**

### Manual Testing

1. **SimpleFin Sandbox**
   - Use SimpleFin's test credentials
   - Connect test account
   - Trigger sync
   - Verify transactions imported

2. **CSV Import**
   - Create test CSV file
   - Upload via API
   - Verify transactions created
   - Re-upload same file (test deduplication)

3. **Error Scenarios**
   - Invalid credentials → Clear error message
   - Network failure → Graceful retry
   - Partial import → Success + error details

## Monitoring

### Sync Logs

Query recent syncs:
```sql
SELECT
  isl.*,
  ac.provider,
  a.name as account_name
FROM import_sync_logs isl
JOIN account_connections ac ON isl.connection_id = ac.id
JOIN accounts a ON ac.account_id = a.id
WHERE isl.status = 'failed'
ORDER BY isl.started_at DESC
LIMIT 10;
```

### Connection Health

Check for expired/error connections:
```sql
SELECT
  ac.id,
  ac.provider,
  ac.status,
  ac.last_sync_at,
  ac.last_error,
  a.name as account_name
FROM account_connections ac
JOIN accounts a ON ac.account_id = a.id
WHERE ac.status IN ('error', 'expired')
  AND ac.deleted_at IS NULL;
```

## Cost Analysis

### SimpleFin (Recommended)

**Per User Cost:**
- $1.50/month ($18/year)
- OR $15/year (save $3)
- Unlimited API calls
- User pays directly (BYOK)

**For 100 users:**
- Monthly: $150 ($1.50 × 100)
- Annual: $1,500 ($15 × 100)
- **Cost to you: $0** (users pay their own)

### vs. Plaid

**Plaid Pricing:**
- $500-2000/month minimum
- Per-connection fees
- You pay for all users

**100 users on Plaid:**
- Minimum: $6,000-24,000/year
- **10-160x more expensive than SimpleFin!**

## Troubleshooting

### Common Issues

**"ENCRYPTION_KEY environment variable not set"**
- Add encryption keys to `.env`
- Restart the application

**"SimpleFIN authentication failed"**
- Check access URL is correct
- Verify SimpleFin subscription is active
- Try reconnecting account

**"CSV must have date and amount columns"**
- Check CSV has required columns
- Column names are case-insensitive
- Use `payee` or `description` for payee name

**"Connection is not active"**
- Check connection status
- Reconnect if expired/error state
- View last error in connection details

### Debug Mode

Enable verbose logging:
```typescript
// In transaction-importer.ts
console.log('Fetching transactions from', provider);
console.log('Import result:', { imported, updated, skipped, errors });
```

## Future Enhancements

**Not in current scope but possible:**
- Automatic scheduled syncs (cron jobs)
- Transaction categorization suggestions (ML)
- Multi-account parallel sync
- OFX file import support
- Real-time webhooks (if SimpleFin adds support)
- International banks (Tink for EU)

## Support

### SimpleFin Resources
- Website: https://simplefin.org
- Documentation: https://beta-bridge.simplefin.org/info/developers
- Support: Contact through SimpleFin Bridge

### Internal Resources
- Implementation Progress: `IMPLEMENTATION_PROGRESS.md`
- Full Plan: `.claude/plans/mutable-stargazing-church.md`
- Test Files: `src/__tests__/`

## License

Part of the INAB (It's Not A Budget) application.
