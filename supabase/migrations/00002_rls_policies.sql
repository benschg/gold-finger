-- Gold-Finger Row Level Security Policies
-- This migration enables RLS and creates all security policies

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Check if user is member of account
-- ============================================
CREATE OR REPLACE FUNCTION public.is_account_member(account_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.account_members
    WHERE account_id = account_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Check if user is owner of account
-- ============================================
CREATE OR REPLACE FUNCTION public.is_account_owner(account_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.account_members
    WHERE account_id = account_uuid AND user_id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Get user email from auth.users
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_email(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CURRENCIES POLICIES (public read)
-- ============================================
CREATE POLICY "Currencies are viewable by everyone"
  ON public.currencies FOR SELECT
  USING (true);

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of account members"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT am2.user_id
      FROM public.account_members am1
      JOIN public.account_members am2 ON am1.account_id = am2.account_id
      WHERE am1.user_id = auth.uid()
    )
  );

-- ============================================
-- ACCOUNTS POLICIES
-- ============================================
CREATE POLICY "Users can view accounts they are members of"
  ON public.accounts FOR SELECT
  USING (public.is_account_member(id));

CREATE POLICY "Users can create accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Account owners can update their accounts"
  ON public.accounts FOR UPDATE
  USING (public.is_account_owner(id));

CREATE POLICY "Account owners can delete their accounts"
  ON public.accounts FOR DELETE
  USING (public.is_account_owner(id));

-- ============================================
-- ACCOUNT MEMBERS POLICIES
-- ============================================
CREATE POLICY "Users can view members of their accounts"
  ON public.account_members FOR SELECT
  USING (public.is_account_member(account_id));

CREATE POLICY "Users can insert themselves as members"
  ON public.account_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Account owners can manage members"
  ON public.account_members FOR DELETE
  USING (public.is_account_owner(account_id));

-- ============================================
-- ACCOUNT INVITATIONS POLICIES
-- Uses auth.users.email for comparison
-- ============================================
CREATE POLICY "Users can view invitations for their accounts"
  ON public.account_invitations FOR SELECT
  USING (
    public.is_account_member(account_id) OR
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Account owners can create invitations"
  ON public.account_invitations FOR INSERT
  WITH CHECK (
    inviter_id = auth.uid() AND
    public.is_account_owner(account_id)
  );

CREATE POLICY "Users can update invitations sent to them"
  ON public.account_invitations FOR UPDATE
  USING (
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Account owners can delete invitations"
  ON public.account_invitations FOR DELETE
  USING (public.is_account_owner(account_id));

-- ============================================
-- CATEGORIES POLICIES
-- ============================================
CREATE POLICY "Users can view categories of their accounts"
  ON public.categories FOR SELECT
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can create categories"
  ON public.categories FOR INSERT
  WITH CHECK (public.is_account_member(account_id));

CREATE POLICY "Account members can update categories"
  ON public.categories FOR UPDATE
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can delete categories"
  ON public.categories FOR DELETE
  USING (public.is_account_member(account_id));

-- ============================================
-- TAGS POLICIES
-- ============================================
CREATE POLICY "Users can view tags of their accounts"
  ON public.tags FOR SELECT
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can create tags"
  ON public.tags FOR INSERT
  WITH CHECK (public.is_account_member(account_id));

CREATE POLICY "Account members can update tags"
  ON public.tags FOR UPDATE
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can delete tags"
  ON public.tags FOR DELETE
  USING (public.is_account_member(account_id));

-- ============================================
-- EXPENSES POLICIES
-- ============================================
CREATE POLICY "Users can view expenses of their accounts"
  ON public.expenses FOR SELECT
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can create expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    public.is_account_member(account_id)
  );

CREATE POLICY "Account members can update expenses"
  ON public.expenses FOR UPDATE
  USING (public.is_account_member(account_id));

CREATE POLICY "Account members can delete expenses"
  ON public.expenses FOR DELETE
  USING (public.is_account_member(account_id));

-- ============================================
-- EXPENSE TAGS POLICIES
-- ============================================
CREATE POLICY "Users can view expense tags of their accounts"
  ON public.expense_tags FOR SELECT
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE public.is_account_member(account_id)
    )
  );

CREATE POLICY "Account members can manage expense tags"
  ON public.expense_tags FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE public.is_account_member(account_id)
    )
  );

CREATE POLICY "Account members can delete expense tags"
  ON public.expense_tags FOR DELETE
  USING (
    expense_id IN (
      SELECT id FROM public.expenses
      WHERE public.is_account_member(account_id)
    )
  );
