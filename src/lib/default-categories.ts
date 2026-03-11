/**
 * Default categories that are automatically created when initializing a new budget
 * Matches YNAB's default category structure with contextually relevant emojis
 */

export interface DefaultCategoryGroup {
  name: string;
  sortOrder: number;
  categories: DefaultCategory[];
}

export interface DefaultCategory {
  name: string;
  icon: string;
  sortOrder: number;
}

export const DEFAULT_CATEGORY_GROUPS: DefaultCategoryGroup[] = [
  {
    name: 'Bills',
    sortOrder: 1,
    categories: [
      { name: 'Rent/Mortgage', icon: '🏠', sortOrder: 1 },
      { name: 'Phone', icon: '📱', sortOrder: 2 },
      { name: 'Internet', icon: '📡', sortOrder: 3 },
      { name: 'Utilities', icon: '⚡', sortOrder: 4 },
    ],
  },
  {
    name: 'Needs',
    sortOrder: 2,
    categories: [
      { name: 'Groceries', icon: '🛒', sortOrder: 1 },
      { name: 'Transportation', icon: '🚗', sortOrder: 2 },
      { name: 'Medical expenses', icon: '🩺', sortOrder: 3 },
      { name: 'Emergency fund', icon: '🚨', sortOrder: 4 },
    ],
  },
  {
    name: 'Wants',
    sortOrder: 3,
    categories: [
      { name: 'Dining out', icon: '🍽️', sortOrder: 1 },
      { name: 'Entertainment', icon: '🎫', sortOrder: 2 },
      { name: 'Vacation', icon: '🏖️', sortOrder: 3 },
      { name: 'Stuff I forgot to plan for', icon: '❗', sortOrder: 4 },
    ],
  },
];
