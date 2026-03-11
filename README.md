# inab

A local-first, open-source budgeting application inspired by YNAB. Budget with intention.

## Features

### Core Budgeting
- **Zero-Based Budgeting**: Every dollar gets a job
- **Envelope System**: Assign money to categories and track spending
- **Category Goals**: Set monthly targets, savings goals, and funding targets
- **Available Breakdown**: See exactly where your category money comes from (carryover, assigned, activity)
- **Auto-Assign**: Automatically distribute funds based on underfunded categories
- **Category Groups**: Organize categories with collapsible sections

### Accounts & Transactions
- **Multi-Account Support**: Track checking, savings, credit cards, and more
- **On/Off Budget**: Separate tracking and budget accounts
- **Transaction Management**: Add, edit, categorize, and split transactions
- **Manual Entry**: Full control over your financial data

### Multiple Budget Plans
- **Plan Management**: Create separate budgets for different scenarios
- **Plan Switching**: Quickly switch between different budget plans
- **Default Plan**: Set your primary budget for quick access

### Reports & Insights
- **Spending Analysis**: Pie charts by category and group
- **Income vs Expenses**: Bar charts showing financial trends
- **Net Worth Tracking**: Monitor your financial progress over time
- **Custom Date Ranges**: Analyze any time period

### Privacy & Control
- **Local-First**: Your data stays on your machine
- **Open Source**: Free forever, community-driven
- **No Cloud Required**: Run entirely offline

## Tech Stack

- **Frontend**: Next.js 16+ (App Router) with React 19
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Context + Server Actions
- **Testing**: Playwright E2E
- **Deployment**: Docker & Docker Compose

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/inab.git
   cd inab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start everything** (database, schema push, dev server)
   ```bash
   npm run dev:init
   ```

4. **Open the app**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Using Docker Compose (Full Stack)

```bash
# Start everything
docker compose up

# Access the app at http://localhost:3000
```

## Available Scripts

### Development
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:init` | Start DB, push schema, and run dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

### Docker
| Command | Description |
|---------|-------------|
| `npm run docker:dev` | Run full stack in Docker with hot reload |
| `npm run docker:build` | Rebuild Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run docker:logs` | Follow app container logs |

### Database
| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

### Testing
| Command | Description |
|---------|-------------|
| `npx playwright test` | Run all E2E tests |
| `npx playwright test --ui` | Run tests in UI mode |
| `npx playwright show-report` | View test report |

## Project Structure

```
inab/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Dashboard layout group
│   │   │   ├── accounts/       # Accounts page
│   │   │   ├── budget/         # Budget page (with year/month params)
│   │   │   ├── reports/        # Reports & analytics
│   │   │   └── settings/       # Settings page
│   │   ├── api/                # API routes
│   │   │   ├── accounts/       # Account endpoints
│   │   │   ├── budget/         # Budget endpoints
│   │   │   ├── categories/     # Category endpoints
│   │   │   ├── goals/          # Goal endpoints
│   │   │   ├── plans/          # Plan endpoints
│   │   │   ├── reports/        # Report endpoints
│   │   │   └── transactions/   # Transaction endpoints
│   │   ├── goals/              # Goals page
│   │   └── plans/              # Plans management page
│   ├── components/
│   │   ├── features/           # Feature-specific components
│   │   │   ├── accounts/       # Account components
│   │   │   ├── budget/         # Budget grid, categories, detail panel
│   │   │   ├── categories/     # Category forms & management
│   │   │   ├── goals/          # Goal cards, forms, progress
│   │   │   ├── plans/          # Plan switcher, cards
│   │   │   ├── reports/        # Charts and visualizations
│   │   │   └── transactions/   # Transaction list, forms
│   │   ├── layout/             # Layout components (Header, Sidebar)
│   │   ├── providers/          # Context providers
│   │   └── ui/                 # shadcn/ui components
│   ├── db/
│   │   ├── schema/             # Drizzle schema definitions
│   │   │   ├── accounts.ts
│   │   │   ├── budgets.ts
│   │   │   ├── categories.ts
│   │   │   ├── goals.ts
│   │   │   ├── plans.ts
│   │   │   ├── transactions.ts
│   │   │   └── index.ts
│   │   └── index.ts            # Database connection
│   ├── lib/                    # Utilities and helpers
│   └── types/                  # TypeScript type definitions
├── e2e/                        # Playwright E2E tests
│   ├── fixtures/               # Test data and setup
│   ├── pages/                  # Page object models
│   └── specs/                  # Test specifications
├── docker/                     # Docker configuration
├── public/                     # Static assets
└── scripts/                    # Utility scripts
```

## Documentation

- [Architecture](./ARCHITECTURE.md) - Technical architecture overview
- [Conventions](./CONVENTIONS.md) - Coding conventions and best practices

## Contributing

Contributions are welcome! This project follows standard GitHub flow:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- Code follows the conventions in [CONVENTIONS.md](./CONVENTIONS.md)
- E2E tests pass (`npx playwright test`)
- TypeScript has no errors (`npm run build`)
- Code is properly formatted and linted

## Roadmap

See [ARCHITECTURE.md](./ARCHITECTURE.md) for planned features and technical roadmap.

---

Built with intention. 💙
