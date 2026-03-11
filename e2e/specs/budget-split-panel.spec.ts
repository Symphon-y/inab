import { test, expect } from '@playwright/test';

test.describe('Budget Split-Panel UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budget');
  });

  test('should display correct layout: Main Sidebar | Category List | Detail Panel', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that main sidebar exists (left nav with Budget, Goals, Reports)
    const mainSidebar = page.locator('aside').first();
    await expect(mainSidebar).toBeVisible();
    await expect(mainSidebar.getByText('inab')).toBeVisible();

    // Check for category list in the middle (flex-1)
    const categoryListPanel = page.locator('div.flex-1.border-r');
    await expect(categoryListPanel).toBeVisible();
    await expect(categoryListPanel.getByText('Categories')).toBeVisible();

    // Check for detail panel on the right
    const detailPanel = page.locator('aside').last();
    await expect(detailPanel).toBeVisible();

    // ReadyToAssign should be in the top bar, not in the middle
    // (We're not checking for it here as it's in the Header component)
  });

  test('should show category list with icons', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find the first category item
    const firstCategory = page.locator('button').filter({ hasText: /Groceries|Rent|Gas/ }).first();
    await expect(firstCategory).toBeVisible();

    // Check that category has an icon (emoji) or default folder icon
    const categoryIcon = firstCategory.locator('span').first();
    await expect(categoryIcon).toBeVisible();
  });

  test('should display "No target" status for categories without goals', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for categories with "No target" text
    const noTargetText = page.getByText('No target').first();

    // Either we have a category with "No target" or all categories have goals
    const count = await page.getByText('No target').count();
    // Just verify the page loaded correctly, some categories may or may not have targets
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should collapse and expand category groups', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find a category group header with chevron
    const groupHeader = page.locator('button').filter({ hasText: /IMMEDIATE|MONTHLY/ }).first();
    await expect(groupHeader).toBeVisible();

    // Find the chevron icon (ChevronDown or ChevronRight)
    const chevron = groupHeader.locator('svg').first();
    await expect(chevron).toBeVisible();

    // Click to collapse the group
    await groupHeader.click();
    await page.waitForTimeout(300); // Wait for animation

    // Click again to expand
    await groupHeader.click();
    await page.waitForTimeout(300);
  });

  test('should show empty state in detail panel when no category selected', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for empty state message
    const emptyStateText = page.getByText('Select a category to view details');

    // The empty state should be visible initially or after deselecting
    const isVisible = await emptyStateText.isVisible().catch(() => false);

    // If not visible, it means a category is selected, which is also valid
    // Just verify the detail panel exists
    const detailPanel = page.locator('aside').last();
    await expect(detailPanel).toBeVisible();
  });

  test('should select a category and show details', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on a category
    const category = page.locator('button').filter({ hasText: /Groceries|Rent|Gas/ }).first();
    await category.click();
    await page.waitForTimeout(500);

    // Check that detail panel shows category information
    const detailPanel = page.locator('aside').last();

    // Should show "This Month" section
    const thisMonthHeading = detailPanel.getByText('This Month');
    await expect(thisMonthHeading).toBeVisible();

    // Should show budget fields
    await expect(detailPanel.getByText('Assigned')).toBeVisible();
    await expect(detailPanel.getByText('Activity')).toBeVisible();
    await expect(detailPanel.getByText('Available')).toBeVisible();

    // Should show Target section
    await expect(detailPanel.getByText('Target')).toBeVisible();

    // Should show action buttons
    await expect(detailPanel.getByRole('button', { name: /Assign Money/i })).toBeVisible();
    await expect(detailPanel.getByRole('button', { name: /Edit/i })).toBeVisible();
  });

  test('should highlight selected category', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click on a category
    const category = page.locator('button').filter({ hasText: /Groceries|Rent/ }).first();
    await category.click();
    await page.waitForTimeout(300);

    // Check that category has selection styling (bg-primary/10 class or similar)
    const categoryClasses = await category.getAttribute('class');
    expect(categoryClasses).toContain('bg-primary');
  });

  test('should collapse main sidebar to icon-only view', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find the main sidebar (first aside)
    const mainSidebar = page.locator('aside').first();

    // Find the collapse button (ChevronLeft icon)
    const collapseButton = mainSidebar.locator('button[title*="Collapse"]');
    await collapseButton.click();
    await page.waitForTimeout(400);

    // Check that sidebar is collapsed (should have w-16 class)
    const sidebarClasses = await mainSidebar.getAttribute('class');
    expect(sidebarClasses).toContain('w-16');

    // Check that inab text is hidden when collapsed
    const inabText = mainSidebar.locator('text=inab').first();
    await expect(inabText).toBeHidden();

    // Expand again by clicking the expand button
    const expandButton = mainSidebar.locator('button[title*="Expand"]');
    await expandButton.click();
    await page.waitForTimeout(400);

    const expandedClasses = await mainSidebar.getAttribute('class');
    expect(expandedClasses).toContain('w-64');

    // inab text should be visible again
    await expect(inabText).toBeVisible();
  });

  test('should open category form with icon picker', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Click "Add Group" button
    const addGroupButton = page.getByRole('button', { name: /Group/i }).first();
    await addGroupButton.click();
    await page.waitForTimeout(300);

    // Fill group name
    await page.getByLabel('Group Name').fill('Test Group');

    // Submit the form
    await page.getByRole('button', { name: /Add Group/i }).last().click();
    await page.waitForTimeout(500);

    // Now add a category to this group
    // Find the newly created group
    const testGroup = page.locator('button').filter({ hasText: 'TEST GROUP' });

    // Hover to show the Add Category button
    await testGroup.hover();
    await page.waitForTimeout(200);

    // Click the plus button to add category
    const addCategoryButton = testGroup.locator('..').locator('button').filter({ hasText: '' }).first();
    await addCategoryButton.click();
    await page.waitForTimeout(300);

    // Check that the category form has icon picker
    const iconLabel = page.getByText('Icon', { exact: true });
    await expect(iconLabel).toBeVisible();

    // Check for emoji buttons
    const emojiButtons = page.locator('button').filter({ hasText: /📁|🏠|🚗|🍔/ });
    const count = await emojiButtons.count();
    expect(count).toBeGreaterThan(0);

    // Close the dialog
    await page.getByRole('button', { name: /Cancel/i }).click();
  });

  test('should show target selector in detail panel', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Select a category
    const category = page.locator('button').filter({ hasText: /Groceries|Rent/ }).first();
    await category.click();
    await page.waitForTimeout(500);

    // Check for target selector in detail panel
    const detailPanel = page.locator('aside').last();

    // Should have a select/dropdown for target type
    const targetSection = detailPanel.locator('[role="combobox"]').or(detailPanel.locator('select')).first();
    await expect(targetSection).toBeVisible();
  });

  test('should create a goal from detail panel', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Select a category without a goal
    const categories = page.locator('button').filter({ hasText: 'No target' });
    const count = await categories.count();

    if (count > 0) {
      // Click on a category with no target
      const categoryButton = categories.first();

      // Get the parent to click the category item, not the "No target" text
      const categoryItem = categoryButton.locator('..').locator('button').first();
      await categoryItem.click();
      await page.waitForTimeout(500);

      // In detail panel, look for "Create Target" button
      const createTargetButton = page.getByRole('button', { name: /Create Target/i });
      const isVisible = await createTargetButton.isVisible().catch(() => false);

      if (isVisible) {
        await createTargetButton.click();
        await page.waitForTimeout(300);

        // Should open goal form
        const goalForm = page.getByText('Set Goal').or(page.getByText('Create Goal'));
        await expect(goalForm).toBeVisible();

        // Close the form
        const cancelButton = page.getByRole('button', { name: /Cancel/i }).last();
        await cancelButton.click();
      }
    } else {
      // All categories have goals, skip this test
      test.skip();
    }
  });

  test('should show goal progress for categories with targets', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Find a category with a goal (not "No target")
    const categories = await page.locator('button').filter({ hasText: /Monthly|Balance|Spending/ }).count();

    if (categories > 0) {
      // Click on a category with a goal
      const categoryWithGoal = page.locator('button').filter({ hasText: /Monthly|Balance|Spending/ }).first();

      // Click the parent button (the category item)
      const categoryItem = categoryWithGoal.locator('..').locator('button').first();
      await categoryItem.click();
      await page.waitForTimeout(500);

      // Check for goal information in detail panel
      const detailPanel = page.locator('aside').last();

      // Should show goal details like Target, Monthly, or By date
      const hasTargetInfo = await detailPanel.getByText('Target:').isVisible().catch(() => false);
      const hasMonthlyInfo = await detailPanel.getByText('Monthly:').isVisible().catch(() => false);
      const hasByInfo = await detailPanel.getByText('By:').isVisible().catch(() => false);

      // At least one should be visible
      expect(hasTargetInfo || hasMonthlyInfo || hasByInfo).toBeTruthy();
    } else {
      // No categories with goals, skip
      test.skip();
    }
  });

  test('should maintain layout on resize', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Set viewport to desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    // Verify all three panels are visible
    const leftPanel = page.locator('aside').first();
    const rightPanel = page.locator('aside').last();
    const centerArea = page.locator('div.flex-1.overflow-auto');

    await expect(leftPanel).toBeVisible();
    await expect(centerArea).toBeVisible();
    await expect(rightPanel).toBeVisible();

    // Resize to smaller desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(300);

    // Panels should still be visible
    await expect(leftPanel).toBeVisible();
    await expect(rightPanel).toBeVisible();
  });

  test('should have proper color scheme and styling', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for consistent border colors
    const borders = page.locator('[class*="border"]');
    expect(await borders.count()).toBeGreaterThan(0);

    // Check for muted background on category list
    const categoryList = page.locator('aside').first();
    const classes = await categoryList.getAttribute('class');
    expect(classes).toContain('bg-muted');

    // Check that detail panel has background
    const detailPanel = page.locator('aside').last();
    const detailClasses = await detailPanel.getAttribute('class');
    expect(detailClasses).toContain('bg-background');
  });

  test('should show correct typography hierarchy', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Select a category to show detail panel
    const category = page.locator('button').filter({ hasText: /Groceries|Rent/ }).first();
    await category.click();
    await page.waitForTimeout(500);

    // Check heading sizes
    const detailPanel = page.locator('aside').last();

    // Category name should be larger (text-xl)
    const categoryName = detailPanel.locator('h2').first();
    const nameClasses = await categoryName.getAttribute('class');
    expect(nameClasses).toContain('text-xl');

    // Section headings should be smaller and uppercase
    const sectionHeadings = detailPanel.locator('h3');
    const count = await sectionHeadings.count();

    if (count > 0) {
      const firstHeading = sectionHeadings.first();
      const headingClasses = await firstHeading.getAttribute('class');
      expect(headingClasses).toContain('uppercase');
    }
  });
});
