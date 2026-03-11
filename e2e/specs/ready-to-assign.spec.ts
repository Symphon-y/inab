import { test, expect } from '@playwright/test';

test.describe('Ready to Assign Calculation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budget');
  });

  test('should calculate Ready to Assign correctly', async ({ page }) => {
    // Get the initial Ready to Assign value
    const readyToAssignText = await page.locator('text=Ready to Assign').locator('..').locator('p').nth(1).textContent();
    console.log('Initial Ready to Assign:', readyToAssignText);

    // Get Total Income
    const totalIncomeText = await page.locator('text=Total Income:').textContent();
    console.log('Total Income:', totalIncomeText);

    // Get Total Assigned
    const totalAssignedText = await page.locator('text=Total Assigned:').textContent();
    console.log('Total Assigned:', totalAssignedText);

    // Parse the currency values
    const parseAmount = (text: string | null): number => {
      if (!text) return 0;
      const match = text.match(/\$([\d,]+\.\d{2})/);
      if (!match) return 0;
      return parseFloat(match[1].replace(/,/g, ''));
    };

    const readyToAssign = parseAmount(readyToAssignText);
    const totalIncome = parseAmount(totalIncomeText);
    const totalAssigned = parseAmount(totalAssignedText);

    console.log('Parsed Ready to Assign:', readyToAssign);
    console.log('Parsed Total Income:', totalIncome);
    console.log('Parsed Total Assigned:', totalAssigned);

    // Verify the formula: Ready to Assign = Total Income - Total Assigned
    const expectedReadyToAssign = totalIncome - totalAssigned;

    expect(readyToAssign).toBe(expectedReadyToAssign);
  });

  test('should update Ready to Assign after assigning money', async ({ page }) => {
    // Get initial values
    const getReadyToAssign = async () => {
      const text = await page.locator('text=Ready to Assign').locator('..').locator('p').nth(1).textContent();
      const match = text?.match(/\$([\d,]+\.\d{2})/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    };

    const getTotalAssigned = async () => {
      const text = await page.locator('text=Total Assigned:').textContent();
      const match = text?.match(/\$([\d,]+\.\d{2})/);
      return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
    };

    const initialReadyToAssign = await getReadyToAssign();
    const initialTotalAssigned = await getTotalAssigned();

    console.log('Initial Ready to Assign:', initialReadyToAssign);
    console.log('Initial Total Assigned:', initialTotalAssigned);

    // Find the first category and click on its assigned amount
    const firstCategoryRow = page.locator('[class*="grid"][class*="grid-cols-4"]').filter({ hasText: /Groceries|Utilities|Rent/ }).first();
    await firstCategoryRow.waitFor({ state: 'visible', timeout: 5000 });

    // Click on the assigned amount to open assign dialog
    const assignedButton = firstCategoryRow.locator('button').first();
    await assignedButton.click();

    // Wait for the assign money dialog
    await page.waitForSelector('text=Assign Money', { timeout: 5000 });

    // Enter an amount (e.g., $100.00)
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('100');

    // Click assign button
    await page.locator('button:has-text("Assign")').click();

    // Wait for the dialog to close and data to refresh
    await page.waitForTimeout(1000);

    // Get updated values
    const updatedReadyToAssign = await getReadyToAssign();
    const updatedTotalAssigned = await getTotalAssigned();

    console.log('Updated Ready to Assign:', updatedReadyToAssign);
    console.log('Updated Total Assigned:', updatedTotalAssigned);

    // Verify Ready to Assign decreased by $100
    expect(updatedReadyToAssign).toBe(initialReadyToAssign - 100);

    // Verify Total Assigned increased by $100
    expect(updatedTotalAssigned).toBe(initialTotalAssigned + 100);
  });

  test('should show correct breakdown in detail panel', async ({ page }) => {
    // Click on a category to open detail panel
    const groceriesRow = page.locator('text=Groceries').locator('..');
    await groceriesRow.click();

    // Wait for detail panel to appear
    await page.waitForSelector('text=Available Balance', { timeout: 5000 });

    // Get the values from the detail panel
    const assignedThisMonth = await page.locator('text=Assigned This Month').locator('..').locator('div').last().textContent();
    console.log('Assigned This Month (Detail Panel):', assignedThisMonth);

    // Get the assigned value from the grid
    const assignedInGrid = await groceriesRow.locator('button').first().textContent();
    console.log('Assigned (Grid):', assignedInGrid);

    // They should match
    expect(assignedThisMonth).toContain(assignedInGrid);
  });

  test('should fetch budget summary from API', async ({ page, request }) => {
    // Get current month/year from the page
    const monthYearText = await page.locator('text=/\\w+ \\d{4}/').textContent();
    console.log('Current Month/Year:', monthYearText);

    // Parse month and year
    const [monthName, yearStr] = monthYearText?.split(' ') || [];
    const year = parseInt(yearStr);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames.indexOf(monthName) + 1;

    console.log('Fetching budget summary for:', year, month);

    // Fetch from API directly
    const response = await request.get(`http://localhost:3000/api/budget/summary?year=${year}&month=${month}`);
    expect(response.ok()).toBeTruthy();

    const summary = await response.json();
    console.log('API Response:', summary);

    // Verify the calculation
    const expectedReadyToAssign = summary.totalIncome - summary.totalAssigned;
    expect(summary.readyToAssign).toBe(expectedReadyToAssign);

    // Get the UI value
    const uiReadyToAssign = await page.locator('text=Ready to Assign').locator('..').locator('p').nth(1).textContent();
    const uiValue = parseFloat(uiReadyToAssign?.match(/\$([\d,]+\.\d{2})/)?.[1]?.replace(/,/g, '') || '0');

    // Compare UI with API
    expect(uiValue).toBe(summary.readyToAssign / 100);
  });
});
