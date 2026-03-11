# Bank Transaction Import - Implementation Progress

**Start Date:** 2026-03-11
**Status:** 🟡 In Progress
**Provider:** SimpleFin ($1.50/month per user, BYOK model)

## Overview

This document tracks the implementation of bank transaction import functionality using SimpleFin API with a bring-your-own-API-key (BYOK) model.

**Reference Plan:** `.claude/plans/mutable-stargazing-church.md`

---

## Phase 1: Foundation ✅

### Database Schema
- [x] Create `src/db/schema/account-connections.ts`
  - [x] Define provider enum (simplefin, manual)
  - [x] Define status enum (active, error, disconnected, expired)
  - [x] Define table schema with all fields
  - [x] Add relations to accounts table
  - [x] Export types
- [x] Create `src/db/schema/import-sync-logs.ts`
  - [x] Define table schema
  - [x] Add relations to account_connections
  - [x] Export types
- [x] Update `src/db/schema/index.ts`
  - [x] Export account-connections schema
  - [x] Export import-sync-logs schema
- [x] Generate database migration
  - [x] Run `npm run db:generate`
  - [x] Review migration SQL (`src/db/migrations/0001_motionless_ravenous.sql`)
  - [ ] Run `npm run db:migrate` (pending: Docker Desktop needs to be running)
  - [ ] Verify tables created in database

### Encryption Infrastructure
- [x] Create `src/lib/encryption.ts`
  - [x] Implement `encrypt()` function using AES-256-GCM
  - [x] Implement `decrypt()` function
  - [x] Implement `getEncryptionKey()` helper
  - [x] Add error handling for missing env vars
  - [x] Add JSDoc documentation
- [x] Update `.env.example`
  - [x] Add `ENCRYPTION_KEY` placeholder
  - [x] Add `ENCRYPTION_SALT` placeholder
  - [x] Add comments explaining key generation
- [ ] Generate encryption keys for development
  - [ ] Run key generation command
  - [ ] Update local `.env` file
  - [ ] Document process in README

**Phase 1 Completion:** ✅ 13/15 tasks (87%)

---

## Phase 2: SimpleFin Integration ⏳

### SimpleFin API Client
- [ ] Create `src/lib/bank-integrations/simplefin.ts`
  - [ ] Define SimpleFin credential interfaces
  - [ ] Define SimpleFin transaction interfaces
  - [ ] Define SimpleFin account interfaces
  - [ ] Implement `fetchSimpleFinData()` function
    - [ ] Parse access URL
    - [ ] Add date filtering support
    - [ ] Make HTTP request with auth
    - [ ] Handle response parsing
  - [ ] Implement `testSimpleFinConnection()` function
    - [ ] Validate URL format
    - [ ] Test connection without storing
    - [ ] Return boolean result
  - [ ] Add error handling
    - [ ] 401 authentication errors
    - [ ] Network errors
    - [ ] Invalid response format
  - [ ] Add JSDoc documentation

**Phase 2 Completion:** ⬜ 0/8 tasks

---

## Phase 3: Core Import Logic ⏳

### Transaction Import Service
- [ ] Create `src/lib/import/transaction-importer.ts`
  - [ ] Define `ImportedTransaction` interface
  - [ ] Implement `generateImportId()` helper
  - [ ] Implement `importTransactionsForAccount()` main function
    - [ ] Fetch connection from database
    - [ ] Create initial sync log entry
    - [ ] Fetch transactions from SimpleFin
    - [ ] Loop through transactions
      - [ ] Check for existing by importId
      - [ ] Update existing if amount/status changed
      - [ ] Insert new transactions
      - [ ] Update account balances using SQL template
      - [ ] Track imported/updated/skipped counts
    - [ ] Handle errors gracefully
    - [ ] Update sync log with results
    - [ ] Update connection lastSyncAt
  - [ ] Implement `fetchTransactionsFromProvider()` helper
    - [ ] Map SimpleFin transactions to internal format
    - [ ] Convert amounts to cents
    - [ ] Parse dates correctly
    - [ ] Handle missing optional fields
  - [ ] Add comprehensive error handling
  - [ ] Add JSDoc documentation

### Balance Update Logic
- [ ] Verify balance update pattern matches existing code
  - [ ] Review `src/app/api/transactions/route.ts:66-84`
  - [ ] Use SQL template for atomic updates
  - [ ] Handle cleared vs uncleared balance
  - [ ] Update total balance

### Budget Activity Updates
- [ ] Verify budget activity pattern matches existing code
  - [ ] Review `src/app/api/transactions/route.ts:86-92`
  - [ ] Call `updateBudgetActivityForTransaction()` for categorized txns
  - [ ] Pass correct category and date

