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
  created_at: string;
  updated_at: string;
}

export interface AccountMember {
  account_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
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
  description: string | null;
  date: string;
  category_id: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
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

export interface AccountWithMembers extends Account {
  members: (AccountMember & {
    email?: string;
  })[];
}

// Form types
export interface CreateExpenseInput {
  account_id: string;
  amount: number;
  currency: Currency;
  description?: string;
  date: string;
  category_id?: string;
  tag_ids?: string[];
  receipt_url?: string | null;
}

export interface UpdateExpenseInput {
  amount?: number;
  currency?: Currency;
  description?: string;
  date?: string;
  category_id?: string | null;
  tag_ids?: string[];
  receipt_url?: string | null;
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
}
