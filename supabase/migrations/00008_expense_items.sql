-- Gold-Finger Expense Items
-- This migration adds line items support to expenses

-- ============================================
-- EXPENSE ITEMS TABLE
-- ============================================
CREATE TABLE public.expense_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(10, 3) DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.expense_items IS 'Line items within an expense - optional breakdown of what was purchased';
COMMENT ON COLUMN public.expense_items.category_id IS 'Optional category override - inherits from expense if null';
COMMENT ON COLUMN public.expense_items.total_price IS 'Computed: quantity * unit_price';

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_expense_items_expense ON public.expense_items(expense_id);
CREATE INDEX idx_expense_items_category ON public.expense_items(category_id);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (following expense_tags pattern)
-- ============================================
CREATE POLICY "Users can view expense items of their accounts"
  ON public.expense_items FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE public.is_account_member(account_id)
    )
  );

CREATE POLICY "Account members can create expense items"
  ON public.expense_items FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE public.is_account_member(account_id)
    )
  );

CREATE POLICY "Account members can update expense items"
  ON public.expense_items FOR UPDATE
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE public.is_account_member(account_id)
    )
  );

CREATE POLICY "Account members can delete expense items"
  ON public.expense_items FOR DELETE
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE public.is_account_member(account_id)
    )
  );

-- ============================================
-- ADD has_items FLAG TO EXPENSES (for query optimization)
-- ============================================
ALTER TABLE public.expenses
  ADD COLUMN has_items BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.expenses.has_items IS 'True if expense has line items - amount should equal sum of items';

-- ============================================
-- TRIGGER: Auto-update has_items flag
-- ============================================
CREATE OR REPLACE FUNCTION public.update_expense_has_items()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.expenses SET has_items = TRUE WHERE id = NEW.expense_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Check if any items remain
    UPDATE public.expenses
    SET has_items = EXISTS (
      SELECT 1 FROM public.expense_items WHERE expense_id = OLD.expense_id
    )
    WHERE id = OLD.expense_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE TRIGGER on_expense_item_change
  AFTER INSERT OR DELETE ON public.expense_items
  FOR EACH ROW EXECUTE FUNCTION public.update_expense_has_items();
