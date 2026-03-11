-- Safe migration to add multi-plan support without data loss
-- Run with: docker exec inab-db-1 psql -U inab -d inab_dev -f /path/to/this/file.sql

-- Step 1: Create plans table
CREATE TABLE IF NOT EXISTS plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  icon varchar(10) DEFAULT '💰',
  last_used_at timestamp with time zone DEFAULT now() NOT NULL,
  is_default boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted_at timestamp with time zone
);

-- Step 2: Create default plan
INSERT INTO plans (name, icon, is_default, sort_order)
VALUES ('My Budget', '💰', true, 0)
ON CONFLICT DO NOTHING;

-- Step 3: Add planId columns as NULLABLE first (to avoid data loss)
ALTER TABLE category_groups ADD COLUMN IF NOT EXISTS plan_id uuid;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS plan_id uuid;
ALTER TABLE payees DROP CONSTRAINT IF EXISTS unique_payee_name;
ALTER TABLE payees ADD COLUMN IF NOT EXISTS plan_id uuid;

-- Step 4: Populate planId with default plan for all existing records
UPDATE category_groups
SET plan_id = (SELECT id FROM plans WHERE is_default = true)
WHERE plan_id IS NULL;

UPDATE accounts
SET plan_id = (SELECT id FROM plans WHERE is_default = true)
WHERE plan_id IS NULL;

UPDATE payees
SET plan_id = (SELECT id FROM plans WHERE is_default = true)
WHERE plan_id IS NULL;

-- Step 5: Make planId NOT NULL
ALTER TABLE category_groups ALTER COLUMN plan_id SET NOT NULL;
ALTER TABLE accounts ALTER COLUMN plan_id SET NOT NULL;
ALTER TABLE payees ALTER COLUMN plan_id SET NOT NULL;

-- Step 6: Add foreign key constraints
ALTER TABLE category_groups
ADD CONSTRAINT category_groups_plan_id_plans_id_fk
FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE cascade;

ALTER TABLE accounts
ADD CONSTRAINT accounts_plan_id_plans_id_fk
FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE cascade;

ALTER TABLE payees
ADD CONSTRAINT payees_plan_id_plans_id_fk
FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE cascade;

-- Step 7: Recreate unique constraint for payees with planId
ALTER TABLE payees
ADD CONSTRAINT unique_payee_name UNIQUE(plan_id, name);

-- Step 8: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_category_groups_plan_id ON category_groups(plan_id);
CREATE INDEX IF NOT EXISTS idx_accounts_plan_id ON accounts(plan_id);
CREATE INDEX IF NOT EXISTS idx_payees_plan_id ON payees(plan_id);
CREATE INDEX IF NOT EXISTS idx_plans_is_default ON plans(is_default) WHERE is_default = true;

-- Verify migration
SELECT 'Migration complete!' as status;
SELECT COUNT(*) as plan_count FROM plans;
SELECT COUNT(*) as category_groups_migrated FROM category_groups WHERE plan_id IS NOT NULL;
SELECT COUNT(*) as accounts_migrated FROM accounts WHERE plan_id IS NOT NULL;
SELECT COUNT(*) as payees_migrated FROM payees WHERE plan_id IS NOT NULL;
