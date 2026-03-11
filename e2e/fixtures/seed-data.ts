import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { plans, accounts, categoryGroups, categories, transactions, budgetAllocations } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { config } from 'dotenv';

// Ensure environment variables are loaded
config();

// Create database connection specifically for tests
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema: { plans, accounts, categoryGroups, categories, transactions, budgetAllocations } });

/**
 * Seed test data for E2E tests
 * This creates realistic data for:
 * - 3 accounts (checking, savings, credit card)
 * - 6 category groups with 2-3 categories each
 * - 30 transactions across 3 months
 */
export async function seedTestData() {
  console.log('🌱 Seeding test data...');

  // Clean existing data
  await db.delete(budgetAllocations);
  await db.delete(transactions);
  await db.delete(categories);
  await db.delete(categoryGroups);
  await db.delete(accounts);
  await db.delete(plans);

  console.log('✅ Cleaned existing test data');

  // Create a default plan for test data
  const [testPlan] = await db
    .insert(plans)
    .values({
      name: 'Test Plan',
      icon: '🧪',
      isDefault: true,
    })
    .returning();

  // Create 3 accounts
  const [checkingAccount, savingsAccount, creditCard] = await db
    .insert(accounts)
    .values([
      {
        planId: testPlan.id,
        name: 'Chase Checking',
        accountType: 'checking',
        balance: 450000, // $4,500.00
        isOnBudget: true,
      },
      {
        planId: testPlan.id,
        name: 'Ally Savings',
        accountType: 'savings',
        balance: 1200000, // $12,000.00
        isOnBudget: true,
      },
      {
        planId: testPlan.id,
        name: 'Chase Credit Card',
        accountType: 'credit_card',
        balance: -85000, // -$850.00 (credit card balance)
        isOnBudget: true,
      },
    ])
    .returning();

  console.log('✅ Created 3 accounts');

  // Create category groups and categories
  const [essentialsGroup] = await db
    .insert(categoryGroups)
    .values({ planId: testPlan.id, name: 'Monthly Essentials', sortOrder: 1 })
    .returning();

  const [groceriesCat, utilitiesCat, rentCat] = await db
    .insert(categories)
    .values([
      { name: 'Groceries', categoryGroupId: essentialsGroup.id, sortOrder: 1, icon: '🛒' },
      { name: 'Utilities', categoryGroupId: essentialsGroup.id, sortOrder: 2, icon: '⚡' },
      { name: 'Rent/Mortgage', categoryGroupId: essentialsGroup.id, sortOrder: 3, icon: '🏠' },
    ])
    .returning();

  const [lifestyleGroup] = await db
    .insert(categoryGroups)
    .values({ planId: testPlan.id, name: 'Lifestyle', sortOrder: 2 })
    .returning();

  const [diningCat, entertainmentCat, shoppingCat] = await db
    .insert(categories)
    .values([
      { name: 'Dining Out', categoryGroupId: lifestyleGroup.id, sortOrder: 1, icon: '🍽️' },
      { name: 'Entertainment', categoryGroupId: lifestyleGroup.id, sortOrder: 2, icon: '🎫' },
      { name: 'Shopping', categoryGroupId: lifestyleGroup.id, sortOrder: 3, icon: '🛍️' },
    ])
    .returning();

  const [transportationGroup] = await db
    .insert(categoryGroups)
    .values({ planId: testPlan.id, name: 'Transportation', sortOrder: 3 })
    .returning();

  const [gasCat, carMaintenanceCat] = await db
    .insert(categories)
    .values([
      { name: 'Gas & Fuel', categoryGroupId: transportationGroup.id, sortOrder: 1, icon: '⛽' },
      { name: 'Car Maintenance', categoryGroupId: transportationGroup.id, sortOrder: 2, icon: '🔧' },
    ])
    .returning();

  const [healthGroup] = await db
    .insert(categoryGroups)
    .values({ planId: testPlan.id, name: 'Health & Wellness', sortOrder: 4 })
    .returning();

  const [gymCat, healthcareCat] = await db
    .insert(categories)
    .values([
      { name: 'Gym Membership', categoryGroupId: healthGroup.id, sortOrder: 1, icon: '💪' },
      { name: 'Healthcare', categoryGroupId: healthGroup.id, sortOrder: 2, icon: '🩺' },
    ])
    .returning();

  const [savingsGoalsGroup] = await db
    .insert(categoryGroups)
    .values({ planId: testPlan.id, name: 'Savings Goals', sortOrder: 5 })
    .returning();

  const [emergencyCat, vacationCat] = await db
    .insert(categories)
    .values([
      { name: 'Emergency Fund', categoryGroupId: savingsGoalsGroup.id, sortOrder: 1, icon: '🚨' },
      { name: 'Vacation', categoryGroupId: savingsGoalsGroup.id, sortOrder: 2, icon: '🏖️' },
    ])
    .returning();

  const [subscriptionsGroup] = await db
    .insert(categoryGroups)
    .values({ planId: testPlan.id, name: 'Subscriptions', sortOrder: 6 })
    .returning();

  const [streamingCat, softwareCat] = await db
    .insert(categories)
    .values([
      { name: 'Streaming Services', categoryGroupId: subscriptionsGroup.id, sortOrder: 1, icon: '📺' },
      { name: 'Software & Apps', categoryGroupId: subscriptionsGroup.id, sortOrder: 2, icon: '💻' },
    ])
    .returning();

  console.log('✅ Created 6 category groups with 15 categories');

  // Create transactions across 3 months
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Helper to create date in specific month
  const getDate = (monthOffset: number, day: number) => {
    const date = new Date(currentYear, currentMonth + monthOffset, day);
    return date;
  };

  const testTransactions = [
    // Income transactions
    { accountId: checkingAccount.id, date: getDate(0, 1), payee: 'Salary - Acme Corp', amount: 500000, status: 'cleared' as const, categoryId: null },
    { accountId: checkingAccount.id, date: getDate(-1, 1), payee: 'Salary - Acme Corp', amount: 500000, status: 'cleared' as const, categoryId: null },
    { accountId: checkingAccount.id, date: getDate(-2, 1), payee: 'Salary - Acme Corp', amount: 500000, status: 'cleared' as const, categoryId: null },

    // Current month expenses
    { accountId: checkingAccount.id, date: getDate(0, 5), payee: 'Landlord Property Management', amount: -180000, status: 'cleared' as const, categoryId: rentCat.id },
    { accountId: checkingAccount.id, date: getDate(0, 8), payee: 'Whole Foods Market', amount: -12500, status: 'cleared' as const, categoryId: groceriesCat.id },
    { accountId: checkingAccount.id, date: getDate(0, 10), payee: 'Shell Gas Station', amount: -6500, status: 'cleared' as const, categoryId: gasCat.id },
    { accountId: creditCard.id, date: getDate(0, 12), payee: 'Netflix', amount: -1599, status: 'cleared' as const, categoryId: streamingCat.id },
    { accountId: creditCard.id, date: getDate(0, 14), payee: 'Spotify', amount: -1099, status: 'cleared' as const, categoryId: streamingCat.id },
    { accountId: checkingAccount.id, date: getDate(0, 15), payee: 'Pacific Gas & Electric', amount: -12000, status: 'cleared' as const, categoryId: utilitiesCat.id },
    { accountId: creditCard.id, date: getDate(0, 18), payee: 'Chipotle', amount: -1850, status: 'cleared' as const, categoryId: diningCat.id },
    { accountId: creditCard.id, date: getDate(0, 20), payee: 'AMC Theatres', amount: -3500, status: 'cleared' as const, categoryId: entertainmentCat.id },
    { accountId: checkingAccount.id, date: getDate(0, 22), payee: 'Target', amount: -8900, status: 'cleared' as const, categoryId: shoppingCat.id },
    { accountId: checkingAccount.id, date: getDate(0, 25), payee: 'Planet Fitness', amount: -2499, status: 'cleared' as const, categoryId: gymCat.id },

    // Previous month expenses
    { accountId: checkingAccount.id, date: getDate(-1, 5), payee: 'Landlord Property Management', amount: -180000, status: 'cleared' as const, categoryId: rentCat.id },
    { accountId: checkingAccount.id, date: getDate(-1, 7), payee: 'Whole Foods Market', amount: -14200, status: 'cleared' as const, categoryId: groceriesCat.id },
    { accountId: checkingAccount.id, date: getDate(-1, 10), payee: 'Safeway', amount: -9800, status: 'cleared' as const, categoryId: groceriesCat.id },
    { accountId: checkingAccount.id, date: getDate(-1, 12), payee: 'Shell Gas Station', amount: -7200, status: 'cleared' as const, categoryId: gasCat.id },
    { accountId: checkingAccount.id, date: getDate(-1, 15), payee: 'Pacific Gas & Electric', amount: -11500, status: 'cleared' as const, categoryId: utilitiesCat.id },
    { accountId: creditCard.id, date: getDate(-1, 18), payee: 'Olive Garden', amount: -4500, status: 'cleared' as const, categoryId: diningCat.id },
    { accountId: creditCard.id, date: getDate(-1, 20), payee: 'Amazon', amount: -12500, status: 'cleared' as const, categoryId: shoppingCat.id },
    { accountId: checkingAccount.id, date: getDate(-1, 22), payee: 'AutoZone', amount: -8500, status: 'cleared' as const, categoryId: carMaintenanceCat.id },
    { accountId: checkingAccount.id, date: getDate(-1, 25), payee: 'Dr. Smith Healthcare', amount: -15000, status: 'cleared' as const, categoryId: healthcareCat.id },

    // Two months ago expenses
    { accountId: checkingAccount.id, date: getDate(-2, 5), payee: 'Landlord Property Management', amount: -180000, status: 'cleared' as const, categoryId: rentCat.id },
    { accountId: checkingAccount.id, date: getDate(-2, 8), payee: 'Costco', amount: -18500, status: 'cleared' as const, categoryId: groceriesCat.id },
    { accountId: checkingAccount.id, date: getDate(-2, 12), payee: 'Shell Gas Station', amount: -6800, status: 'cleared' as const, categoryId: gasCat.id },
    { accountId: checkingAccount.id, date: getDate(-2, 15), payee: 'Pacific Gas & Electric', amount: -10800, status: 'cleared' as const, categoryId: utilitiesCat.id },
    { accountId: creditCard.id, date: getDate(-2, 18), payee: 'Starbucks', amount: -4200, status: 'cleared' as const, categoryId: diningCat.id },
    { accountId: creditCard.id, date: getDate(-2, 20), payee: 'Best Buy', amount: -28500, status: 'cleared' as const, categoryId: shoppingCat.id },
    { accountId: checkingAccount.id, date: getDate(-2, 25), payee: 'Planet Fitness', amount: -2499, status: 'cleared' as const, categoryId: gymCat.id },

    // Savings transactions
    { accountId: checkingAccount.id, date: getDate(0, 28), payee: 'Transfer to Emergency Fund', amount: -50000, status: 'cleared' as const, categoryId: emergencyCat.id },
    { accountId: savingsAccount.id, date: getDate(0, 28), payee: 'Transfer from Checking', amount: 50000, status: 'cleared' as const, categoryId: null },
  ];

  await db.insert(transactions).values(testTransactions);

  console.log('✅ Created 31 transactions across 3 months');

  // Create budget allocations for current month
  const currentMonthDate = new Date(currentYear, currentMonth, 1);

  const testAllocations = [
    // Monthly Essentials - partially funded
    { categoryId: groceriesCat.id, month: currentMonthDate, assigned: 15000, activity: -12500, available: 2500, carryover: 0 }, // $150 assigned, $125 spent
    { categoryId: utilitiesCat.id, month: currentMonthDate, assigned: 15000, activity: -12000, available: 3000, carryover: 0 }, // $150 assigned, $120 spent
    { categoryId: rentCat.id, month: currentMonthDate, assigned: 180000, activity: -180000, available: 0, carryover: 0 }, // $1,800 assigned, fully spent

    // Lifestyle - some funded
    { categoryId: diningCat.id, month: currentMonthDate, assigned: 10000, activity: -1850, available: 8150, carryover: 0 }, // $100 assigned, $18.50 spent
    { categoryId: entertainmentCat.id, month: currentMonthDate, assigned: 5000, activity: -3500, available: 1500, carryover: 0 }, // $50 assigned, $35 spent

    // Transportation
    { categoryId: gasCat.id, month: currentMonthDate, assigned: 10000, activity: -6500, available: 3500, carryover: 0 }, // $100 assigned, $65 spent

    // Health
    { categoryId: gymCat.id, month: currentMonthDate, assigned: 2500, activity: -2499, available: 1, carryover: 0 }, // $25 assigned, $24.99 spent

    // Subscriptions
    { categoryId: streamingCat.id, month: currentMonthDate, assigned: 3000, activity: -2698, available: 302, carryover: 0 }, // $30 assigned, $26.98 spent (Netflix + Spotify)
  ];

  await db.insert(budgetAllocations).values(testAllocations);

  console.log('✅ Created budget allocations for current month');
  console.log('🎉 Test data seeding complete!');
}

/**
 * Clean all test data
 */
export async function cleanTestData() {
  console.log('🧹 Cleaning test data...');
  await db.delete(budgetAllocations);
  await db.delete(transactions);
  await db.delete(categories);
  await db.delete(categoryGroups);
  await db.delete(accounts);
  await db.delete(plans);
  console.log('✅ Test data cleaned');
}
