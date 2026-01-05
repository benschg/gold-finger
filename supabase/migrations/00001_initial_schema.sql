-- Gold-Finger Initial Schema
-- This migration creates all core tables for the expense tracking application
-- NOTE: All PII (email, name) is stored in auth.users, not in public tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- NOTE: PII (email, display_name) stored in auth.users.raw_user_meta_data
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  preferred_currency TEXT DEFAULT 'EUR',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User preferences only - PII stored in auth.users';

-- ============================================
-- ACCOUNTS TABLE (Core entity for expenses)
-- ============================================
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  currency TEXT DEFAULT 'EUR',
  icon TEXT DEFAULT 'wallet',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.accounts IS 'Expense accounts - can be private or shared';

-- ============================================
-- ACCOUNT MEMBERS TABLE
-- ============================================
CREATE TABLE public.account_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);

COMMENT ON TABLE public.account_members IS 'Links users to accounts with roles';

-- ============================================
-- ACCOUNT INVITATIONS TABLE
-- NOTE: invitee_email is temporary PII - deleted after invitation is resolved
-- ============================================
CREATE TABLE public.account_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

COMMENT ON TABLE public.account_invitations IS 'Pending invitations - email deleted after resolution';

-- ============================================
-- CURRENCIES TABLE
-- ============================================
CREATE TABLE public.currencies (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  exchange_rate DECIMAL(12, 6) DEFAULT 1.0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.currencies IS 'Supported currencies with exchange rates';

-- Insert common currencies
INSERT INTO public.currencies (code, name, symbol, exchange_rate) VALUES
  ('EUR', 'Euro', '€', 1.0),
  ('USD', 'US Dollar', '$', 1.08),
  ('GBP', 'British Pound', '£', 0.86),
  ('CHF', 'Swiss Franc', 'CHF', 0.94),
  ('JPY', 'Japanese Yen', '¥', 162.5),
  ('CAD', 'Canadian Dollar', 'CA$', 1.47),
  ('AUD', 'Australian Dollar', 'A$', 1.65),
  ('CNY', 'Chinese Yuan', '¥', 7.85);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, name)
);

COMMENT ON TABLE public.categories IS 'Expense categories per account';

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#94a3b8',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, name)
);

COMMENT ON TABLE public.tags IS 'User-defined tags for expenses (vacation, work, home, etc.)';

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR' REFERENCES public.currencies(code),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  receipt_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.expenses IS 'Main expense records';

-- ============================================
-- EXPENSE TAGS JUNCTION TABLE
-- ============================================
CREATE TABLE public.expense_tags (
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (expense_id, tag_id)
);

COMMENT ON TABLE public.expense_tags IS 'Many-to-many relationship between expenses and tags';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Account members indexes
CREATE INDEX idx_account_members_user ON public.account_members(user_id);
CREATE INDEX idx_account_members_account ON public.account_members(account_id);

-- Account invitations indexes
CREATE INDEX idx_account_invitations_email ON public.account_invitations(invitee_email);
CREATE INDEX idx_account_invitations_account ON public.account_invitations(account_id);

-- Categories indexes
CREATE INDEX idx_categories_account ON public.categories(account_id);

-- Tags indexes
CREATE INDEX idx_tags_account ON public.tags(account_id);

-- Expenses indexes
CREATE INDEX idx_expenses_account ON public.expenses(account_id);
CREATE INDEX idx_expenses_user ON public.expenses(user_id);
CREATE INDEX idx_expenses_category ON public.expenses(category_id);
CREATE INDEX idx_expenses_date ON public.expenses(date DESC);
CREATE INDEX idx_expenses_account_date ON public.expenses(account_id, date DESC);

-- Expense tags indexes
CREATE INDEX idx_expense_tags_expense ON public.expense_tags(expense_id);
CREATE INDEX idx_expense_tags_tag ON public.expense_tags(tag_id);
