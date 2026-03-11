/**
 * Data migration script to add plan support to existing data
 *
 * This script:
 * 1. Creates a default "My Budget" plan
 * 2. Migrates all existing category_groups, accounts, and payees to use that plan
 *
 * Run with: npx tsx scripts/migrate-to-plans.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { plans, categoryGroups, accounts, payees } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables
config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function migrate() {
  console.log('🚀 Starting migration to multi-plan support...\n');

  try {
    // Step 1: Check if plans table exists
    console.log('1️⃣ Checking if plans table exists...');
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'plans'
      );
    `);

    if (!result.rows[0].exists) {
      console.log('❌ Plans table does not exist. Please run db:push first.');
      process.exit(1);
    }
    console.log('✅ Plans table exists\n');

    // Step 2: Check if default plan already exists
    console.log('2️⃣ Checking for existing default plan...');
    const existingPlans = await db.select().from(plans);

    let defaultPlan;
    if (existingPlans.length > 0) {
      defaultPlan = existingPlans.find(p => p.isDefault) || existingPlans[0];
      console.log(`✅ Found existing plan: "${defaultPlan.name}" (${defaultPlan.id})\n`);
    } else {
      // Step 3: Create default plan
      console.log('3️⃣ Creating default "My Budget" plan...');
      [defaultPlan] = await db
        .insert(plans)
        .values({
          name: 'My Budget',
          icon: '💰',
          isDefault: true,
          sortOrder: 0,
        })
        .returning();
      console.log(`✅ Created default plan: ${defaultPlan.id}\n`);
    }

    // Step 4: Check for unmigrated data
    console.log('4️⃣ Checking for unmigrated data...');

    const categoryGroupsWithoutPlan = await pool.query(`
      SELECT COUNT(*) as count FROM category_groups WHERE plan_id IS NULL
    `);
    const accountsWithoutPlan = await pool.query(`
      SELECT COUNT(*) as count FROM accounts WHERE plan_id IS NULL
    `);
    const payeesWithoutPlan = await pool.query(`
      SELECT COUNT(*) as count FROM payees WHERE plan_id IS NULL
    `);

    const cgCount = parseInt(categoryGroupsWithoutPlan.rows[0].count);
    const accCount = parseInt(accountsWithoutPlan.rows[0].count);
    const payeeCount = parseInt(payeesWithoutPlan.rows[0].count);

    if (cgCount === 0 && accCount === 0 && payeeCount === 0) {
      console.log('✅ All data already migrated!\n');
      console.log('🎉 Migration complete!');
      await pool.end();
      return;
    }

    console.log(`Found unmigrated data:`);
    console.log(`  - ${cgCount} category groups`);
    console.log(`  - ${accCount} accounts`);
    console.log(`  - ${payeeCount} payees\n`);

    // Step 5: Migrate category groups
    if (cgCount > 0) {
      console.log('5️⃣ Migrating category groups...');
      await pool.query(`
        UPDATE category_groups
        SET plan_id = $1
        WHERE plan_id IS NULL
      `, [defaultPlan.id]);
      console.log(`✅ Migrated ${cgCount} category groups\n`);
    }

    // Step 6: Migrate accounts
    if (accCount > 0) {
      console.log('6️⃣ Migrating accounts...');
      await pool.query(`
        UPDATE accounts
        SET plan_id = $1
        WHERE plan_id IS NULL
      `, [defaultPlan.id]);
      console.log(`✅ Migrated ${accCount} accounts\n`);
    }

    // Step 7: Migrate payees
    if (payeeCount > 0) {
      console.log('7️⃣ Migrating payees...');
      await pool.query(`
        UPDATE payees
        SET plan_id = $1
        WHERE plan_id IS NULL
      `, [defaultPlan.id]);
      console.log(`✅ Migrated ${payeeCount} payees\n`);
    }

    console.log('🎉 Migration complete!');
    console.log(`\nAll data has been migrated to plan: "${defaultPlan.name}"`);

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
