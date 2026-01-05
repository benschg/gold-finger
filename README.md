# Gold-Finger

A modern expense tracking application built with Next.js, Supabase, and AI-powered receipt analysis.

## Features

- **Expense Management**: Track spending with categories, tags, and receipt uploads
- **Multi-Currency Support**: Store expenses in any currency with automatic conversion
- **Shared Accounts**: Create private or shared accounts with partners/family
- **AI Receipt Analysis**: Upload receipts and automatically extract expense data using Google Gemini
- **Interactive Dashboard**: Visualize spending with charts and cross-filtering
- **OTP Authentication**: Secure passwordless login via Supabase

## Tech Stack

- **Frontend**: Next.js 16, TypeScript, Tailwind CSS 4
- **UI Components**: shadcn/ui, Lucide Icons, Recharts
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth (OTP/Magic Link)
- **AI**: Google Gemini API
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Supabase](https://supabase.com/) account
- [Google AI](https://ai.google.dev/) API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gold-finger.git
   cd gold-finger
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration.

4. Run database migrations:
   ```bash
   bun run db:migrate
   ```

5. Start the development server:
   ```bash
   bun dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Docker Development

```bash
docker-compose -f docker-compose.dev.yml up
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public marketing pages
│   ├── (auth)/             # Authentication pages
│   ├── (dashboard)/        # Protected dashboard
│   └── api/                # API routes
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Layout components
│   ├── dashboard/          # Dashboard components
│   ├── expenses/           # Expense management
│   └── accounts/           # Account management
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── gemini/             # Google AI client
│   └── hooks/              # Custom React hooks
├── types/                  # TypeScript types
└── store/                  # Zustand stores
```

## Testing

```bash
# Run unit tests
bun test

# Run E2E tests
bun test:e2e

# Run tests with coverage
bun test:coverage
```

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.
