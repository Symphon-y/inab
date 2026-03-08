import { test, expect } from '@playwright/test';
import { BudgetPage } from '../pages';

test.describe('inab Application', () => {
  test('should redirect home to budget page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/budget\/\d{4}\/\d{1,2}/);
  });

  test('should display budget page with header', async ({ page }) => {
    const budgetPage = new BudgetPage(page);
    await budgetPage.goto();
    await budgetPage.waitForLoad();

    await expect(budgetPage.header).toBeVisible();
    await expect(budgetPage.toBeBudgeted).toBeVisible();
  });

  test('should display current month in budget header', async ({ page }) => {
    const budgetPage = new BudgetPage(page);
    const now = new Date();
    const expectedMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    await budgetPage.goto();
    await budgetPage.waitForLoad();

    const monthName = await budgetPage.getMonthName();
    expect(monthName.trim()).toBe(expectedMonth);
  });

  test('should navigate between months', async ({ page }) => {
    const budgetPage = new BudgetPage(page);
    await budgetPage.goto();
    await budgetPage.waitForLoad();

    const initialMonth = await budgetPage.getMonthName();

    await budgetPage.goToNextMonth();
    await page.waitForURL(/\/budget\/\d{4}\/\d{1,2}/);

    const nextMonth = await budgetPage.getMonthName();
    expect(nextMonth).not.toBe(initialMonth);
  });

  test('should display sidebar with navigation', async ({ page }) => {
    await page.goto('/budget');

    await expect(page.getByRole('link', { name: 'inab' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Budget' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Reports' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/budget');
    await page.getByRole('link', { name: 'Reports' }).click();

    await expect(page).toHaveURL('/reports');
    await expect(page.getByRole('heading', { name: 'Reports' })).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/budget');
    await page.getByRole('link', { name: 'Settings' }).click();

    await expect(page).toHaveURL('/settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });
});
