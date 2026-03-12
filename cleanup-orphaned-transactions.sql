-- Find and soft-delete transactions whose accounts are already deleted
UPDATE transactions
SET 
  "deletedAt" = NOW(),
  "updatedAt" = NOW()
WHERE 
  "accountId" IN (
    SELECT id FROM accounts WHERE "deletedAt" IS NOT NULL
  )
  AND "deletedAt" IS NULL;

-- Find and soft-delete account connections whose accounts are already deleted  
UPDATE account_connections
SET
  "deletedAt" = NOW(),
  "updatedAt" = NOW()
WHERE
  "accountId" IN (
    SELECT id FROM accounts WHERE "deletedAt" IS NOT NULL
  )
  AND "deletedAt" IS NULL;
