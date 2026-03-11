import { test, expect } from '@playwright/test';

test.describe('Transaction Features Audit', () => {
  let accountName: string;

  test.beforeEach(async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Create a test account if none exists
    const timestamp = Date.now();
    accountName = `Test Account ${timestamp}`;

    // Check if accounts section exists in sidebar
    const accountsSection = page.getByText('Accounts').first();
    if (await accountsSection.isVisible()) {
      // Create new account
      await accountsSection.click();
      const addAccountButton = page.getByRole('button', { name: /add account/i });

      if (await addAccountButton.isVisible()) {
        await addAccountButton.click();

        // Fill account form
        await page.getByLabel(/Account Name/i).fill(accountName);
        await page.getByRole('combobox', { name: /type/i }).selectOption('checking');
        await page.getByLabel(/Initial Balance/i).fill('1000');

        // Save
        await page.getByRole('button', { name: 'Add Account' }).click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should navigate to account transactions page', async ({ page }) => {
    // Find and click on the account in sidebar
    const accountLink = page.getByRole('link', { name: accountName });

    if (await accountLink.isVisible()) {
      await accountLink.click();

      // Should navigate to account page
      await expect(page).toHaveURL(/\/accounts\/[a-z0-9-]+/);

      // Should show account name as heading
      await expect(page.getByRole('heading', { name: accountName })).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display transactions list', async ({ page }) => {
    // Navigate to account
    const accountLink = page.getByRole('link', { name: accountName });

    if (await accountLink.isVisible()) {
      await accountLink.click();

      // Should show transactions section or empty state
      const transactionsCard = page.getByText(/transactions/i);
      await expect(transactionsCard).toBeVisible();

      // Should show "Add Transaction" button
      await expect(page.getByRole('button', { name: /add transaction/i })).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should create a new transaction', async ({ page }) => {
    // Navigate to account
    const accountLink = page.getByRole('link', { name: accountName });

    if (await accountLink.isVisible()) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      // Click Add Transaction
      await page.getByRole('button', { name: /add transaction/i }).click();

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();

      // Fill transaction form
      const timestamp = Date.now();
      await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
      await page.getByLabel(/payee/i).fill(`Test Payee ${timestamp}`);
      await page.getByLabel(/amount/i).fill('50.00');

      // Submit
      await page.getByRole('button', { name: 'Add Transaction' }).click();

      // Should show success toast
      await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 5000 });

      // Transaction should appear in list
      await expect(page.getByText(`Test Payee ${timestamp}`)).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display running balance in transactions', async ({ page }) => {
    // Navigate to account
    const accountLink = page.getByRole('link', { name: accountName });

    if (await accountLink.isVisible()) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      // Create a transaction
      await page.getByRole('button', { name: /add transaction/i }).click();
      await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
      await page.getByLabel(/payee/i).fill('Balance Test');
      await page.getByLabel(/amount/i).fill('25.00');
      await page.getByRole('button', { name: 'Add Transaction' }).click();
      await page.waitForTimeout(1000);

      // Check for balance column
      await expect(page.getByText('Balance')).toBeVisible();

      // Should show a balance value
      const balanceRegex = /\$[\d,]+/;
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(balanceRegex);
    } else {
      test.skip();
    }
  });

  test('should edit an existing transaction', async ({ page }) => {
    // Navigate to account
    const accountLink = page.getByRole('link', { name: accountName });

    if (await accountLink.isVisible()) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      // Create a transaction first
      const timestamp = Date.now();
      await page.getByRole('button', { name: /add transaction/i }).click();
      await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
      await page.getByLabel(/payee/i).fill(`Original ${timestamp}`);
      await page.getByLabel(/amount/i).fill('30.00');
      await page.getByRole('button', { name: 'Add Transaction' }).click();
      await page.waitForTimeout(1000);

      // Click on the transaction to edit
      const transactionRow = page.getByText(`Original ${timestamp}`).locator('..');
      await transactionRow.click();

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();

      // Edit payee name
      await page.getByLabel(/payee/i).fill(`Edited ${timestamp}`);

      // Save
      await page.getByRole('button', { name: 'Save Changes' }).click();

      // Should show success toast
      await expect(page.getByText(/success|updated/i)).toBeVisible({ timeout: 5000 });

      // Transaction should show new name
      await expect(page.getByText(`Edited ${timestamp}`)).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should delete a transaction', async ({ page }) => {
    // Navigate to account
    const accountLink = page.getByRole('link', { name: accountName });

    if (await accountLink.isVisible()) {
      await accountLink.click();
      await page.waitForLoadState('networkidle');

      // Create a transaction first
      const timestamp = Date.now();
      await page.getByRole('button', { name: /add transaction/i }).click();
      await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
      await page.getByLabel(/payee/i).fill(`To Delete ${timestamp}`);
      await page.getByLabel(/amount/i).fill('15.00');
      await page.getByRole('button', { name: 'Add Transaction' }).click();
      await page.waitForTimeout(1000);

      // Click on the transaction
      const transactionRow = page.getByText(`To Delete ${timestamp}`).locator('..');
      await transactionRow.click();

      // Dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();

      // Click delete button
      await page.getByRole('button', { name: /delete/i }).click();

      // Should show success toast
      await expect(page.getByText(/success|deleted/i)).toBeVisible({ timeout: 5000 });

      // Transaction should no longer be visible
      await expect(page.getByText(`To Delete ${timestamp}`)).not.toBeVisible();
    } else {
      test.skip();
    }
  });
});
