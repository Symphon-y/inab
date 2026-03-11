import { test, expect } from '@playwright/test';

test.describe('Budget Features Audit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budget');
    await page.waitForLoadState('networkidle');
  });

  test('should display Ready to Assign card', async ({ page }) => {
    const readyToAssign = page.getByText('Ready to Assign');
    await expect(readyToAssign).toBeVisible();

    // Should show a monetary value
    const amountRegex = /\$[\d,]+/;
    const cardContent = await page.locator('text=Ready to Assign').locator('..').textContent();
    expect(cardContent).toMatch(amountRegex);
  });

  test('should create a new category group', async ({ page }) => {
    const addGroupButton = page.getByRole('button', { name: 'Add Category Group' });
    await addGroupButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in form
    const timestamp = Date.now();
    await page.getByLabel(/Group Name/i).fill(`Test Group ${timestamp}`);

    // Submit - button says "Add Group" when creating
    await page.getByRole('button', { name: 'Add Group' }).click();

    // Should show success toast
    await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 5000 });

    // Group should appear in the list
    await expect(page.getByText(`Test Group ${timestamp}`)).toBeVisible();
  });

  test('should create a new category within a group', async ({ page }) => {
    // First create a group
    const addGroupButton = page.getByRole('button', { name: 'Add Category Group' });
    await addGroupButton.click();

    const timestamp = Date.now();
    await page.getByLabel(/Group Name/i).fill(`Group ${timestamp}`);
    await page.getByRole('button', { name: 'Add Group' }).click();
    await page.waitForTimeout(1000);

    // Now add a category to the group
    const addCategoryButton = page.getByRole('button', { name: /add category/i }).first();
    await addCategoryButton.click();

    // Dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Fill in form
    await page.getByLabel(/Category Name/i).fill(`Test Category ${timestamp}`);

    // Submit - button says "Add Category" when creating
    await page.getByRole('button', { name: 'Add Category' }).click();

    // Should show success toast
    await expect(page.getByText(/success|created/i)).toBeVisible({ timeout: 5000 });

    // Category should appear in the list
    await expect(page.getByText(`Test Category ${timestamp}`)).toBeVisible();
  });

  test('should assign money to a category', async ({ page }) => {
    // Create a group and category first
    const timestamp = Date.now();

    // Create group
    await page.getByRole('button', { name: 'Add Category Group' }).click();
    await page.getByLabel(/Group Name/i).fill(`Group ${timestamp}`);
    await page.getByRole('button', { name: 'Add Group' }).click();
    await page.waitForTimeout(1000);

    // Create category
    await page.getByRole('button', { name: /add category/i }).first().click();
    await page.getByLabel(/Category Name/i).fill(`Category ${timestamp}`);
    await page.getByRole('button', { name: 'Add Category' }).click();
    await page.waitForTimeout(1000);

    // Find the category row and click the "Assigned" button
    const categoryRow = page.getByText(`Category ${timestamp}`).locator('../..');

    // Click the assigned amount button (second column)
    const assignedButton = categoryRow.locator('button').filter({ hasText: /\$/ }).first();
    await assignedButton.click();

    // Assign money dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();

    // Enter amount
    await page.getByLabel(/amount/i).fill('100');

    // Submit (button text is "Assign")
    await page.getByRole('button', { name: 'Assign' }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

    // Wait for data to update
    await page.waitForTimeout(1000);

    // Category should now show $100.00 assigned (verify functionality worked)
    const updatedAssignedButton = page.getByText(`Category ${timestamp}`).locator('../..').locator('button').filter({ hasText: /\$100/ });
    await expect(updatedAssignedButton).toBeVisible();
  });

  test('should display budget grid with columns', async ({ page }) => {
    // Create a test category to verify columns
    const timestamp = Date.now();

    // Create group
    await page.getByRole('button', { name: 'Add Category Group' }).click();
    await page.getByLabel(/Group Name/i).fill(`Grid Test ${timestamp}`);
    await page.getByRole('button', { name: 'Add Group' }).click();
    await page.waitForTimeout(1000);

    // Create category
    await page.getByRole('button', { name: /add category/i }).first().click();
    await page.getByLabel(/Category Name/i).fill(`Category ${timestamp}`);
    await page.getByRole('button', { name: 'Add Category' }).click();
    await page.waitForTimeout(1000);

    // Verify budget grid columns exist - use exact match
    await expect(page.getByText('Category', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Assigned', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Activity', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Available', { exact: true }).first()).toBeVisible();
  });

  test('should collapse and expand category groups', async ({ page }) => {
    // Create a group with a category
    const timestamp = Date.now();

    await page.getByRole('button', { name: 'Add Category Group' }).click();
    await page.getByLabel(/Group Name/i).fill(`Collapsible ${timestamp}`);
    await page.getByRole('button', { name: 'Add Group' }).click();
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /add category/i }).first().click();
    await page.getByLabel(/Category Name/i).fill(`Child ${timestamp}`);
    await page.getByRole('button', { name: 'Add Category' }).click();
    await page.waitForTimeout(1000);

    // Category should be visible
    await expect(page.getByText(`Child ${timestamp}`)).toBeVisible();

    // Find the group header that contains the group name, then find the chevron button within it
    const groupName = `Collapsible ${timestamp}`;
    const groupHeader = page.locator('div.bg-muted\\/30').filter({ hasText: groupName });
    const collapseButton = groupHeader.locator('button').first();

    await expect(collapseButton).toBeVisible();

    // Click to collapse
    await collapseButton.click();

    // Wait for collapse animation and state update
    await page.waitForTimeout(500);

    // The category should not be visible within this specific group's container
    const categoryInGroup = groupHeader.locator('..').getByText(`Child ${timestamp}`);
    await expect(categoryInGroup).not.toBeVisible();

    // Click again to expand
    await collapseButton.click();

    // Wait for expand animation
    await page.waitForTimeout(500);

    // Category should be visible again (re-query the entire page)
    await expect(page.getByText(`Child ${timestamp}`)).toBeVisible();
  });
});