**Phase 3 Completion:** ⬜ 0/16 tasks

---

## Phase 4: API Endpoints ⏳

### Connect Endpoint
- [ ] Create `src/app/api/accounts/[id]/connect/route.ts`
  - [ ] Implement POST handler
  - [ ] Parse request body (provider, credentials, externalAccountId, syncStartDate)
  - [ ] Validate account exists
  - [ ] Test connection before storing
  - [ ] Encrypt credentials
  - [ ] Check for existing connection
  - [ ] Update or insert connection
  - [ ] Return connection object
  - [ ] Add error handling
    - [ ] Account not found (404)
    - [ ] Invalid credentials (400)
    - [ ] Server errors (500)

### Sync Endpoint
- [ ] Create `src/app/api/accounts/[id]/sync/route.ts`
  - [ ] Implement POST handler
  - [ ] Find connection for account
  - [ ] Validate connection is active
  - [ ] Call `importTransactionsForAccount()`
  - [ ] Return import summary
  - [ ] Add error handling
    - [ ] No connection (400)
    - [ ] Connection inactive (400)
    - [ ] Sync errors (500)

### Connection Status Endpoint
- [ ] Create `src/app/api/accounts/[id]/connection/route.ts`
  - [ ] Implement GET handler
    - [ ] Fetch connection details
    - [ ] Fetch recent sync logs (last 10)
    - [ ] Return combined response
    - [ ] Handle not found (404)
  - [ ] Implement DELETE handler
    - [ ] Soft delete connection
    - [ ] Update status to 'disconnected'
    - [ ] Return success response
    - [ ] Handle not found (404)

**Phase 4 Completion:** ⬜ 0/18 tasks

---

## Phase 5: CSV Import Fallback ⏳

### CSV Parser
- [ ] Install dependencies
  - [ ] Run `npm install csv-parse`
  - [ ] Run `npm install -D @types/csv-parse`
- [ ] Create `src/lib/import/csv-parser.ts`
  - [ ] Define `CSVTransaction` interface
  - [ ] Implement `parseCSV()` function
  - [ ] Handle various column name formats (case-insensitive)
  - [ ] Validate required columns
  - [ ] Skip empty lines
  - [ ] Trim whitespace
  - [ ] Return parsed transactions array
  - [ ] Add error handling for malformed CSV
  - [ ] Add JSDoc documentation

### CSV Upload Endpoint
- [ ] Create `src/app/api/accounts/[id]/import-csv/route.ts`
  - [ ] Implement POST handler
  - [ ] Parse multipart form data
  - [ ] Read file content
  - [ ] Call CSV parser
  - [ ] Loop through parsed transactions
    - [ ] Validate date format
    - [ ] Validate amount format
    - [ ] Convert amount to cents
    - [ ] Generate importId (csv:{accountId}:{date}:{amount}:{payee})
    - [ ] Check for duplicates
    - [ ] Insert new transactions
    - [ ] Track imported/skipped counts
  - [ ] Return import summary
  - [ ] Add error handling
    - [ ] No file provided (400)
    - [ ] Invalid CSV format (400)
    - [ ] Parse errors (400)
    - [ ] Server errors (500)

**Phase 5 Completion:** ⬜ 0/17 tasks

---

## Phase 6: Testing & Polish ⏳

### Error Handling
- [ ] Implement user-friendly error messages
  - [ ] Map technical errors to user messages
  - [ ] Create error message constants
  - [ ] Test authentication error flow
  - [ ] Test network error flow
  - [ ] Test partial import flow
- [ ] Add retry logic for network errors
  - [ ] Implement exponential backoff
  - [ ] Limit retry attempts
  - [ ] Log retry attempts

### Unit Tests
- [ ] Test encryption functions
  - [ ] Test encrypt/decrypt round-trip
  - [ ] Test missing encryption key error
  - [ ] Test invalid encrypted data
- [ ] Test CSV parser
  - [ ] Test valid CSV formats
  - [ ] Test missing required columns
  - [ ] Test empty CSV
  - [ ] Test various date formats
  - [ ] Test various amount formats
- [ ] Test SimpleFin integration
  - [ ] Mock SimpleFin API responses
  - [ ] Test successful data fetch
  - [ ] Test authentication failure
  - [ ] Test network failure
  - [ ] Test invalid response format

### Integration Tests
- [ ] Test full import flow
  - [ ] Create test account
  - [ ] Connect to SimpleFin (mock/sandbox)
  - [ ] Trigger sync
  - [ ] Verify transactions imported
  - [ ] Verify balances updated
  - [ ] Verify budget activity updated
  - [ ] Verify sync logs created
