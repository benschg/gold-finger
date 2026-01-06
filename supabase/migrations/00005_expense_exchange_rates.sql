-- Add exchange rate columns to expenses table
-- These columns store the conversion data at the time of expense creation

ALTER TABLE public.expenses
  ADD COLUMN converted_amount DECIMAL(12, 2),
  ADD COLUMN exchange_rate DECIMAL(18, 10),
  ADD COLUMN account_currency TEXT REFERENCES public.currencies(code),
  ADD COLUMN rate_date DATE;

-- Index for queries filtering by account currency
CREATE INDEX idx_expenses_account_currency ON public.expenses(account_currency);

-- Add comments for documentation
COMMENT ON COLUMN public.expenses.converted_amount IS 'Amount converted to account currency (null if same currency)';
COMMENT ON COLUMN public.expenses.exchange_rate IS 'Exchange rate: 1 expense_currency = X account_currency';
COMMENT ON COLUMN public.expenses.account_currency IS 'Account default currency at time of expense creation';
COMMENT ON COLUMN public.expenses.rate_date IS 'Date the exchange rate was fetched from API';
