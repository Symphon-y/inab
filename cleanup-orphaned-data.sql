-- Cleanup Orphaned Data Script
-- This script soft-deletes entities whose parent entities have been deleted
-- Run this to fix data integrity issues from incomplete cascade deletions

-- 1. Soft-delete transactions whose accounts are deleted
UPDATE transactions
SET
  deleted_at = NOW(),
  updated_at = NOW()
WHERE
  account_id IN (SELECT id FROM accounts WHERE deleted_at IS NOT NULL)
  AND deleted_at IS NULL;

-- 2. Soft-delete account connections whose accounts are deleted
UPDATE account_connections
SET
  deleted_at = NOW(),
  updated_at = NOW()
WHERE
  account_id IN (SELECT id FROM accounts WHERE deleted_at IS NOT NULL)
  AND deleted_at IS NULL;

-- 3. Soft-delete goals whose categories are deleted
UPDATE goals
SET
  deleted_at = NOW(),
  updated_at = NOW()
WHERE
  category_id IN (SELECT id FROM categories WHERE deleted_at IS NOT NULL)
  AND deleted_at IS NULL;

-- 4. Soft-delete categories whose category groups are deleted
UPDATE categories
SET
  deleted_at = NOW(),
  updated_at = NOW()
WHERE
  category_group_id IN (SELECT id FROM category_groups WHERE deleted_at IS NOT NULL)
  AND deleted_at IS NULL;

-- 5. Soft-delete accounts whose plan is deleted
UPDATE accounts
SET
  deleted_at = NOW(),
  updated_at = NOW()
WHERE
  plan_id IN (SELECT id FROM plans WHERE deleted_at IS NOT NULL)
  AND deleted_at IS NULL;

-- 6. Soft-delete category groups whose plan is deleted
UPDATE category_groups
SET
  deleted_at = NOW(),
  updated_at = NOW()
WHERE
  plan_id IN (SELECT id FROM plans WHERE deleted_at IS NOT NULL)
  AND deleted_at IS NULL;

-- 7. Soft-delete payees whose plan is deleted
UPDATE payees
SET
  deleted_at = NOW(),
  updated_at = NOW()
WHERE
  plan_id IN (SELECT id FROM plans WHERE deleted_at IS NOT NULL)
  AND deleted_at IS NULL;

-- Verification Queries (run these to check results)
-- Should all return 0

-- Check orphaned transactions
SELECT COUNT(*) as orphaned_transactions FROM transactions t
WHERE t.account_id IN (SELECT id FROM accounts WHERE deleted_at IS NOT NULL)
  AND t.deleted_at IS NULL;

-- Check orphaned account connections
SELECT COUNT(*) as orphaned_connections FROM account_connections ac
WHERE ac.account_id IN (SELECT id FROM accounts WHERE deleted_at IS NOT NULL)
  AND ac.deleted_at IS NULL;

-- Check orphaned goals
SELECT COUNT(*) as orphaned_goals FROM goals g
WHERE g.category_id IN (SELECT id FROM categories WHERE deleted_at IS NOT NULL)
  AND g.deleted_at IS NULL;

-- 8. Delete budget allocations for deleted categories
-- (Hard delete since budget_allocations don't have deletedAt field and are derived data)
DELETE FROM budget_allocations
WHERE category_id IN (SELECT id FROM categories WHERE deleted_at IS NOT NULL);

-- Verification query for orphaned budget allocations
SELECT COUNT(*) as orphaned_allocations FROM budget_allocations ba
WHERE ba.category_id IN (SELECT id FROM categories WHERE deleted_at IS NOT NULL);
