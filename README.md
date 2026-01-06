# Gold-Finger

A modern, self-hostable expense tracking application built with Next.js, Supabase, and AI-powered receipt analysis. Track expenses, manage multiple accounts, and get insights into your spending patterns.

## Features

### Core Features
- **Expense Management**: Track spending with categories, tags, and receipt uploads
- **Multi-Currency Support**: Store expenses in any currency with real-time exchange rate conversion (powered by ECB data via Frankfurter API)
- **Shared Accounts**: Create private or shared accounts with partners, family, or roommates
- **AI Receipt Analysis**: Upload receipts and automatically extract expense data using Google Gemini
- **Interactive Dashboard**: Visualize spending with charts, filters, and cross-account analytics

### Security
- **Passwordless Authentication**: Secure OTP/Magic Link login via Supabase Auth
- **Row-Level Security**: All data protected with PostgreSQL RLS policies
- **No PII in Public Tables**: Email and personal data stored only in auth.users

### User Experience
- **Dark/Light Mode**: Full theme support with system preference detection
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Offline-Ready**: Service worker support for PWA capabilities
- **Real-time Updates**: Live sync across devices using Supabase Realtime

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS 4 |
| **UI Components** | shadcn/ui, Radix UI, Lucide Icons |
| **Charts** | Recharts |
| **State** | Zustand, React Hook Form |
| **Validation** | Zod |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL (Supabase) |
| **Auth** | Supabase Auth (OTP/Magic Link) |
| **Storage** | Supabase Storage |
| **AI** | Google Gemini API |
| **Exchange Rates** | Frankfurter API (ECB data) |
| **Runtime** | Bun |
| **Testing** | Vitest, React Testing Library, Playwright |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Docker](https://www.docker.com/) (for local Supabase)
- [Google AI](https://ai.google.dev/) API key (for receipt analysis)

### Quick Start (Local Development)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gold-finger.git
   cd gold-finger
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Start Supabase locally**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   For local development, use these values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54331
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
   GOOGLE_AI_API_KEY=your-gemini-api-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

5. **Run database migrations**
   ```bash
   bun run db:migrate
   ```

6. **Start the development server**
   ```bash
   bun dev
   ```

7. **Open the app**
   - App: [http://localhost:3000](http://localhost:3000)
   - Supabase Studio: [http://localhost:54333](http://localhost:54333)
   - Email Testing (Inbucket): [http://localhost:54334](http://localhost:54334)

### Using Hosted Supabase

For production or if you prefer not to run Docker locally:

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migrations from `supabase/migrations/` in the SQL editor
3. Update `.env.local` with your project's URL and keys

## Project Structure

```
gold-finger/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (marketing)/        # Public landing pages
│   │   ├── (auth)/             # Login, signup, verify
│   │   ├── (dashboard)/        # Protected app routes
│   │   │   ├── dashboard/      # Main dashboard
│   │   │   ├── expenses/       # Expense management
│   │   │   ├── accounts/       # Account management
│   │   │   └── settings/       # User settings
│   │   └── api/                # API routes
│   │       ├── expenses/       # CRUD operations
│   │       ├── accounts/       # Account management
│   │       ├── exchange-rates/ # Currency conversion
│   │       └── ai/             # Receipt analysis
│   ├── components/
│   │   ├── ui/                 # shadcn/ui (don't modify)
│   │   ├── layout/             # Header, sidebar, navigation
│   │   ├── dashboard/          # Charts, stats, widgets
│   │   ├── expenses/           # Expense form, list, filters
│   │   └── accounts/           # Account dialogs, selectors
│   ├── lib/
│   │   ├── supabase/           # Supabase client setup
│   │   ├── validations/        # Zod schemas
│   │   ├── exchange-rates.ts   # Currency conversion
│   │   └── utils.ts            # Shared utilities
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript types
│   └── store/                  # Zustand stores
├── supabase/
│   ├── migrations/             # Database migrations
│   └── kong.yml                # API gateway config
├── tests/
│   ├── unit/                   # Vitest unit tests
│   └── e2e/                    # Playwright E2E tests
└── scripts/
    └── setup-pi.sh             # Raspberry Pi setup
```

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `accounts` | Expense containers (private/shared) |
| `account_members` | User-account relationships with roles |
| `expenses` | Individual expense records |
| `categories` | Per-account expense categories |
| `tags` | Per-account user-defined tags |
| `expense_tags` | Many-to-many expense-tag relations |
| `currencies` | Supported currency codes |
| `profiles` | User preferences (no PII) |
| `account_invitations` | Pending account invites |

### Key Features
- **Row-Level Security**: All tables protected with RLS policies
- **Soft Deletes**: Expenses use `deleted_at` for recovery
- **Audit Fields**: `created_at`, `updated_at` on all tables
- **Exchange Rate Storage**: Historical rates stored with expenses

## API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/expenses` | GET, POST | List and create expenses |
| `/api/expenses/[id]` | GET, PUT, DELETE | Manage single expense |
| `/api/accounts` | GET, POST | List and create accounts |
| `/api/accounts/[id]` | GET, PUT, DELETE | Manage single account |
| `/api/accounts/[id]/members` | GET, POST, DELETE | Manage account members |
| `/api/exchange-rates` | GET | Get current exchange rate |
| `/api/exchange-rates/history` | GET | Get historical rates |
| `/api/ai/analyze-receipt` | POST | AI receipt analysis |
| `/api/categories` | GET, POST | Manage categories |
| `/api/tags` | GET, POST | Manage tags |

## Testing

```bash
# Run all unit tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test:coverage

# Run E2E tests
bun test:e2e

# Run E2E tests with UI
bun test:e2e:ui

# Type checking
bun run typecheck

# Linting
bun run lint
bun run lint:fix
```

### Test Coverage

| Area | Tests |
|------|-------|
| Exchange Rates Utility | 14 tests |
| useExchangeRate Hook | 9 tests |
| ExchangeRateDisplay Component | 8 tests |
| Exchange Rate API | 9 tests |
| Exchange Rate History API | 7 tests |
| Other Components | 57+ tests |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Docker

```bash
# Build production image
docker build -t gold-finger .

# Run container
docker run -p 3000:3000 --env-file .env.local gold-finger
```

### Raspberry Pi

Gold-Finger can run on a Raspberry Pi 4/5 for self-hosted home use.

#### Requirements
- Raspberry Pi 4 or 5
- 4GB RAM minimum (8GB recommended)
- 64-bit Raspberry Pi OS
- 16GB+ SD card or SSD

#### Automated Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/gold-finger.git
cd gold-finger

# Run the setup script
chmod +x scripts/setup-pi.sh
./scripts/setup-pi.sh
```

The script will:
- Check system requirements
- Install Bun, Docker, and dependencies
- Configure swap for better performance
- Build the application
- Optionally create a systemd service for auto-start

#### Manual Setup

1. **Install Bun**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

3. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/gold-finger.git
   cd gold-finger
   bun install
   ```

4. **Start the lightweight Supabase stack**
   ```bash
   docker compose -f docker-compose.pi.yml up -d
   ```

5. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit with local Supabase values (same as Quick Start)
   ```

6. **Build and run**
   ```bash
   bun run build
   bun start
   ```

#### Pi Memory Configurations

| RAM | Configuration |
|-----|---------------|
| 4GB | Use `docker-compose.pi.yml` (no Studio, no imgproxy) |
| 8GB | Can use full `docker-compose.dev.yml` |

#### Using Hosted Supabase on Pi

For 4GB Pi or simpler setup, use hosted Supabase:

1. Create project at [supabase.com](https://supabase.com) (free tier available)
2. Update `.env.local` with your project credentials
3. Skip Docker entirely, just run:
   ```bash
   bun run build
   bun start
   ```

#### Auto-Start on Boot

```bash
# Enable the service (created by setup script)
sudo systemctl enable gold-finger
sudo systemctl start gold-finger

# Check status
sudo systemctl status gold-finger

# View logs
journalctl -u gold-finger -f
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server only) |
| `GOOGLE_AI_API_KEY` | Yes | Google Gemini API key |
| `NEXT_PUBLIC_APP_URL` | Yes | Application URL |
| `NEXT_PUBLIC_APP_NAME` | No | App name (default: Gold-Finger) |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `bun test && bun run typecheck`
5. Commit: `git commit -m "Add my feature"`
6. Push: `git push origin feature/my-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use shadcn/ui components where possible
- Add tests for new features
- Keep components small and focused
- Use Zod for all API validation

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Frankfurter API](https://frankfurter.dev) - Exchange rate data (ECB)
- [Google Gemini](https://ai.google.dev) - AI receipt analysis
