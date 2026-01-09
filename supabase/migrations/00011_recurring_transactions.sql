-- Gold-Finger Recurring Transactions
-- This migration adds recurring expense and income functionality

-- ============================================
-- RECURRING EXPENSES TABLE
-- ============================================
CREATE TABLE public.recurring_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,

  -- Amount (fixed single amount, no line items)
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR' REFERENCES public.currencies(code),

  -- Description fields
  summary TEXT,
  description TEXT,

  -- Recurrence configuration
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')),

  -- For custom frequency: interval and unit
  custom_interval INTEGER DEFAULT 1,
  custom_unit TEXT CHECK (custom_unit IS NULL OR custom_unit IN ('days', 'weeks', 'months', 'years')),

  -- Day-of-week selection (bitmask: 1=Sun, 2=Mon, 4=Tue, 8=Wed, 16=Thu, 32=Fri, 64=Sat)
  day_of_week_mask INTEGER DEFAULT 0,

  -- Day-of-month (1-31, or -1 for last day of month)
  day_of_month INTEGER CHECK (day_of_month IS NULL OR day_of_month = -1 OR (day_of_month >= 1 AND day_of_month <= 31)),

  -- Date boundaries
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,

  -- Tracking
  next_occurrence DATE NOT NULL,
  last_generated_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.recurring_expenses IS 'Templates for recurring expense transactions';

-- ============================================
-- RECURRING INCOMES TABLE
-- ============================================
CREATE TABLE public.recurring_incomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  income_category_id UUID REFERENCES public.income_categories(id) ON DELETE SET NULL,

  -- Amount
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR' REFERENCES public.currencies(code),

  -- Description
  description TEXT,

  -- Recurrence configuration (same as recurring_expenses)
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')),
  custom_interval INTEGER DEFAULT 1,
  custom_unit TEXT CHECK (custom_unit IS NULL OR custom_unit IN ('days', 'weeks', 'months', 'years')),
  day_of_week_mask INTEGER DEFAULT 0,
  day_of_month INTEGER CHECK (day_of_month IS NULL OR day_of_month = -1 OR (day_of_month >= 1 AND day_of_month <= 31)),

  -- Date boundaries
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,

  -- Tracking
  next_occurrence DATE NOT NULL,
  last_generated_date DATE,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.recurring_incomes IS 'Templates for recurring income transactions';

-- ============================================
-- ADD FK COLUMNS TO EXISTING TABLES
-- ============================================
ALTER TABLE public.expenses
ADD COLUMN recurring_expense_id UUID REFERENCES public.recurring_expenses(id) ON DELETE SET NULL;

ALTER TABLE public.incomes
ADD COLUMN recurring_income_id UUID REFERENCES public.recurring_incomes(id) ON DELETE SET NULL;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
-- Recurring expenses indexes
CREATE INDEX idx_recurring_expenses_account ON public.recurring_expenses(account_id);
CREATE INDEX idx_recurring_expenses_user ON public.recurring_expenses(user_id);
CREATE INDEX idx_recurring_expenses_category ON public.recurring_expenses(category_id);
CREATE INDEX idx_recurring_expenses_next_occurrence ON public.recurring_expenses(next_occurrence) WHERE is_active = TRUE;
CREATE INDEX idx_recurring_expenses_active ON public.recurring_expenses(is_active, next_occurrence);

-- Recurring incomes indexes
CREATE INDEX idx_recurring_incomes_account ON public.recurring_incomes(account_id);
CREATE INDEX idx_recurring_incomes_user ON public.recurring_incomes(user_id);
CREATE INDEX idx_recurring_incomes_category ON public.recurring_incomes(income_category_id);
CREATE INDEX idx_recurring_incomes_next_occurrence ON public.recurring_incomes(next_occurrence) WHERE is_active = TRUE;
CREATE INDEX idx_recurring_incomes_active ON public.recurring_incomes(is_active, next_occurrence);

-- Indexes for FK columns on existing tables
CREATE INDEX idx_expenses_recurring ON public.expenses(recurring_expense_id) WHERE recurring_expense_id IS NOT NULL;
CREATE INDEX idx_incomes_recurring ON public.incomes(recurring_income_id) WHERE recurring_income_id IS NOT NULL;

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_incomes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RECURRING EXPENSES POLICIES
-- ============================================
CREATE POLICY "Users can view recurring expenses of their accounts"
  ON public.recurring_expenses FOR SELECT
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can create recurring expenses"
  ON public.recurring_expenses FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_account_member(account_id)
  );

CREATE POLICY "Account members can update recurring expenses"
  ON public.recurring_expenses FOR UPDATE
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can delete recurring expenses"
  ON public.recurring_expenses FOR DELETE
  USING (public.is_account_member(account_id));

-- ============================================
-- RECURRING INCOMES POLICIES
-- ============================================
CREATE POLICY "Users can view recurring incomes of their accounts"
  ON public.recurring_incomes FOR SELECT
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can create recurring incomes"
  ON public.recurring_incomes FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_account_member(account_id)
  );

CREATE POLICY "Account members can update recurring incomes"
  ON public.recurring_incomes FOR UPDATE
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can delete recurring incomes"
  ON public.recurring_incomes FOR DELETE
  USING (public.is_account_member(account_id));

-- ============================================
-- TRIGGERS: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_recurring_incomes_updated_at
  BEFORE UPDATE ON public.recurring_incomes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
