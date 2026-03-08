# inab

A local-first, open-source budgeting application inspired by YNAB. Budget with intention.

## Features

- **Zero-Based Budgeting**: Every dollar gets a job
- **Envelope System**: Assign money to categories and track spending
- **Account Management**: Track checking, savings, credit cards, and more
- **Manual Entry**: Full control over your financial data
- **Reports & Visualizations**: Understand your spending patterns
- **Local-First**: Your data stays on your machine
- **Open Source**: Free forever, community-driven

## Tech Stack

- **Frontend**: Next.js 14+ (App Router)
- **Database**: PostgreSQL 16
- **ORM**: Drizzle ORM
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: VISX
- **Testing**: Playwright

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

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:init` | Start DB, push schema, and run dev server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run docker:dev` | Run full stack in Docker with hot reload |
| `npm run docker:build` | Rebuild Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run docker:logs` | Follow app container logs |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npx playwright test` | Run E2E tests |

## Project Structure

```
inab/
├── src/
│   ├── app/           # Next.js pages and API routes
│   ├── components/    # React components
│   ├── db/            # Database schema and config
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities
│   ├── types/         # TypeScript types
│   └── validators/    # Zod schemas
├── e2e/               # Playwright tests
├── docker/            # Docker configuration
└── public/            # Static assets
```

## Documentation

- [Architecture](./ARCHITECTURE.md) - Technical architecture overview
- [Conventions](./CONVENTIONS.md) - Coding conventions and best practices

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting a PR.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

Built with intention.
