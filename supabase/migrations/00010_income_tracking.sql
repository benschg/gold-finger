-- Gold-Finger Income Tracking
-- This migration adds income tracking functionality with separate income categories

-- ============================================
-- INCOME CATEGORIES TABLE
-- ============================================
CREATE TABLE public.income_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#22c55e',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, name)
);

COMMENT ON TABLE public.income_categories IS 'Income categories per account (Salary, Freelance, etc.)';

-- ============================================
-- INCOMES TABLE
-- ============================================
CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  income_category_id UUID REFERENCES public.income_categories(id) ON DELETE SET NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR' REFERENCES public.currencies(code),
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  -- Exchange rate fields (same pattern as expenses)
  converted_amount DECIMAL(12, 2),
  exchange_rate DECIMAL(18, 10),
  account_currency TEXT REFERENCES public.currencies(code),
  rate_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.incomes IS 'Income records';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_income_categories_account ON public.income_categories(account_id);
CREATE INDEX idx_incomes_account ON public.incomes(account_id);
CREATE INDEX idx_incomes_user ON public.incomes(user_id);
CREATE INDEX idx_incomes_category ON public.incomes(income_category_id);
CREATE INDEX idx_incomes_date ON public.incomes(date DESC);
CREATE INDEX idx_incomes_account_date ON public.incomes(account_id, date DESC);
CREATE INDEX idx_incomes_account_currency ON public.incomes(account_currency);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INCOME CATEGORIES POLICIES
-- ============================================
CREATE POLICY "Users can view income categories of their accounts"
  ON public.income_categories FOR SELECT
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can create income categories"
  ON public.income_categories FOR INSERT
  WITH CHECK (public.is_account_member(account_id));

CREATE POLICY "Account members can update income categories"
  ON public.income_categories FOR UPDATE
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can delete income categories"
  ON public.income_categories FOR DELETE
  USING (public.is_account_member(account_id));

-- ============================================
-- INCOMES POLICIES
-- ============================================
CREATE POLICY "Users can view incomes of their accounts"
  ON public.incomes FOR SELECT
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can create incomes"
  ON public.incomes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_account_member(account_id)
  );

CREATE POLICY "Account members can update incomes"
  ON public.incomes FOR UPDATE
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can delete incomes"
  ON public.incomes FOR DELETE
  USING (public.is_account_member(account_id));

-- ============================================
-- TRIGGER: Auto-update updated_at for incomes
-- ============================================
CREATE TRIGGER update_incomes_updated_at
  BEFORE UPDATE ON public.incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- FUNCTION: Create default income categories for new account
-- ============================================
CREATE OR REPLACE FUNCTION public.create_default_income_categories()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.income_categories (account_id, name, icon, color) VALUES
    (NEW.id, 'Salary', 'briefcase', '#22c55e'),
    (NEW.id, 'Freelance', 'laptop', '#10b981'),
    (NEW.id, 'Investments', 'trending-up', '#06b6d4'),
    (NEW.id, 'Rental Income', 'home', '#8b5cf6'),
    (NEW.id, 'Gifts', 'gift', '#ec4899'),
    (NEW.id, 'Refunds', 'rotate-ccw', '#f59e0b'),
    (NEW.id, 'Other Income', 'ellipsis', '#6b7280');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER on_account_created_income_categories
  AFTER INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.create_default_income_categories();

-- ============================================
-- UPDATE handle_new_user() to also create income categories
-- for the Personal account (already created by trigger above,
-- but we need to backfill for existing accounts)
-- ============================================

-- Backfill: Add default income categories for existing accounts that don't have any
INSERT INTO public.income_categories (account_id, name, icon, color)
SELECT a.id, cat.name, cat.icon, cat.color
FROM public.accounts a
CROSS JOIN (
  VALUES
    ('Salary', 'briefcase', '#22c55e'),
    ('Freelance', 'laptop', '#10b981'),
    ('Investments', 'trending-up', '#06b6d4'),
    ('Rental Income', 'home', '#8b5cf6'),
    ('Gifts', 'gift', '#ec4899'),
    ('Refunds', 'rotate-ccw', '#f59e0b'),
    ('Other Income', 'ellipsis', '#6b7280')
) AS cat(name, icon, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.income_categories ic
  WHERE ic.account_id = a.id
);

-- ============================================
-- FUNCTION: Get income statistics for an account
-- ============================================
CREATE OR REPLACE FUNCTION public.get_account_income_stats(account_uuid UUID)
RETURNS TABLE (
  total_income DECIMAL,
  income_count BIGINT,
  avg_income DECIMAL,
  current_month_total DECIMAL,
  previous_month_total DECIMAL
) AS $$
BEGIN
  IF NOT public.is_account_member(account_uuid) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(amount), 0)::DECIMAL,
    COUNT(*)::BIGINT,
    COALESCE(AVG(amount), 0)::DECIMAL,
    COALESCE(SUM(CASE
      WHEN date_trunc('month', date) = date_trunc('month', CURRENT_DATE)
      THEN amount ELSE 0
    END), 0)::DECIMAL,
    COALESCE(SUM(CASE
      WHEN date_trunc('month', date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
      THEN amount ELSE 0
    END), 0)::DECIMAL
  FROM public.incomes
  WHERE account_id = account_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- FUNCTION: Get incomes by category for an account
-- ============================================
CREATE OR REPLACE FUNCTION public.get_incomes_by_category(
  account_uuid UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  category_icon TEXT,
  category_color TEXT,
  total_amount DECIMAL,
  income_count BIGINT,
  percentage DECIMAL
) AS $$
DECLARE
  total DECIMAL;
BEGIN
  IF NOT public.is_account_member(account_uuid) THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(amount), 1) INTO total
  FROM public.incomes
  WHERE account_id = account_uuid
    AND (start_date IS NULL OR date >= start_date)
    AND (end_date IS NULL OR date <= end_date);

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.icon,
    c.color,
    COALESCE(SUM(i.amount), 0)::DECIMAL,
    COUNT(i.id)::BIGINT,
    (COALESCE(SUM(i.amount), 0) / total * 100)::DECIMAL
  FROM public.income_categories c
  LEFT JOIN public.incomes i ON i.income_category_id = c.id
    AND (start_date IS NULL OR i.date >= start_date)
    AND (end_date IS NULL OR i.date <= end_date)
  WHERE c.account_id = account_uuid
  GROUP BY c.id, c.name, c.icon, c.color
  ORDER BY 5 DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
