-- Gold-Finger Functions and Triggers
-- This migration creates all database functions and triggers

-- ============================================
-- FUNCTION: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON public.currencies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- FUNCTION: Handle new user signup
-- Creates profile (preferences only) and default personal account
-- NOTE: PII (email, display_name) stays in auth.users
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id UUID;
BEGIN
  -- Create profile (preferences only, no PII)
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  -- Create default personal account
  INSERT INTO public.accounts (name, description, icon)
  VALUES ('Personal', 'My personal expenses', 'user')
  RETURNING id INTO new_account_id;

  -- Add user as owner of personal account
  INSERT INTO public.account_members (account_id, user_id, role)
  VALUES (new_account_id, NEW.id, 'owner');

  -- Create default categories for the account
  INSERT INTO public.categories (account_id, name, icon, color) VALUES
    (new_account_id, 'Food & Dining', 'utensils', '#ef4444'),
    (new_account_id, 'Transportation', 'car', '#f97316'),
    (new_account_id, 'Shopping', 'shopping-bag', '#eab308'),
    (new_account_id, 'Entertainment', 'film', '#22c55e'),
    (new_account_id, 'Bills & Utilities', 'receipt', '#06b6d4'),
    (new_account_id, 'Healthcare', 'heart-pulse', '#8b5cf6'),
    (new_account_id, 'Travel', 'plane', '#ec4899'),
    (new_account_id, 'Other', 'ellipsis', '#6b7280');

  -- Create default tags for the account
  INSERT INTO public.tags (account_id, name, color) VALUES
    (new_account_id, 'Work', '#3b82f6'),
    (new_account_id, 'Personal', '#10b981'),
    (new_account_id, 'Vacation', '#f59e0b'),
    (new_account_id, 'Home', '#8b5cf6');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- FUNCTION: Create default categories for new account
-- ============================================
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name != 'Personal' THEN
    INSERT INTO public.categories (account_id, name, icon, color) VALUES
      (NEW.id, 'Food & Dining', 'utensils', '#ef4444'),
      (NEW.id, 'Transportation', 'car', '#f97316'),
      (NEW.id, 'Shopping', 'shopping-bag', '#eab308'),
      (NEW.id, 'Entertainment', 'film', '#22c55e'),
      (NEW.id, 'Bills & Utilities', 'receipt', '#06b6d4'),
      (NEW.id, 'Healthcare', 'heart-pulse', '#8b5cf6'),
      (NEW.id, 'Travel', 'plane', '#ec4899'),
      (NEW.id, 'Other', 'ellipsis', '#6b7280');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_account_created
  AFTER INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();

-- ============================================
-- FUNCTION: Accept invitation and join account
-- Gets email from auth.users, clears PII after acceptance
-- ============================================
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  inv RECORD;
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  SELECT * INTO inv FROM public.account_invitations
  WHERE id = invitation_id
    AND invitee_email = user_email
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.account_members (account_id, user_id, role)
  VALUES (inv.account_id, auth.uid(), 'member')
  ON CONFLICT (account_id, user_id) DO NOTHING;

  UPDATE public.account_invitations
  SET status = 'accepted', invitee_email = '[accepted]'
  WHERE id = invitation_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Decline invitation
-- Gets email from auth.users, clears PII after decline
-- ============================================
CREATE OR REPLACE FUNCTION public.decline_invitation(invitation_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();

  UPDATE public.account_invitations
  SET status = 'declined', invitee_email = '[declined]'
  WHERE id = invitation_id
    AND invitee_email = user_email
    AND status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Cleanup expired invitations (removes PII)
-- ============================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  cleaned INTEGER;
BEGIN
  UPDATE public.account_invitations
  SET status = 'expired', invitee_email = '[expired]'
  WHERE status = 'pending' AND expires_at < NOW();

  GET DIAGNOSTICS cleaned = ROW_COUNT;
  RETURN cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get expense statistics for an account
-- ============================================
CREATE OR REPLACE FUNCTION public.get_account_stats(account_uuid UUID)
RETURNS TABLE (
  total_expenses DECIMAL,
  expense_count BIGINT,
  avg_expense DECIMAL,
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
  FROM public.expenses
  WHERE account_id = account_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get expenses by category for an account
-- ============================================
CREATE OR REPLACE FUNCTION public.get_expenses_by_category(
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
  expense_count BIGINT,
  percentage DECIMAL
) AS $$
DECLARE
  total DECIMAL;
BEGIN
  IF NOT public.is_account_member(account_uuid) THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(amount), 1) INTO total
  FROM public.expenses
  WHERE account_id = account_uuid
    AND (start_date IS NULL OR date >= start_date)
    AND (end_date IS NULL OR date <= end_date);

  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.icon,
    c.color,
    COALESCE(SUM(e.amount), 0)::DECIMAL,
    COUNT(e.id)::BIGINT,
    (COALESCE(SUM(e.amount), 0) / total * 100)::DECIMAL
  FROM public.categories c
  LEFT JOIN public.expenses e ON e.category_id = c.id
    AND (start_date IS NULL OR e.date >= start_date)
    AND (end_date IS NULL OR e.date <= end_date)
  WHERE c.account_id = account_uuid
  GROUP BY c.id, c.name, c.icon, c.color
  ORDER BY 5 DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
