# inab Implementation Plan

## Executive Summary

This plan outlines the implementation of missing features and UI/UX improvements to create a professional, Apple-style budgeting application. The plan is organized into phases, prioritizing core functionality before polish.

---

## Current State Assessment

### ✅ Completed
- Database schema (9 tables with proper relationships)
- API routes for accounts, transactions, categories, category groups, goals
- Basic page structure (Budget, Accounts, Reports, Settings)
- Account management (CRUD operations)
- Sidebar navigation with account listing
- Docker development environment
- Playwright E2E test suite
- shadcn/ui component library integration
- **Phase 1.1: Category & Category Group Management** ✅
- **Phase 1.2: Budget Grid & Allocation Logic** ✅
- **Phase 1.3: Transaction Management** ✅
- **Phase 2: Reports & Visualizations** ✅

### ❌ Missing Core Features
1. ~~**Budget Grid Functionality**~~ - ✅ **COMPLETE** (allocation/available calculations working)
2. ~~**Transaction List UI**~~ - ✅ **COMPLETE** (full CRUD with running balance)
3. ~~**Category Management UI**~~ - ✅ **COMPLETE** (create/edit/delete functional)
4. ~~**Budget Allocation Logic**~~ - ✅ **COMPLETE** (assign money working)
5. ~~**Report Visualizations**~~ - ✅ **COMPLETE** (spending, net worth, income vs expense)
6. **Settings Persistence** - Currency/date format not saved
7. **Goal Management UI** - No UI for goals
8. **Account Reconciliation** - No reconciliation interface
9. **Data Import/Export** - Buttons present but non-functional
10. **Search & Filtering** - No search capabilities

### 🎨 UI/UX Improvements Needed (Apple-Style)

#### Design Principles for Apple-Style UI
- **Simplicity**: Clean, uncluttered interfaces with generous white space
- **Clarity**: Clear visual hierarchy, readable typography
- **Deference**: Content-focused, UI elements fade into background
- **Depth**: Subtle layering with shadows and translucency
- **Consistency**: Uniform spacing, border radius, and interaction patterns

#### Specific Improvements
1. **Typography**
   - More refined font scale (-1 for primary, SF Pro style)
   - Better line heights (1.5 for body, 1.2 for headings)
   - Consistent font weights (400, 500, 600)

2. **Spacing & Layout**
   - Increase padding/margins by 25-50%
   - More generous card padding (6-8 vs current 4)
   - Better section separation

3. **Colors & Shadows**
   - Softer, more refined gray palette
   - Subtle accent colors (blue for primary actions)
   - Elevation system with subtle shadows
   - Better contrast ratios for accessibility

4. **Components**
   - Refined button styles with better hover states
   - Input fields with subtle borders and focus states
   - Better empty states with icons and helpful messaging
   - Skeleton loaders instead of "Loading..."
   - Smooth transitions (150-200ms cubic-bezier)

5. **Interactions**
   - Hover states for all interactive elements
   - Active/pressed states with subtle transforms
   - Loading states for async actions
   - Toast notifications for success/error
   - Confirmation dialogs for destructive actions

---

## Implementation Phases

### Phase 1: Core Budget Functionality (High Priority)

#### 1.1 Category & Category Group Management ✅ **COMPLETE**
**Scope**: Build UI for creating, editing, organizing categories

**Tasks**:
- [x] Create `CategoryGroupForm` component (dialog-based)
- [x] Create `CategoryForm` component (dialog-based)
- [x] Add category group section to budget page
- [ ] Implement drag-and-drop reordering (react-beautiful-dnd or dnd-kit) - **Deferred**
- [x] Add "Add Category" button within each group
- [x] Implement delete with cascade confirmation
- [x] Add collapsible category groups

**API Changes**: None needed (already exists)

**UI Components Created**:
- ✅ CategoryGroupForm dialog
- ✅ CategoryForm dialog
- ✅ CategoryGroupSection (collapsible)
- ✅ CategoryRow (clickable/editable)
- ✅ BudgetGrid (orchestrator)

---

#### 1.2 Budget Grid & Allocation Logic ✅ **COMPLETE**
**Scope**: Make budget grid functional with money assignment

**Tasks**:
- [x] Fetch budget allocations for current month (`GET /api/budget/allocations?year=X&month=Y`)
- [x] Create `CategoryRow` component with clickable "Assigned" field
- [x] Implement "Ready to Assign" calculation logic
- [x] Add quick-assign buttons (+$100, +$250, +$500, +$1000)
- [x] Create `AssignMoneyDialog` for precise allocation
- [x] Calculate and display "Activity" from transactions (placeholder - Phase 1.3)
- [x] Calculate and display "Available" (carryover + assigned + activity)
- [x] Color-code available amounts (green >0, yellow =0, red <0)
- [ ] Implement month-to-month carryover logic - **Deferred to Phase 3**
- [ ] Add "Move Money" functionality between categories - **Deferred to Phase 3**

