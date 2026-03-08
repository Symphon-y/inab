# Coding Conventions

This document outlines the coding conventions and best practices for the inab project.

## General Principles

### SOLID
- **Single Responsibility**: Each module, class, or function should have one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived types must be substitutable for their base types
- **Interface Segregation**: Many specific interfaces are better than one general interface
- **Dependency Inversion**: Depend on abstractions, not concretions

### Clean Code
- Write self-documenting code with clear naming
- Keep functions small and focused
- Avoid deep nesting (max 3 levels)
- Extract complex conditions into named variables or functions

### DRY (Don't Repeat Yourself)
- Extract repeated logic into reusable functions/hooks
- Use shared components for common UI patterns
- Centralize constants and configuration

## Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
├── components/
│   ├── ui/             # Base shadcn/ui components
│   ├── layout/         # Layout components (Sidebar, Header)
│   ├── features/       # Feature-specific components
│   └── charts/         # VISX chart components
├── db/
│   ├── schema/         # Drizzle schema definitions
│   └── migrations/     # Database migrations
├── hooks/              # Custom React hooks
├── lib/
│   └── utils/          # Utility functions
├── types/              # TypeScript type definitions
└── validators/         # Zod validation schemas
```

## TypeScript

### Type Safety
- Always use strict TypeScript (`strict: true`)
- Avoid `any` - use `unknown` when type is truly unknown
- Define explicit return types for functions
- Use type inference where it improves readability

### Naming Conventions
- **Interfaces/Types**: PascalCase (`Account`, `Transaction`)
- **Variables/Functions**: camelCase (`getAccounts`, `formatCurrency`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_TRANSACTIONS`)
- **Files**: kebab-case for utilities, PascalCase for components

### Type Definitions
```typescript
// Prefer interfaces for objects that can be extended
interface Account {
  id: string;
  name: string;
  balance: number;
}

// Use type for unions, intersections, or computed types
type AccountType = 'checking' | 'savings' | 'credit_card';
```

## React Components

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { cn } from '@/lib/utils';

// 2. Types
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

// 3. Component
export function Button({ variant, children }: ButtonProps) {
  // 3a. Hooks
  const [isHovered, setIsHovered] = useState(false);

  // 3b. Derived state/handlers
  const className = cn('btn', variant === 'primary' && 'btn-primary');

  // 3c. Render
  return (
    <button className={className}>
      {children}
    </button>
  );
}
```

### Component Guidelines
- Use function components with hooks
- One component per file (exceptions for tightly coupled sub-components)
- Colocate related files (component, styles, tests)
- Extract reusable logic into custom hooks
- Prefer composition over prop drilling

### Props
- Destructure props in function signature
- Use optional props sparingly, prefer explicit defaults
- Document complex props with JSDoc

## Styling

### Tailwind CSS
- Use Tailwind utility classes directly in components
- Extract repeated patterns into component variants
- Follow mobile-first responsive design
- Use CSS variables for theming (defined in globals.css)

### Spacing Scale
- Use 4px base unit: `p-1` (4px), `p-2` (8px), `p-4` (16px), etc.
- Maintain consistent spacing throughout the app

### Colors
- Use semantic color names: `bg-primary`, `text-muted-foreground`
- Avoid hardcoded color values

## State Management

### Server State
- Use React Query (TanStack Query) for server state
- Define query keys consistently
- Handle loading and error states

### Client State
- Use React's built-in state for component-local state
- Use Zustand sparingly for global client state
- Prefer lifting state up over global state

## API Routes

### Structure
```typescript
// app/api/accounts/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { accounts } from '@/db/schema';

export async function GET() {
  const data = await db.select().from(accounts);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  // Validate with Zod
  // Insert into database
  return NextResponse.json(result, { status: 201 });
}
```

### Error Handling
- Return appropriate HTTP status codes
- Provide meaningful error messages
- Log errors server-side

## Database

### Schema Conventions
- Use UUIDs for primary keys
- Store monetary values in cents (integers)
- Use timestamps with timezone
- Implement soft deletes via `deleted_at` column

### Queries
- Use Drizzle ORM for type-safe queries
- Keep queries in service functions or hooks
- Use transactions for related operations

## Testing

### Playwright E2E Tests
- Use Page Object Model for complex pages
- Test user flows, not implementation details
- Keep tests independent and idempotent
- Use meaningful test descriptions

### Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { BudgetPage } from '../pages';

test.describe('Budget Management', () => {
  test('should display budget grid', async ({ page }) => {
    const budgetPage = new BudgetPage(page);
    await budgetPage.goto();
    await expect(budgetPage.grid).toBeVisible();
  });
});
```

## Git Conventions

### Commits
- Write clear, concise commit messages
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Keep commits atomic and focused

### Branches
- `main` - production-ready code
- `feature/*` - new features
- `fix/*` - bug fixes

## Currency Handling

### Storage
- Always store amounts in cents (smallest currency unit)
- Use `bigint` in database for large amounts

### Display
```typescript
// Use Intl.NumberFormat for formatting
const formatCurrency = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};
```

### Calculations
- Perform all calculations in cents
- Convert to/from cents at input/output boundaries
