import { Page, Locator } from '@playwright/test';

export class BudgetPage {
  readonly page: Page;
  readonly header: Locator;
  readonly monthSelector: Locator;
  readonly prevMonthButton: Locator;
  readonly nextMonthButton: Locator;
  readonly toBeBudgeted: Locator;
  readonly categoryGroups: Locator;
  readonly addCategoryGroupButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.getByRole('heading', { name: 'Budget' });
    this.monthSelector = page.locator('header').getByText(/\w+ \d{4}/);
    this.prevMonthButton = page.getByRole('link').filter({ has: page.locator('svg.lucide-chevron-left') });
    this.nextMonthButton = page.getByRole('link').filter({ has: page.locator('svg.lucide-chevron-right') });
    this.toBeBudgeted = page.getByText('Ready to Assign');
    this.categoryGroups = page.locator('[data-testid="category-group"]');
    this.addCategoryGroupButton = page.getByRole('button', { name: 'Add Category Group' });
  }

  async goto(year?: number, month?: number) {
    if (year && month) {
      await this.page.goto(`/budget/${year}/${month}`);
    } else {
      await this.page.goto('/budget');
    }
  }

  async waitForLoad() {
    await this.header.waitFor();
  }

  async getMonthName(): Promise<string> {
    return await this.monthSelector.textContent() || '';
  }

  async goToNextMonth() {
    await this.nextMonthButton.click();
  }

  async goToPreviousMonth() {
    await this.prevMonthButton.click();
  }
}
