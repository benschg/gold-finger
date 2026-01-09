// Database types for Supabase

export type Currency = "EUR" | "USD" | "GBP" | "CHF" | "JPY" | "CAD" | "AUD";

export interface Profile {
  id: string;
  avatar_url: string | null;
  preferred_currency: Currency;
  theme: "light" | "dark" | "system";
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  icon: string;
  color: string;
  currency: Currency;
  created_at: string;
  updated_at: string;
}

export type AccountRole = "owner" | "member";

export interface AccountMember {
  account_id: string;
  user_id: string;
  role: AccountRole;
  joined_at: string;
}

export interface AccountWithRole extends Account {
  role: AccountRole;
}

export interface AccountInvitation {
  id: string;
  account_id: string;
  email: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
}

export interface Category {
  id: string;
  account_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Tag {
  id: string;
  account_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Expense {
  id: string;
  account_id: string;
  user_id: string;
  amount: number;
  currency: Currency;
  summary: string | null;
  description: string | null;
  date: string;
  category_id: string | null;
  receipt_url: string | null;
  has_items: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpenseItem {
  id: string;
  expense_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface ExpenseItemWithCategory extends ExpenseItem {
  category: Category | null;
}

export interface ExpenseTag {
  expense_id: string;
  tag_id: string;
}

export interface CurrencyRate {
  code: Currency;
  name: string;
  symbol: string;
  rate_to_eur: number;
  updated_at: string;
}

// Extended types with relations
export interface ExpenseWithCategory extends Expense {
  category: Category | null;
}

export interface ExpenseWithTags extends Expense {
  tags: Tag[];
}

export interface ExpenseWithDetails extends Expense {
  category: Category | null;
  tags: Tag[];
}

export interface ExpenseWithItems extends ExpenseWithDetails {
  items: ExpenseItemWithCategory[];
}

export interface AccountWithMembers extends Account {
  members: (AccountMember & {
    email?: string;
  })[];
}

// Form types
export interface CreateExpenseItemInput {
  name: string;
  quantity?: number;
  unit_price: number;
  category_id?: string | null;
  sort_order?: number;
}

export interface UpdateExpenseItemInput {
  id?: string;
  name?: string;
  quantity?: number;
  unit_price?: number;
  category_id?: string | null;
  sort_order?: number;
}

export interface CreateExpenseInput {
  account_id: string;
  currency: Currency;
  summary?: string;
  description?: string;
  date: string;
  category_id?: string;
  tag_ids?: string[];
  receipt_url?: string | null;
  items: CreateExpenseItemInput[];
}

export interface UpdateExpenseInput {
  currency?: Currency;
  summary?: string;
  description?: string;
  date?: string;
  category_id?: string | null;
  tag_ids?: string[];
  receipt_url?: string | null;
  items?: UpdateExpenseItemInput[];
}

export interface CreateCategoryInput {
  account_id: string;
  name: string;
  icon: string;
  color: string;
}

export interface CreateTagInput {
  account_id: string;
  name: string;
  color: string;
}

export interface CreateAccountInput {
  name: string;
  icon?: string;
  color?: string;
  currency?: Currency;
}

// ============================================
// INCOME TYPES
// ============================================

export interface IncomeCategory {
  id: string;
  account_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface Income {
  id: string;
  account_id: string;
  user_id: string;
  amount: number;
  currency: Currency;
  description: string | null;
  date: string;
  income_category_id: string | null;
  receipt_url: string | null;
  converted_amount: number | null;
  exchange_rate: number | null;
  account_currency: string | null;
  rate_date: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface IncomeWithCategory extends Income {
  income_category: IncomeCategory | null;
}

// Form types
export interface CreateIncomeInput {
  account_id: string;
  amount: number;
  currency: Currency;
  description?: string;
  date: string;
  income_category_id?: string;
  receipt_url?: string | null;
}

export interface UpdateIncomeInput {
  amount?: number;
  currency?: Currency;
  description?: string;
  date?: string;
  income_category_id?: string | null;
  receipt_url?: string | null;
}

export interface CreateIncomeCategoryInput {
  account_id: string;
  name: string;
  icon: string;
  color: string;
}
