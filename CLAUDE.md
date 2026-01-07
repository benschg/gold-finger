# Gold-Finger Project Guidelines

This document contains guidelines for AI assistants working on this project.

## Technology Stack

### Frontend

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: Zustand (for client state)
- **Forms**: React Hook Form + Zod validation

### Backend

- **Runtime**: Bun
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (OTP/Magic Link only - no passwords)
- **Storage**: Supabase Storage
- **AI**: Google Gemini API (for receipt analysis)

### Testing

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: V8 via Vitest

### DevOps

- **Package Manager**: Bun
- **Deployment**: Vercel
- **Local Dev**: Docker Compose (Supabase stack)
- **CI/CD**: GitHub Actions (planned)

## Development Workflow

### Before Making Changes

1. Run `bun install` to ensure dependencies are up to date
2. Run `bun run typecheck` to verify TypeScript
3. Run `bun test` to ensure existing tests pass

### After Making Changes

1. Run `bun run lint:fix` to fix linting issues
2. Run `bun run typecheck` to verify TypeScript
3. Run `bun test` to run unit tests
4. Run `bun test:e2e` for E2E tests (if touching UI)
5. Create atomic commits with clear messages

### Testing Requirements

- **Unit tests** for all utility functions and hooks
- **Integration tests** for API routes
- **E2E tests** for critical user flows (auth, expense CRUD)
- Maintain >80% code coverage for new code

## Security Guidelines

### PII Protection

- **Never store PII in public tables** - email, name stored in auth.users only
- `profiles` table contains only preferences (no PII)
- Invitation emails are temporary and cleared after resolution
- Use `auth.uid()` and `auth.users` for email lookups

### Row Level Security (RLS)

- All public tables have RLS enabled
- Use helper functions: `is_account_member()`, `is_account_owner()`
- Test RLS policies with different user contexts

### API Security

- Validate all inputs with Zod schemas
- Use Supabase service role only server-side
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- Rate limit sensitive endpoints

### Storage Security

- Receipts bucket is private (user folder structure)
- Avatars bucket is public
- Validate file types and sizes before upload

## Code Style

### File Organization

```
src/
├── app/           # Next.js routes
├── components/    # React components
│   ├── ui/        # shadcn/ui (don't modify)
│   └── [feature]/ # Feature components
├── lib/           # Utilities and clients
├── hooks/         # Custom React hooks
├── types/         # TypeScript types
└── store/         # Zustand stores
```

### Naming Conventions

- Components: PascalCase (`ExpenseForm.tsx`)
- Utilities: camelCase (`formatCurrency.ts`)
- Types: PascalCase with prefix (`TExpense`, `IAccount`)
- Database: snake_case (`account_members`)

### Component Guidelines

- Prefer Server Components where possible
- Use `"use client"` only when needed
- Extract loading states to `loading.tsx`
- Use Suspense boundaries for async data

## Database Schema Notes

### Core Entities

- `accounts` - Expense containers (private or shared)
- `account_members` - User-account relationships
- `expenses` - Individual expense records
- `categories` - Per-account expense categories
- `tags` - Per-account user-defined tags

### Key Relationships

- Users → Accounts (many-to-many via account_members)
- Accounts → Expenses (one-to-many)
- Expenses → Categories (many-to-one)
- Expenses → Tags (many-to-many via expense_tags)

## Common Tasks

### Adding a New API Route

1. Create route at `src/app/api/[resource]/route.ts`
2. Add Zod schema for request validation
3. Use `createServerClient()` for Supabase access
4. Handle errors with proper status codes
5. Add tests in `tests/unit/api/`

### Adding a New Component

1. Create in appropriate `src/components/[feature]/` folder
2. Use shadcn/ui primitives where possible
3. Add TypeScript props interface
4. Include loading and error states
5. Add unit tests with React Testing Library

### Modifying Database Schema

1. Create new migration in `supabase/migrations/`
2. Update RLS policies if needed
3. Regenerate types: `bun x supabase gen types typescript`
4. Update affected API routes and components