**New API Endpoints Created**:
```typescript
✅ GET  /api/budget/allocations?year=2026&month=3
✅ POST /api/budget/allocations (create/update allocation)
✅ GET  /api/budget/summary?year=2026&month=3 (totals)
```

**UI Components Created**:
- ✅ CategoryRow (with assign money on click)
- ✅ AssignMoneyDialog (with quick-assign buttons)
- ✅ ReadyToAssignCard (enhanced with real-time calculations)

---

#### 1.3 Transaction Management ✅ **COMPLETE**
**Scope**: Full transaction CRUD with category assignment

**Tasks**:
- [x] Create `TransactionList` component for account pages
- [x] Create `TransactionForm` dialog (add/edit transactions)
- [x] Add transaction date picker
- [x] Implement payee input (autocomplete deferred)
- [x] Add category selector (grouped by category groups)
- [x] Support cleared/uncleared status toggle
- [x] Add flag system (colors: none, red, orange, yellow, green, blue, purple)
- [x] Implement memo field
- [ ] Add split transaction support (parent-child relationships) - **Deferred to Phase 3**
- [x] Create running balance column
- [ ] Add transaction search/filter - **Deferred to Phase 3**
- [ ] Implement pagination (50 transactions per page) - **Deferred to Phase 3**
- [x] Add "Add Transaction" button
- [x] Update budget allocations activity when transactions are categorized
- [x] Create utility functions for budget activity calculation
- [x] Update transaction API to recalculate activity on create/update/delete

**API Enhancements**:
```typescript
✅ GET  /api/transactions?accountId=X (existing, works)
✅ POST /api/transactions (enhanced with activity update)
✅ PUT  /api/transactions/[id] (enhanced with activity update)
✅ DELETE /api/transactions/[id] (enhanced with activity update)
```

**UI Components Created**:
- ✅ TransactionList (table with running balance)
- ✅ TransactionForm dialog (full create/edit)
- ✅ CategorySelect (grouped dropdown)
- ✅ AccountTransactions (orchestrator component)

**Utility Functions Created**:
- ✅ updateBudgetActivity() - Recalculate activity for category/month
- ✅ updateBudgetActivityForTransaction() - Handle create/update/delete events

---

### Phase 2: Reports & Visualizations ✅ **COMPLETE**

#### 2.1 Spending Report (Pie Chart) ✅ **COMPLETE**
**Scope**: Visualize spending by category and payee

**Tasks**:
- [x] Install and configure Recharts library (switched from VISX for React 19 compatibility)
- [x] Create `SpendingPieChart` component
- [x] Add time range selector (Last 30 Days, Last 3 Months, Last 6 Months, Last Year, YTD, All Time, Custom)
- [x] Implement category grouping
- [x] Create legend with percentages
- [x] Add custom tooltip with amounts and percentages
- [ ] Add drill-down from category to transactions - **Deferred to Phase 5**
- [ ] Add export to CSV functionality - **Deferred to Phase 3**

**API Endpoint**:
```typescript
✅ GET /api/reports/spending?startDate=X&endDate=Y&groupBy=category|payee
```

**UI Components Created**:
- ✅ SpendingPieChart (Recharts)
- ✅ TimeRangeSelector (with presets and custom range)
- ✅ Custom tooltip and labels
- ✅ Empty state handling

---

#### 2.2 Net Worth Report (Line Chart) ✅ **COMPLETE**
**Scope**: Track net worth over time

**Tasks**:
- [x] Create `NetWorthLineChart` component
- [x] Calculate net worth snapshots (current implementation, historical deferred)
- [x] Show all accounts vs. budget accounts toggle
- [x] Add account breakdown by type
- [x] Display current net worth prominently
- [ ] Implement zoom/pan for long time ranges - **Deferred to Phase 4**
- [ ] Add goal overlay lines - **Deferred to Phase 3**
- [ ] Track historical snapshots at month boundaries - **Deferred to Phase 3**

**API Endpoint**:
```typescript
✅ GET /api/reports/net-worth?accountType=all|budget
```

**UI Components Created**:
- ✅ NetWorthLineChart (Recharts)
- ✅ Account breakdown cards by type
- ✅ Current net worth display
- ✅ Empty state for historical data

