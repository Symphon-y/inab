# Architecture

This document describes the technical architecture of the inab budgeting application.

## Overview

inab is a local-first, open-source budgeting application built with:
- **Next.js 14+** (App Router) for frontend and API
- **PostgreSQL 16** for data persistence
- **Drizzle ORM** for type-safe database access
- **shadcn/ui** for UI components
- **VISX** for data visualizations
- **Playwright** for E2E testing

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                 Next.js Frontend                       │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │ │
│  │  │ Budget  │  │Accounts │  │Reports  │  │Settings │  │ │
│  │  │  Page   │  │  Page   │  │  Page   │  │  Page   │  │ │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │ │
│  │       │            │            │            │        │ │
│  │  ┌────┴────────────┴────────────┴────────────┴────┐  │ │
│  │  │              React Components                   │  │ │
│  │  │  (shadcn/ui + Custom Components + VISX)        │  │ │
│  │  └────────────────────┬───────────────────────────┘  │ │
│  └───────────────────────┼───────────────────────────────┘ │
│                          │ HTTP                            │
│  ┌───────────────────────┼───────────────────────────────┐ │
│  │              Next.js API Routes                       │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  │ │
│  │  │/accounts│  │/budget  │  │/transac-│  │/reports │  │ │
│  │  │         │  │         │  │ tions   │  │         │  │ │
│  │  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  │ │
│  │       └────────────┴────────────┴────────────┘        │ │
│  │                         │                             │ │
│  │  ┌──────────────────────┴───────────────────────────┐ │ │
│  │  │                  Drizzle ORM                      │ │ │
│  │  └──────────────────────┬───────────────────────────┘ │ │
│  └─────────────────────────┼─────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────┘
                              │ TCP/5432
┌─────────────────────────────┼───────────────────────────────┐
│                    Docker Compose                           │
│  ┌─────────────────────────┴───────────────────────────┐   │
│  │                PostgreSQL 16                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  │   │
│  │  │accounts │  │transac- │  │categories│  │budgets │  │   │
│  │  │         │  │ tions   │  │         │  │        │  │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌────────────┐
│  settings   │       │ category_groups │◄──────│ categories │
└─────────────┘       └─────────────────┘       └─────┬──────┘
                                                      │
                              ┌────────────────────────┘
                              │
┌─────────────┐       ┌───────┴─────┐       ┌──────────────────┐
│  accounts   │◄──────│transactions │──────►│budget_allocations│
└──────┬──────┘       └─────────────┘       └──────────────────┘
       │                                            │
       │              ┌─────────────┐              │
       └─────────────►│reconciliations│◄────────────┘
                      └─────────────┘

┌─────────────┐       ┌─────────────┐
│   payees    │       │    goals    │──────► categories
└─────────────┘       └─────────────┘
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `settings` | App-wide settings (currency, date format) |
| `accounts` | Bank accounts, credit cards, cash |
| `category_groups` | Groups of budget categories |
| `categories` | Individual budget categories |
| `transactions` | All financial transactions |
| `budget_allocations` | Monthly budget assignments per category |
| `goals` | Savings goals and targets |
| `payees` | Autocomplete payee list |
| `reconciliations` | Account reconciliation history |

## Directory Structure

```
inab/
├── docker/                 # Docker configuration
│   └── postgres/
│       └── init.sql       # DB initialization
├── e2e/                   # Playwright tests
│   ├── pages/             # Page Object Models
│   └── specs/             # Test specifications
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (dashboard)/   # Dashboard route group
│   │   │   ├── budget/    # Budget pages
│   │   │   ├── accounts/  # Account pages
│   │   │   ├── reports/   # Report pages
│   │   │   └── settings/  # Settings page
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── layout/        # Layout components
│   │   ├── features/      # Feature components
│   │   └── charts/        # VISX charts
│   ├── db/
│   │   ├── schema/        # Drizzle schemas
│   │   └── migrations/    # DB migrations
│   ├── hooks/             # Custom React hooks
│   ├── lib/
│   │   └── utils/         # Utilities
│   ├── types/             # TypeScript types
│   └── validators/        # Zod schemas
├── docker-compose.yml
├── Dockerfile.dev
└── drizzle.config.ts
```

## Key Concepts

### Zero-Based Budgeting

The app implements envelope budgeting where every dollar has a job:

1. **Income** flows into "Ready to Assign"
2. User **assigns** money to categories
3. **Spending** reduces category available balance
4. At month end, balances **carry over**

```
Ready to Assign = Total Income - Total Assigned

Category Available = Carryover + Assigned + Activity
```

### Money Storage

All monetary values are stored as integers in cents to avoid floating-point precision issues:

```typescript
// $150.00 is stored as 15000
const amount = 15000;

// Display formatting
const formatted = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(amount / 100); // "$150.00"
```

### Transaction Flow

```
User Input → Validate → Store Transaction → Update Account Balance
                                          ↓
                              Update Budget Activity
                                          ↓
                              Recalculate Available
```

## API Design

### RESTful Endpoints

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/accounts` | GET, POST | List/create accounts |
| `/api/accounts/[id]` | GET, PUT, DELETE | Single account CRUD |
| `/api/transactions` | GET, POST | List/create transactions |
| `/api/transactions/[id]` | GET, PUT, DELETE | Single transaction |
| `/api/budget` | GET | Monthly budget overview |
| `/api/budget/allocate` | POST | Assign to category |
| `/api/budget/move-money` | POST | Move between categories |
| `/api/categories` | GET, POST | Category management |
| `/api/category-groups` | GET, POST | Category group management |
| `/api/goals` | GET, POST | Goal management |
| `/api/reports/*` | GET | Various reports |

### Response Format

```typescript
// Success
{
  data: T,
  meta?: { pagination, etc }
}

// Error
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

## State Management

### Server State
- **React Query** for data fetching, caching, and synchronization
- Optimistic updates for responsive UI
- Background refetching for data freshness

### Client State
- React `useState` for component-local state
- Zustand (optional) for global UI state

## Security Considerations

### Data Protection
- All data stored locally (no cloud sync by default)
- No sensitive data in cookies/localStorage
- Input validation with Zod on all endpoints

### Future Considerations
- Optional encryption at rest
- Backup/export functionality
- Multi-user authentication (optional)

## Performance

### Optimizations
- Server Components for static content
- React Query caching for repeated fetches
- Database indexes on frequently queried columns
- Pagination for large data sets

### Monitoring
- Playwright for E2E performance testing
- React DevTools for component profiling

## Development Workflow

### Local Development
```bash
# Start database
docker compose up db -d

# Run migrations
npm run db:push

# Start dev server
npm run dev

# Run tests
npx playwright test
```

### Docker Development
```bash
# Start everything
docker compose up

# Access app at http://localhost:3000
```

## Future Extensibility

### Planned Features
- Bank import (CSV/OFX)
- Multiple currencies
- Scheduled transactions
- Mobile PWA support

### Architecture Decisions
- Single-user for simplicity, auth can be added later
- PostgreSQL over SQLite for future scaling
- API routes ready for potential mobile app
