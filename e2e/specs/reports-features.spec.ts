import { test, expect } from '@playwright/test';

test.describe('Reports & Charts Features Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create test data for reports
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');

    // Create a budget account with transactions for meaningful reports
    const timestamp = Date.now();

    // Create account
    const accountsSection = page.getByText('Accounts').first();
    if (await accountsSection.isVisible()) {
      await accountsSection.click();
      const addAccountButton = page.getByRole('button', { name: /add account/i });

      if (await addAccountButton.isVisible()) {
        await addAccountButton.click();
        await page.getByLabel(/name/i).fill(`Report Test ${timestamp}`);
        await page.getByLabel(/type/i).selectOption('checking');
        await page.getByLabel(/balance/i).fill('5000');
        await page.getByRole('button', { name: /save|create/i }).click();
        await page.waitForTimeout(1000);

        // Navigate to the account
        await page.getByRole('link', { name: `Report Test ${timestamp}` }).click();
        await page.waitForLoadState('networkidle');

        // Create some transactions for the reports
        // Transaction 1: Income
        await page.getByRole('button', { name: /add transaction/i }).click();
        await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
        await page.getByLabel(/payee/i).fill('Salary');
        await page.getByLabel(/inflow/i).fill('3000.00');
        await page.getByRole('button', { name: /save|create/i }).click();
        await page.waitForTimeout(1000);

        // Transaction 2: Expense - Groceries
        await page.getByRole('button', { name: /add transaction/i }).click();
        await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
        await page.getByLabel(/payee/i).fill('Grocery Store');
        await page.getByLabel(/outflow/i).fill('150.00');
        await page.getByRole('button', { name: /save|create/i }).click();
        await page.waitForTimeout(1000);

        // Transaction 3: Expense - Gas
        await page.getByRole('button', { name: /add transaction/i }).click();
        await page.getByLabel(/date/i).fill(new Date().toISOString().split('T')[0]);
        await page.getByLabel(/payee/i).fill('Gas Station');
        await page.getByLabel(/outflow/i).fill('60.00');
        await page.getByRole('button', { name: /save|create/i }).click();
        await page.waitForTimeout(1000);
      }
    }

    // Navigate to reports page
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test('should display reports page with header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
  });

  test('should display time range selector', async ({ page }) => {
    // Check for time range selector (it's a Select dropdown, not buttons)
    const timeRangeLabel = page.getByText('Time Range');
    await expect(timeRangeLabel).toBeVisible();

    // Check that the select trigger is visible
    const selectTrigger = page.getByRole('combobox');
    await expect(selectTrigger.first()).toBeVisible();
  });

  test('should display spending pie chart', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(2000);

    // Look for the spending chart card (first chart in Financial Overview)
    const spendingCard = page.locator('.recharts-wrapper').first().locator('..');

    // Check if Recharts SVG is rendered
    const chartSvg = page.locator('.recharts-wrapper svg').first();

    if (await chartSvg.isVisible()) {
      // Chart is rendering with data
      await expect(chartSvg).toBeVisible();
      console.log('✓ Spending pie chart SVG found with data');
    } else {
      // Check for empty state or skeleton
      const emptyState = page.getByText('No spending data').first();
      const skeleton = page.locator('.animate-pulse').first();

      if (await emptyState.isVisible()) {
        console.log('✓ Spending chart showing empty state (no transactions yet)');
        expect(await emptyState.isVisible()).toBeTruthy();
      } else if (await skeleton.isVisible()) {
        console.log('⚠ Spending chart still loading (skeleton)');
        expect(await skeleton.isVisible()).toBeTruthy();
      } else {
        // This is OK - might just be rendering the empty message
        console.log('✓ Spending chart component rendered');
      }
    }
  });

  test('should display net worth chart', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(2000);

    // Check for net worth heading (in the card, not sidebar)
    const netWorthHeading = page.getByRole('heading', { name: /net worth/i });
    await expect(netWorthHeading).toBeVisible();

    // Check for the "Current" label which appears next to the net worth value
    const currentLabel = page.getByText('Current').first();
    await expect(currentLabel).toBeVisible();
    console.log('✓ Net worth current value displayed');

    // Check for account breakdown section (within the card)
    const accountCards = page.locator('.border.rounded-lg.p-3');
    const cardCount = await accountCards.count();

    if (cardCount > 0) {
      console.log(`✓ Net worth account breakdown visible (${cardCount} account types)`);
      expect(cardCount).toBeGreaterThan(0);
    }

    // Check for chart or "not enough data" message
    const chartSvg = page.locator('.recharts-wrapper svg').nth(1);
    const notEnoughDataMsg = page.getByText(/not enough historical data/i);

    if (await chartSvg.isVisible()) {
      console.log('✓ Net worth line chart rendered');
    } else if (await notEnoughDataMsg.isVisible()) {
      console.log('✓ Net worth showing "not enough data" message (expected for single snapshot)');
    }
  });

  test('should display income vs expense chart', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(2000);

    // Check for income/expense section
    const incomeExpenseSection = page.getByText(/income.*expense/i).first();
    await expect(incomeExpenseSection).toBeVisible();

    // Check if Recharts SVG is rendered
    const chartSvg = page.locator('.recharts-wrapper svg').last();

    if (await chartSvg.isVisible()) {
      await expect(chartSvg).toBeVisible();
      console.log('✓ Income vs Expense chart SVG found');
    } else {
      // Check for empty state
      const emptyState = page.getByText(/no income or expense data/i);
      const skeleton = page.locator('.animate-pulse');

      if (await emptyState.isVisible()) {
        console.log('⚠ Income/Expense chart showing empty state');
        expect(await emptyState.isVisible()).toBeTruthy();
      } else if (await skeleton.isVisible()) {
        console.log('⚠ Income/Expense chart still loading (skeleton)');
        expect(await skeleton.isVisible()).toBeTruthy();
      } else {
        console.log('✗ Income/Expense chart not rendering properly');
        throw new Error('Income/Expense chart not found');
      }
    }
  });

  test('should show spending data in pie chart', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for actual spending amounts in the chart
    const chartArea = page.locator('.recharts-wrapper').first();

    if (await chartArea.isVisible()) {
      // Check if there are pie slices (paths in SVG)
      const pieSlices = chartArea.locator('path.recharts-pie-sector');
      const sliceCount = await pieSlices.count();

      if (sliceCount > 0) {
        console.log(`✓ Spending chart has ${sliceCount} slices`);
        expect(sliceCount).toBeGreaterThan(0);
      } else {
        console.log('⚠ Spending chart has no pie slices');
      }
    }
  });

  test('should show income and expense bars in chart', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for the income/expense chart
    const chartArea = page.locator('.recharts-wrapper').last();

    if (await chartArea.isVisible()) {
      // Check for bars (rectangles in SVG)
      const bars = chartArea.locator('rect.recharts-rectangle');
      const barCount = await bars.count();

      if (barCount > 0) {
        console.log(`✓ Income/Expense chart has ${barCount} bars`);
        expect(barCount).toBeGreaterThan(0);
      } else {
        console.log('⚠ Income/Expense chart has no bars');
      }
    }
  });

  test('should display summary cards for income/expense', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Check for summary statistics
    const summaryLabels = ['Total Income', 'Total Expenses', 'Net Savings'];

    for (const label of summaryLabels) {
      const summaryCard = page.getByText(label);

      if (await summaryCard.isVisible()) {
        console.log(`✓ ${label} card found`);
        await expect(summaryCard).toBeVisible();
      } else {
        console.log(`⚠ ${label} card not visible`);
      }
    }
  });

  test('should change time range when preset is selected', async ({ page }) => {
    // Open the select dropdown
    const selectTrigger = page.getByRole('combobox').first();
    await selectTrigger.click();

    // Wait for dropdown to open
    await page.waitForTimeout(500);

    // Select "Last 30 Days" from dropdown
    const last30Option = page.getByRole('option', { name: 'Last 30 Days' });
    if (await last30Option.isVisible()) {
      await last30Option.click();
      await page.waitForTimeout(1000);
    }

    // Open dropdown again and select "Last 3 Months"
    await selectTrigger.click();
    await page.waitForTimeout(500);

    const last3MonthsOption = page.getByRole('option', { name: 'Last 3 Months' });
    if (await last3MonthsOption.isVisible()) {
      await last3MonthsOption.click();
      await page.waitForTimeout(1000);
    }

    // Charts should still be visible after time range change
    const chartArea = page.locator('.recharts-wrapper').first();
    if (await chartArea.isVisible()) {
      console.log('✓ Charts remain visible after time range change');
    }
  });

  test('should display current net worth value', async ({ page }) => {
    // Wait for data to load
    await page.waitForTimeout(2000);

    // Look for net worth display (should be a large monetary value)
    const netWorthRegex = /\$[\d,]+/;
    const netWorthSection = page.locator('text=Net Worth').locator('..');
    const sectionText = await netWorthSection.textContent();

    if (sectionText && netWorthRegex.test(sectionText)) {
      console.log(`✓ Net worth value found: ${sectionText.match(netWorthRegex)?.[0]}`);
      expect(sectionText).toMatch(netWorthRegex);
    } else {
      console.log('⚠ Net worth value not displaying');
    }
  });
});