---

#### 2.3 Income vs Expense Report (Bar Chart) ✅ **COMPLETE**
**Scope**: Compare income and expenses month-by-month

**Tasks**:
- [x] Create `IncomeExpenseBarChart` component
- [x] Group transactions by month
- [x] Calculate income (positive transactions to budget accounts)
- [x] Calculate expenses (negative transactions from budget accounts)
- [x] Show net savings as overlay line
- [x] Display total income, expenses, net savings, and avg savings rate
- [ ] Add category breakdown on click - **Deferred to Phase 5**

**API Endpoint**:
```typescript
✅ GET /api/reports/income-expense?startDate=X&endDate=Y
```

**UI Components Created**:
- ✅ IncomeExpenseBarChart (Recharts ComposedChart)
- ✅ Net savings line overlay
- ✅ Summary cards with totals and averages
- ✅ Custom tooltip with formatted values

---

**Reports Page Integration**: ✅ **COMPLETE**
- Created comprehensive reports dashboard
- Integrated all three chart components
- Added time range selector for date filtering
- Organized charts in clean, responsive layout

---

### Phase 3: Enhanced Features (Medium Priority)

#### 3.1 Goals & Targets
**Scope**: Help users save for specific goals

**Tasks**:
- [ ] Create `GoalForm` dialog
- [ ] Add goal indicator to budget grid (progress bar)
- [ ] Implement goal types:
  - Target Balance (save $X total)
  - Target Balance by Date (save $X by date)
  - Monthly Funding (save $X/month)
  - Spending Monthly (spend no more than $X/month)
- [ ] Show suggested monthly contribution
- [ ] Add goal completion celebrations
- [ ] Create dedicated Goals page

**UI Components**:
- GoalForm dialog
- GoalProgressBar
- GoalCard
- GoalsList page
- CompletionCelebration

---

#### 3.2 Account Reconciliation
**Scope**: Match transactions to bank statements

**Tasks**:
- [ ] Create `ReconcileDialog` for accounts
- [ ] Add statement date and balance inputs
- [ ] Show cleared vs. uncleared transactions
- [ ] Calculate working balance vs. statement balance
- [ ] Allow toggling cleared status
- [ ] Save reconciliation history
- [ ] Show last reconciled date in account list

**UI Components**:
- ReconcileDialog
- ReconciliationList
- BalanceComparison
- ReconciliationHistory

---

#### 3.3 Settings Persistence
**Scope**: Save and apply user preferences

**Tasks**:
- [ ] Create settings API endpoints
- [ ] Implement currency setting (USD, EUR, GBP, CAD, etc.)
- [ ] Implement date format setting
- [ ] Add first day of week setting (Sunday/Monday)
- [ ] Add budget start month setting
- [ ] Save settings to database
- [ ] Apply settings app-wide (currency formatting, date display)

**API Endpoints**:
```typescript
GET /api/settings
PUT /api/settings
```

---

#### 3.4 Data Import/Export
**Scope**: Backup and restore user data

**Tasks**:
- [ ] Implement JSON export (all data)
- [ ] Implement JSON import (restore from backup)
- [ ] Add CSV export for transactions
- [ ] Add CSV import for transactions (OFX/QIF support later)
- [ ] Create import mapping UI for CSV columns
- [ ] Add duplicate detection
- [ ] Show import preview before committing

**UI Components**:
- ExportDialog
- ImportDialog
- CSVMappingWizard
- ImportPreview

---

### Phase 4: UI/UX Polish (Apple-Style Refinements)

#### 4.1 Typography & Spacing Refinement

**Tasks**:
- [ ] Update font scale in tailwind.config.ts
- [ ] Increase line heights for better readability
- [ ] Add more generous padding to cards (p-6 → p-8)
- [ ] Increase spacing between sections
- [ ] Update heading hierarchy (text-3xl, text-2xl, text-xl, text-lg)
- [ ] Use font-medium for most UI text, font-semibold sparingly

**Changes**:
```css
/* globals.css additions */
--font-scale-sm: 0.875rem;
--font-scale-base: 1rem;
--font-scale-lg: 1.125rem;
--font-scale-xl: 1.25rem;
--font-scale-2xl: 1.5rem;
--font-scale-3xl: 1.875rem;

--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

---

#### 4.2 Color System Refinement

**Tasks**:
- [ ] Refine gray scale for better contrast
- [ ] Add blue accent for primary actions (Apple-style blue)
- [ ] Update destructive color (softer red)
- [ ] Add success green for positive amounts
- [ ] Add warning yellow/orange for zero balances
- [ ] Implement subtle elevation shadows
- [ ] Add glass morphism effect for floating elements

**Updated Colors** (OKLCH):
```css
--color-blue-500: oklch(0.6 0.2 250); /* Primary blue */
--color-green-500: oklch(0.65 0.2 145); /* Success */
--color-yellow-500: oklch(0.75 0.15 85); /* Warning */
--color-red-500: oklch(0.6 0.22 27); /* Destructive */