- [ ] Test deduplication
  - [ ] Import same transactions twice
  - [ ] Verify no duplicates created
  - [ ] Verify updated count correct
- [ ] Test CSV import flow
  - [ ] Upload test CSV
  - [ ] Verify transactions imported
  - [ ] Re-upload same CSV
  - [ ] Verify no duplicates

### End-to-End Testing
- [ ] SimpleFin connection flow
  - [ ] Obtain SimpleFin test credentials
  - [ ] Test connect endpoint
  - [ ] Verify encrypted credentials in DB
  - [ ] Test sync endpoint
  - [ ] Verify transactions in DB with correct importId
  - [ ] Verify balances updated correctly
  - [ ] Test re-sync (deduplication)
  - [ ] Test disconnect endpoint
  - [ ] Verify soft delete
- [ ] CSV import flow
  - [ ] Test upload with sample CSV
  - [ ] Verify transactions imported
  - [ ] Test various CSV formats
  - [ ] Test error scenarios
- [ ] Security verification
  - [ ] Check credentials encrypted in DB
  - [ ] Check no credentials in logs
  - [ ] Check no credentials in error messages
  - [ ] Test key rotation process

### Documentation
- [ ] Update README with setup instructions
  - [ ] Document encryption key generation
  - [ ] Document SimpleFin setup for users
  - [ ] Document API endpoints
  - [ ] Document CSV format requirements
- [ ] Add API documentation comments
- [ ] Add inline code comments for complex logic
- [ ] Create user guide for connecting bank accounts

**Phase 6 Completion:** ⬜ 0/43 tasks

---

## Final Verification Checklist

### Manual Testing
- [ ] Environment variables configured (ENCRYPTION_KEY, ENCRYPTION_SALT)
- [ ] Database migration applied successfully
- [ ] SimpleFin test account connects successfully
- [ ] Transactions imported with correct amounts (cents conversion)
- [ ] Deduplication prevents duplicate imports (re-sync test)
- [ ] Account balances update correctly (clearedBalance, unclearedBalance)
- [ ] Budget activity updates for categorized transactions
- [ ] Sync logs created with correct counts (imported, updated, skipped)
- [ ] Connection status updates appropriately (active, error, expired)
- [ ] Error messages are user-friendly (no technical jargon)
- [ ] Disconnect removes connection cleanly (soft delete)
- [ ] CSV import works with various formats
- [ ] No sensitive data in error logs (no decrypted credentials)

### Production Readiness
- [ ] Generate production encryption keys
- [ ] Store keys in secure environment (not in repo)
- [ ] Set up production environment variables
- [ ] Test database migration in staging
- [ ] Review all error messages for user-friendliness
- [ ] Verify no sensitive data logged
- [ ] Test with real SimpleFin account (not sandbox)
- [ ] Document production deployment process
- [ ] Create rollback plan if needed
- [ ] Monitor initial production syncs

---

## Overall Progress

**Total Tasks:** 117
**Completed:** 13
**In Progress:** 2
**Remaining:** 102

**Progress:** ■⬜⬜⬜⬜⬜⬜⬜⬜⬜ 11%

---

## Notes & Issues

### Blockers
- ⏸️ **Database migration pending**: Docker Desktop needs to be started to run `npm run db:migrate`

### Questions
- None yet

### Decisions Made
- ✅ Using SimpleFin only (not Teller) due to better pricing for regular use
- ✅ Using BYOK model (users pay for their own SimpleFin subscriptions)
- ✅ CSV import as fallback for users who don't want to pay for API
- ✅ Manual sync only (no automatic scheduled syncs in initial version)

### Phase 1 Completed (2026-03-11)
- ✅ Created account_connections schema with enums and relations
- ✅ Created import_sync_logs schema with cascade delete
- ✅ Implemented AES-256-GCM encryption utility
- ✅ Updated .env.example with encryption key placeholders
- ✅ Generated migration file: `src/db/migrations/0001_motionless_ravenous.sql`
- ⏳ Pending: Run migration once Docker is started
- ⏳ Pending: Generate encryption keys for local development

---

## Next Steps

1. ✅ ~~Start with Phase 1: Database schema and encryption infrastructure~~
2. **Start Docker Desktop and run database migration**
3. **Generate encryption keys for local .env**
4. Test encryption thoroughly before proceeding
5. Implement SimpleFin integration with test credentials
6. Build core import logic with extensive error handling
7. Create API endpoints and test with Postman/similar
8. Add CSV fallback functionality
9. Comprehensive testing before production

---

**Last Updated:** 2026-03-11 16:12 EST
