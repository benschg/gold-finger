-- Gold-Finger Income Summary Field
-- This migration adds a summary field to incomes and recurring_incomes tables

-- ============================================
-- ADD SUMMARY FIELD TO INCOMES
-- ============================================
ALTER TABLE public.incomes
  ADD COLUMN summary TEXT;

COMMENT ON COLUMN public.incomes.summary IS 'Short summary/title for the income';
COMMENT ON COLUMN public.incomes.description IS 'Longer description or notes about the income';

-- ============================================
-- ADD SUMMARY FIELD TO RECURRING_INCOMES
-- ============================================
ALTER TABLE public.recurring_incomes
  ADD COLUMN summary TEXT;

COMMENT ON COLUMN public.recurring_incomes.summary IS 'Short summary/title for the recurring income';
COMMENT ON COLUMN public.recurring_incomes.description IS 'Longer description or notes about the recurring income';