/* Shadows */
--shadow-sm: 0 1px 2px 0 oklch(0 0 0 / 5%);
--shadow-md: 0 4px 6px -1px oklch(0 0 0 / 7%);
--shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 10%);
```

---

#### 4.3 Component Refinements

**Tasks**:
- [ ] Update Button component with better states
- [ ] Add subtle scale transform on active (scale-95)
- [ ] Improve Input focus states (ring + border color)
- [ ] Add hover states to all clickable elements
- [ ] Create LoadingSkeleton components
- [ ] Add smooth transitions (transition-all duration-200)
- [ ] Implement toast notification system (sonner)
- [ ] Add progress indicators for async actions
- [ ] Create better empty states with illustrations

**New Components**:
- LoadingSkeleton (for accounts, transactions, categories)
- Toast (using sonner library)
- EmptyState (with icon, title, description, action)
- ProgressIndicator (for loading states)

---

#### 4.4 Animations & Micro-interactions

**Tasks**:
- [ ] Add fade-in animations for page transitions
- [ ] Implement slide-in for sidebar
- [ ] Add scale animation for dialogs
- [ ] Create bounce effect for success actions
- [ ] Add ripple effect on button clicks
- [ ] Implement smooth scroll to new items
- [ ] Add celebration confetti for goals completion
- [ ] Create smooth collapse/expand for category groups

**Libraries**:
- framer-motion (for complex animations)
- canvas-confetti (for celebrations)

---

#### 4.5 Responsive Design Improvements

**Tasks**:
- [ ] Improve mobile navigation (bottom nav bar)
- [ ] Make sidebar collapsible on mobile
- [ ] Optimize budget grid for mobile (stack columns)
- [ ] Add swipe gestures for month navigation
- [ ] Improve touch targets (min 44x44px)
- [ ] Test on tablets (iPad-specific layouts)
- [ ] Add pull-to-refresh on mobile
- [ ] Optimize transaction list for mobile

---

#### 4.6 Accessibility Improvements

**Tasks**:
- [ ] Add ARIA labels to all interactive elements
- [ ] Ensure keyboard navigation works everywhere
- [ ] Test with screen readers (NVDA/JAWS)
- [ ] Improve focus indicators
- [ ] Add skip navigation links
- [ ] Ensure color contrast ratios meet WCAG AA
- [ ] Add reduced motion support (prefers-reduced-motion)
- [ ] Test with keyboard-only navigation

---

### Phase 5: Advanced Features (Lower Priority)

#### 5.1 Search & Filtering

**Tasks**:
- [ ] Add global search (transactions, payees, categories)
- [ ] Implement transaction filters (date range, category, flag, status)
- [ ] Add saved filter presets
- [ ] Create advanced search UI
- [ ] Add search keyboard shortcuts (⌘K / Ctrl+K)

---

#### 5.2 Scheduled Transactions

**Tasks**:
- [ ] Create scheduled transaction schema
- [ ] Add recurring transaction UI
- [ ] Implement frequency options (weekly, monthly, yearly)
- [ ] Add auto-entry of scheduled transactions
- [ ] Create review queue for scheduled transactions

---

#### 5.3 Budget Templates

**Tasks**:
- [ ] Allow saving current month as template
- [ ] Implement "Apply Template" to future months
- [ ] Create starter templates (Zero-based, 50/30/20, etc.)
- [ ] Add template management page

---

#### 5.4 Multi-Currency Support

**Tasks**:
- [ ] Add currency per account
- [ ] Implement exchange rate API integration
- [ ] Convert all amounts to base currency for reports
- [ ] Show original currency in transactions
- [ ] Add currency conversion UI

---

#### 5.5 Bank Import (CSV/OFX)

**Tasks**:
- [ ] Add OFX parser
- [ ] Implement CSV import with flexible mapping
- [ ] Add automatic payee matching
- [ ] Create import rules (auto-categorize)
- [ ] Add duplicate detection algorithm

---

## UI/UX Design System

### Color Palette (Apple-Style)

```css
:root {
  /* Grays (refined) */
  --gray-50: oklch(0.99 0 0);
  --gray-100: oklch(0.98 0 0);
  --gray-200: oklch(0.96 0 0);
  --gray-300: oklch(0.92 0 0);
  --gray-400: oklch(0.78 0 0);
  --gray-500: oklch(0.62 0 0);
  --gray-600: oklch(0.48 0 0);
  --gray-700: oklch(0.36 0 0);
  --gray-800: oklch(0.24 0 0);
  --gray-900: oklch(0.145 0 0);

  /* Accent Colors */
  --blue: oklch(0.6 0.2 250); /* Apple blue */
  --green: oklch(0.65 0.2 145); /* Success */
  --yellow: oklch(0.75 0.15 85); /* Warning */
  --red: oklch(0.6 0.22 27); /* Destructive */
  --orange: oklch(0.68 0.18 55); /* Activity */

  /* Semantic */
  --background: var(--gray-50);
  --foreground: var(--gray-900);
  --primary: var(--blue);
  --primary-foreground: var(--gray-50);
  --border: var(--gray-200);
  --muted: var(--gray-100);
  --muted-foreground: var(--gray-600);
}
```

### Spacing Scale

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 3rem;     /* 48px */
--spacing-3xl: 4rem;     /* 64px */
```

