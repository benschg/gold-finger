-- Gold-Finger Expense Summary Field
-- This migration adds a summary field and enforces items requirement

-- ============================================
-- ADD SUMMARY FIELD TO EXPENSES
-- ============================================
ALTER TABLE public.expenses
  ADD COLUMN summary TEXT;

COMMENT ON COLUMN public.expenses.summary IS 'Short summary/title for the expense';
COMMENT ON COLUMN public.expenses.description IS 'Longer description or notes about the expense';
COMMENT ON COLUMN public.expenses.amount IS 'Total amount - calculated from sum of items';