### Border Radius

```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
```

### Shadows (Subtle Elevation)

```css
--shadow-xs: 0 1px 2px oklch(0 0 0 / 3%);
--shadow-sm: 0 1px 3px oklch(0 0 0 / 5%), 0 1px 2px oklch(0 0 0 / 3%);
--shadow-md: 0 4px 6px -1px oklch(0 0 0 / 7%), 0 2px 4px -1px oklch(0 0 0 / 4%);
--shadow-lg: 0 10px 15px -3px oklch(0 0 0 / 10%), 0 4px 6px -2px oklch(0 0 0 / 5%);
--shadow-xl: 0 20px 25px -5px oklch(0 0 0 / 12%), 0 10px 10px -5px oklch(0 0 0 / 6%);
```

---

## Testing Strategy

### E2E Tests to Add
- [ ] Budget allocation flow (assign money to category)
- [ ] Transaction creation and editing
- [ ] Category management
- [ ] Month navigation with data persistence
- [ ] Account reconciliation flow
- [ ] Report generation
- [ ] Settings persistence
- [ ] Data export/import

### Visual Regression Tests
- [ ] Set up Percy or Chromatic
- [ ] Capture screenshots of all pages
- [ ] Test light and dark modes
- [ ] Test responsive breakpoints

---

## Performance Optimization

### Tasks
- [ ] Implement React Query for data caching
- [ ] Add optimistic UI updates
- [ ] Virtualize long lists (react-window)
- [ ] Lazy load chart components
- [ ] Implement pagination for transactions
- [ ] Add database indexes for common queries
- [ ] Use React.memo for expensive components
- [ ] Optimize bundle size (code splitting)

---

## Documentation

### Tasks
- [ ] Add JSDoc comments to all components
- [ ] Create Storybook for component library
- [ ] Write user guide
- [ ] Create API documentation
- [ ] Add inline help tooltips
- [ ] Create video tutorials

---

## Success Metrics

### Functionality
- ✅ All core YNAB features implemented
- ✅ Zero critical bugs in E2E tests
- ✅ Sub-100ms API response times
- ✅ Works offline (local-first)

### Design Quality
- ✅ Consistent 8px spacing grid
- ✅ WCAG AA accessibility compliance
- ✅ Smooth 60fps animations
- ✅ Mobile-responsive (320px+)
- ✅ Apple-style polish (clean, simple, delightful)

---

## Implementation Order (Recommended)

1. **Week 1-2**: Phase 1.1 - Category Management
2. **Week 3-4**: Phase 1.2 - Budget Grid & Allocation
3. **Week 5-6**: Phase 1.3 - Transaction Management
4. **Week 7**: Phase 4.1-4.3 - UI Polish (Typography, Colors, Components)
5. **Week 8**: Phase 2.1-2.3 - Reports & Visualizations
6. **Week 9**: Phase 3.1-3.2 - Goals & Reconciliation
7. **Week 10**: Phase 3.3-3.4 - Settings & Import/Export
8. **Week 11**: Phase 4.4-4.6 - Animations & Accessibility
9. **Week 12**: Phase 5 - Advanced Features (as time permits)

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize features** based on user needs
3. **Set up project tracking** (GitHub Projects/Linear)
4. **Begin Phase 1.1** (Category Management)
5. **Iterate and refine** based on feedback

---

*Built with intention.*
