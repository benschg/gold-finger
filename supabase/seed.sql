-- Gold-Finger Seed Data
-- Creates test users, accounts, categories, tags, and expenses for development
-- Run with: bun x supabase db reset (which runs migrations + seed)

-- ============================================
-- TEST USERS
-- In local dev, we create users directly in auth.users
-- Passwords are all "password123" (hashed)
-- ============================================

-- User 1: alice@example.com
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'alice@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"display_name": "Alice Johnson"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- User 2: bob@example.com
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'bob@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"display_name": "Bob Smith"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- User 3: charlie@example.com
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  aud,
  role
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'charlie@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  '{"display_name": "Charlie Brown"}'::jsonb,
  NOW(),
  NOW(),
  'authenticated',
  'authenticated'
);

-- ============================================
-- PROFILES (created automatically by trigger, but we insert manually for seed)
-- ============================================

INSERT INTO public.profiles (id, preferred_currency, theme, created_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'EUR', 'system', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'USD', 'dark', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'GBP', 'light', NOW());

-- ============================================
-- ACCOUNTS
-- ============================================

-- Alice's Personal Account
INSERT INTO public.accounts (id, name, description, currency, icon, color) VALUES
  ('aaaa1111-0000-0000-0000-000000000001', 'Alice Personal', 'Alice''s personal expenses', 'EUR', 'wallet', '#6366f1');

-- Bob's Personal Account
INSERT INTO public.accounts (id, name, description, currency, icon, color) VALUES
  ('bbbb2222-0000-0000-0000-000000000001', 'Bob Personal', 'Bob''s personal expenses', 'USD', 'wallet', '#22c55e');

-- Charlie's Personal Account
INSERT INTO public.accounts (id, name, description, currency, icon, color) VALUES
  ('cccc3333-0000-0000-0000-000000000001', 'Charlie Personal', 'Charlie''s personal expenses', 'GBP', 'wallet', '#f59e0b');

-- Shared Account: Alice & Bob (Household)
INSERT INTO public.accounts (id, name, description, currency, icon, color) VALUES
  ('abab1212-0000-0000-0000-000000000001', 'Household (Alice & Bob)', 'Shared household expenses', 'EUR', 'home', '#ec4899');

-- Shared Account: Alice & Charlie (Project)
INSERT INTO public.accounts (id, name, description, currency, icon, color) VALUES
  ('acac1313-0000-0000-0000-000000000001', 'Project Alpha', 'Shared project expenses with Charlie', 'EUR', 'briefcase', '#8b5cf6');

-- ============================================
-- ACCOUNT MEMBERS
-- ============================================

-- Alice's Personal (owner)
INSERT INTO public.account_members (account_id, user_id, role) VALUES
  ('aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner');

-- Bob's Personal (owner)
INSERT INTO public.account_members (account_id, user_id, role) VALUES
  ('bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'owner');

-- Charlie's Personal (owner)
INSERT INTO public.account_members (account_id, user_id, role) VALUES
  ('cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'owner');

-- Household: Alice (owner) & Bob (member)
INSERT INTO public.account_members (account_id, user_id, role) VALUES
  ('abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'member');

-- Project Alpha: Alice (owner) & Charlie (member)
INSERT INTO public.account_members (account_id, user_id, role) VALUES
  ('acac1313-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('acac1313-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'member');

-- ============================================
-- CATEGORIES (per account)
-- ============================================

-- Alice's Personal Categories
INSERT INTO public.categories (id, account_id, name, icon, color) VALUES
  ('cat-a1-food', 'aaaa1111-0000-0000-0000-000000000001', 'Food & Dining', 'utensils', '#ef4444'),
  ('cat-a1-transport', 'aaaa1111-0000-0000-0000-000000000001', 'Transportation', 'car', '#3b82f6'),
  ('cat-a1-shopping', 'aaaa1111-0000-0000-0000-000000000001', 'Shopping', 'shopping-bag', '#8b5cf6'),
  ('cat-a1-entertainment', 'aaaa1111-0000-0000-0000-000000000001', 'Entertainment', 'film', '#f59e0b'),
  ('cat-a1-health', 'aaaa1111-0000-0000-0000-000000000001', 'Health', 'heart-pulse', '#ec4899');

-- Bob's Personal Categories
INSERT INTO public.categories (id, account_id, name, icon, color) VALUES
  ('cat-b1-food', 'bbbb2222-0000-0000-0000-000000000001', 'Food', 'utensils', '#ef4444'),
  ('cat-b1-tech', 'bbbb2222-0000-0000-0000-000000000001', 'Tech & Gadgets', 'laptop', '#3b82f6'),
  ('cat-b1-sports', 'bbbb2222-0000-0000-0000-000000000001', 'Sports', 'dumbbell', '#22c55e'),
  ('cat-b1-subscriptions', 'bbbb2222-0000-0000-0000-000000000001', 'Subscriptions', 'credit-card', '#8b5cf6');

-- Charlie's Personal Categories
INSERT INTO public.categories (id, account_id, name, icon, color) VALUES
  ('cat-c1-food', 'cccc3333-0000-0000-0000-000000000001', 'Food & Drink', 'coffee', '#ef4444'),
  ('cat-c1-travel', 'cccc3333-0000-0000-0000-000000000001', 'Travel', 'plane', '#3b82f6'),
  ('cat-c1-books', 'cccc3333-0000-0000-0000-000000000001', 'Books & Learning', 'book-open', '#22c55e');

-- Household (Alice & Bob) Categories
INSERT INTO public.categories (id, account_id, name, icon, color) VALUES
  ('cat-ab-groceries', 'abab1212-0000-0000-0000-000000000001', 'Groceries', 'shopping-cart', '#22c55e'),
  ('cat-ab-utilities', 'abab1212-0000-0000-0000-000000000001', 'Utilities', 'zap', '#f59e0b'),
  ('cat-ab-rent', 'abab1212-0000-0000-0000-000000000001', 'Rent & Housing', 'home', '#6366f1'),
  ('cat-ab-entertainment', 'abab1212-0000-0000-0000-000000000001', 'Entertainment', 'tv', '#ec4899');

-- Project Alpha (Alice & Charlie) Categories
INSERT INTO public.categories (id, account_id, name, icon, color) VALUES
  ('cat-ac-software', 'acac1313-0000-0000-0000-000000000001', 'Software & Tools', 'code', '#3b82f6'),
  ('cat-ac-hosting', 'acac1313-0000-0000-0000-000000000001', 'Hosting & Cloud', 'cloud', '#8b5cf6'),
  ('cat-ac-marketing', 'acac1313-0000-0000-0000-000000000001', 'Marketing', 'megaphone', '#f59e0b');

-- ============================================
-- TAGS (per account)
-- ============================================

-- Alice's Personal Tags
INSERT INTO public.tags (id, account_id, name, color) VALUES
  ('tag-a1-urgent', 'aaaa1111-0000-0000-0000-000000000001', 'Urgent', '#ef4444'),
  ('tag-a1-recurring', 'aaaa1111-0000-0000-0000-000000000001', 'Recurring', '#3b82f6'),
  ('tag-a1-business', 'aaaa1111-0000-0000-0000-000000000001', 'Business', '#22c55e');

-- Bob's Personal Tags
INSERT INTO public.tags (id, account_id, name, color) VALUES
  ('tag-b1-personal', 'bbbb2222-0000-0000-0000-000000000001', 'Personal', '#6366f1'),
  ('tag-b1-work', 'bbbb2222-0000-0000-0000-000000000001', 'Work', '#f59e0b');

-- Charlie's Personal Tags
INSERT INTO public.tags (id, account_id, name, color) VALUES
  ('tag-c1-vacation', 'cccc3333-0000-0000-0000-000000000001', 'Vacation', '#ec4899'),
  ('tag-c1-education', 'cccc3333-0000-0000-0000-000000000001', 'Education', '#3b82f6');

-- Household Tags
INSERT INTO public.tags (id, account_id, name, color) VALUES
  ('tag-ab-weekly', 'abab1212-0000-0000-0000-000000000001', 'Weekly', '#22c55e'),
  ('tag-ab-monthly', 'abab1212-0000-0000-0000-000000000001', 'Monthly', '#8b5cf6'),
  ('tag-ab-essential', 'abab1212-0000-0000-0000-000000000001', 'Essential', '#ef4444');

-- Project Alpha Tags
INSERT INTO public.tags (id, account_id, name, color) VALUES
  ('tag-ac-mvp', 'acac1313-0000-0000-0000-000000000001', 'MVP', '#22c55e'),
  ('tag-ac-launch', 'acac1313-0000-0000-0000-000000000001', 'Launch', '#f59e0b');

-- ============================================
-- EXPENSES - Alice's Personal (20 expenses)
-- ============================================

INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  -- December 2024 (original 10)
  ('exp-a1-001', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-food', 45.50, 'EUR', 'Dinner at Italian restaurant', '2024-12-15', 'EUR'),
  ('exp-a1-002', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-food', 12.80, 'EUR', 'Lunch at work', '2024-12-16', 'EUR'),
  ('exp-a1-003', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-transport', 35.00, 'EUR', 'Monthly metro pass', '2024-12-01', 'EUR'),
  ('exp-a1-004', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-shopping', 89.99, 'EUR', 'Winter jacket', '2024-12-10', 'EUR'),
  ('exp-a1-005', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-entertainment', 15.99, 'EUR', 'Netflix subscription', '2024-12-01', 'EUR'),
  ('exp-a1-006', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-health', 25.00, 'EUR', 'Pharmacy - vitamins', '2024-12-18', 'EUR'),
  ('exp-a1-007', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-food', 8.50, 'EUR', 'Coffee and croissant', '2024-12-20', 'EUR'),
  ('exp-a1-008', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-shopping', 150.00, 'USD', 'Online electronics (US store)', '2024-12-22', 'EUR'),
  ('exp-a1-009', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-entertainment', 22.00, 'EUR', 'Cinema tickets', '2024-12-23', 'EUR'),
  ('exp-a1-010', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-food', 65.00, 'EUR', 'Christmas dinner supplies', '2024-12-24', 'EUR'),
  -- November 2024 (new 10)
  ('exp-a1-011', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-food', 38.00, 'EUR', 'Sushi restaurant', '2024-11-28', 'EUR'),
  ('exp-a1-012', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-transport', 35.00, 'EUR', 'Monthly metro pass', '2024-11-01', 'EUR'),
  ('exp-a1-013', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-shopping', 249.00, 'EUR', 'New winter boots', '2024-11-15', 'EUR'),
  ('exp-a1-014', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-entertainment', 15.99, 'EUR', 'Netflix subscription', '2024-11-01', 'EUR'),
  ('exp-a1-015', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-health', 45.00, 'EUR', 'Doctor visit copay', '2024-11-08', 'EUR'),
  ('exp-a1-016', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-food', 28.50, 'EUR', 'Birthday dinner', '2024-11-12', 'EUR'),
  ('exp-a1-017', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-shopping', 75.00, 'GBP', 'Online order from UK', '2024-11-20', 'EUR'),
  ('exp-a1-018', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-entertainment', 89.00, 'EUR', 'Concert tickets', '2024-11-22', 'EUR'),
  ('exp-a1-019', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-food', 15.00, 'EUR', 'Bakery - pastries', '2024-11-25', 'EUR'),
  ('exp-a1-020', 'aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-a1-health', 18.50, 'EUR', 'Pharmacy - cold medicine', '2024-11-30', 'EUR');

-- ============================================
-- EXPENSES - Bob's Personal (16 expenses)
-- ============================================

INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  -- December 2024 (original 8)
  ('exp-b1-001', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-food', 32.50, 'USD', 'Steakhouse dinner', '2024-12-14', 'USD'),
  ('exp-b1-002', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-tech', 299.00, 'USD', 'Wireless headphones', '2024-12-10', 'USD'),
  ('exp-b1-003', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-sports', 45.00, 'USD', 'Gym membership (monthly)', '2024-12-01', 'USD'),
  ('exp-b1-004', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-subscriptions', 14.99, 'USD', 'Spotify Premium', '2024-12-01', 'USD'),
  ('exp-b1-005', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-subscriptions', 9.99, 'USD', 'iCloud storage', '2024-12-05', 'USD'),
  ('exp-b1-006', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-food', 18.75, 'USD', 'Pizza delivery', '2024-12-17', 'USD'),
  ('exp-b1-007', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-tech', 79.99, 'USD', 'USB-C hub', '2024-12-19', 'USD'),
  ('exp-b1-008', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-sports', 65.00, 'USD', 'Running shoes', '2024-12-21', 'USD'),
  -- November 2024 (new 8)
  ('exp-b1-009', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-food', 45.00, 'USD', 'Thanksgiving dinner out', '2024-11-28', 'USD'),
  ('exp-b1-010', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-tech', 1299.00, 'USD', 'New laptop', '2024-11-29', 'USD'),
  ('exp-b1-011', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-sports', 45.00, 'USD', 'Gym membership (monthly)', '2024-11-01', 'USD'),
  ('exp-b1-012', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-subscriptions', 14.99, 'USD', 'Spotify Premium', '2024-11-01', 'USD'),
  ('exp-b1-013', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-food', 28.00, 'USD', 'Burger joint', '2024-11-10', 'USD'),
  ('exp-b1-014', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-tech', 49.99, 'USD', 'Mechanical keyboard', '2024-11-15', 'USD'),
  ('exp-b1-015', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-sports', 120.00, 'USD', 'Basketball shoes', '2024-11-18', 'USD'),
  ('exp-b1-016', 'bbbb2222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-b1-subscriptions', 9.99, 'USD', 'iCloud storage', '2024-11-05', 'USD');

-- ============================================
-- EXPENSES - Charlie's Personal (14 expenses)
-- ============================================

INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  -- December 2024 (original 7)
  ('exp-c1-001', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-food', 28.50, 'GBP', 'Pub lunch', '2024-12-12', 'GBP'),
  ('exp-c1-002', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-travel', 125.00, 'GBP', 'Train tickets to Edinburgh', '2024-12-08', 'GBP'),
  ('exp-c1-003', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-books', 45.99, 'GBP', 'Programming books', '2024-12-05', 'GBP'),
  ('exp-c1-004', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-food', 5.50, 'GBP', 'Coffee at Costa', '2024-12-15', 'GBP'),
  ('exp-c1-005', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-travel', 85.00, 'EUR', 'Eurostar to Paris', '2024-12-20', 'GBP'),
  ('exp-c1-006', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-books', 12.99, 'GBP', 'Kindle ebook', '2024-12-22', 'GBP'),
  ('exp-c1-007', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-food', 42.00, 'GBP', 'Christmas market food', '2024-12-23', 'GBP'),
  -- November 2024 (new 7)
  ('exp-c1-008', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-food', 35.00, 'GBP', 'Fish and chips dinner', '2024-11-25', 'GBP'),
  ('exp-c1-009', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-travel', 89.00, 'GBP', 'Train to Manchester', '2024-11-10', 'GBP'),
  ('exp-c1-010', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-books', 29.99, 'GBP', 'Design patterns book', '2024-11-05', 'GBP'),
  ('exp-c1-011', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-food', 4.20, 'GBP', 'Morning coffee', '2024-11-15', 'GBP'),
  ('exp-c1-012', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-travel', 250.00, 'EUR', 'Flight to Berlin', '2024-11-18', 'GBP'),
  ('exp-c1-013', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-books', 19.99, 'GBP', 'Audiobook subscription', '2024-11-01', 'GBP'),
  ('exp-c1-014', 'cccc3333-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-c1-food', 18.50, 'GBP', 'Cafe brunch', '2024-11-22', 'GBP');

-- ============================================
-- EXPENSES - Household (Alice & Bob) - 20 expenses
-- ============================================

-- December 2024 - Expenses by Alice (original 5)
INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  ('exp-ab-001', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-groceries', 85.40, 'EUR', 'Weekly groceries - Lidl', '2024-12-14', 'EUR'),
  ('exp-ab-002', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-utilities', 120.00, 'EUR', 'Electricity bill - December', '2024-12-10', 'EUR'),
  ('exp-ab-003', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-rent', 1200.00, 'EUR', 'Rent - December', '2024-12-01', 'EUR'),
  ('exp-ab-004', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-groceries', 42.30, 'EUR', 'Groceries - organic store', '2024-12-18', 'EUR'),
  ('exp-ab-005', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-entertainment', 49.99, 'EUR', 'Disney+ annual subscription', '2024-12-05', 'EUR');

-- December 2024 - Expenses by Bob (original 5)
INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  ('exp-ab-006', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-groceries', 67.80, 'EUR', 'Weekly groceries - Carrefour', '2024-12-21', 'EUR'),
  ('exp-ab-007', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-utilities', 45.00, 'EUR', 'Internet bill', '2024-12-15', 'EUR'),
  ('exp-ab-008', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-utilities', 35.00, 'EUR', 'Water bill', '2024-12-12', 'EUR'),
  ('exp-ab-009', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-entertainment', 18.99, 'EUR', 'HBO Max subscription', '2024-12-01', 'EUR'),
  ('exp-ab-010', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-groceries', 156.00, 'EUR', 'Christmas groceries', '2024-12-24', 'EUR');

-- November 2024 - Expenses by Alice (new 5)
INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  ('exp-ab-011', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-groceries', 92.50, 'EUR', 'Weekly groceries - Aldi', '2024-11-16', 'EUR'),
  ('exp-ab-012', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-utilities', 115.00, 'EUR', 'Electricity bill - November', '2024-11-10', 'EUR'),
  ('exp-ab-013', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-rent', 1200.00, 'EUR', 'Rent - November', '2024-11-01', 'EUR'),
  ('exp-ab-014', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-groceries', 38.90, 'EUR', 'Fresh vegetables market', '2024-11-20', 'EUR'),
  ('exp-ab-015', 'abab1212-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ab-entertainment', 29.99, 'EUR', 'Board games', '2024-11-25', 'EUR');

-- November 2024 - Expenses by Bob (new 5)
INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  ('exp-ab-016', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-groceries', 73.20, 'EUR', 'Weekly groceries - Tesco', '2024-11-23', 'EUR'),
  ('exp-ab-017', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-utilities', 45.00, 'EUR', 'Internet bill', '2024-11-15', 'EUR'),
  ('exp-ab-018', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-utilities', 32.00, 'EUR', 'Water bill', '2024-11-12', 'EUR'),
  ('exp-ab-019', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-entertainment', 18.99, 'EUR', 'HBO Max subscription', '2024-11-01', 'EUR'),
  ('exp-ab-020', 'abab1212-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'cat-ab-groceries', 89.00, 'EUR', 'Thanksgiving groceries', '2024-11-28', 'EUR');

-- ============================================
-- EXPENSES - Project Alpha (Alice & Charlie) - 16 expenses
-- ============================================

-- December 2024 - Expenses by Alice (original 4)
INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  ('exp-ac-001', 'acac1313-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ac-software', 99.00, 'USD', 'GitHub Team subscription', '2024-12-01', 'EUR'),
  ('exp-ac-002', 'acac1313-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ac-hosting', 50.00, 'USD', 'Vercel Pro plan', '2024-12-01', 'EUR'),
  ('exp-ac-003', 'acac1313-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ac-marketing', 200.00, 'EUR', 'Facebook ads campaign', '2024-12-10', 'EUR'),
  ('exp-ac-004', 'acac1313-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ac-software', 29.00, 'USD', 'Figma Pro monthly', '2024-12-05', 'EUR');

-- December 2024 - Expenses by Charlie (original 4)
INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  ('exp-ac-005', 'acac1313-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-ac-hosting', 25.00, 'USD', 'Supabase Pro plan', '2024-12-01', 'EUR'),
  ('exp-ac-006', 'acac1313-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-ac-software', 19.00, 'USD', 'Linear subscription', '2024-12-01', 'EUR'),
  ('exp-ac-007', 'acac1313-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-ac-marketing', 150.00, 'GBP', 'Google Ads campaign', '2024-12-15', 'EUR'),
  ('exp-ac-008', 'acac1313-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-ac-hosting', 12.00, 'USD', 'Domain renewal', '2024-12-20', 'EUR');

-- November 2024 - Expenses by Alice (new 4)
INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  ('exp-ac-009', 'acac1313-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ac-software', 99.00, 'USD', 'GitHub Team subscription', '2024-11-01', 'EUR'),
  ('exp-ac-010', 'acac1313-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ac-hosting', 50.00, 'USD', 'Vercel Pro plan', '2024-11-01', 'EUR'),
  ('exp-ac-011', 'acac1313-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ac-marketing', 350.00, 'EUR', 'Twitter/X ads campaign', '2024-11-15', 'EUR'),
  ('exp-ac-012', 'acac1313-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'cat-ac-software', 29.00, 'USD', 'Figma Pro monthly', '2024-11-05', 'EUR');

-- November 2024 - Expenses by Charlie (new 4)
INSERT INTO public.expenses (id, account_id, user_id, category_id, amount, currency, description, date, account_currency) VALUES
  ('exp-ac-013', 'acac1313-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-ac-hosting', 25.00, 'USD', 'Supabase Pro plan', '2024-11-01', 'EUR'),
  ('exp-ac-014', 'acac1313-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-ac-software', 19.00, 'USD', 'Linear subscription', '2024-11-01', 'EUR'),
  ('exp-ac-015', 'acac1313-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-ac-marketing', 100.00, 'GBP', 'LinkedIn ads campaign', '2024-11-20', 'EUR'),
  ('exp-ac-016', 'acac1313-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'cat-ac-hosting', 45.00, 'USD', 'AWS credits', '2024-11-10', 'EUR');

-- ============================================
-- EXPENSE TAGS (linking expenses to tags)
-- ============================================

-- Alice's Personal expense tags
INSERT INTO public.expense_tags (expense_id, tag_id) VALUES
  ('exp-a1-003', 'tag-a1-recurring'),
  ('exp-a1-005', 'tag-a1-recurring'),
  ('exp-a1-008', 'tag-a1-business'),
  ('exp-a1-012', 'tag-a1-recurring'),
  ('exp-a1-014', 'tag-a1-recurring'),
  ('exp-a1-017', 'tag-a1-business'),
  ('exp-a1-018', 'tag-a1-urgent');

-- Bob's Personal expense tags
INSERT INTO public.expense_tags (expense_id, tag_id) VALUES
  ('exp-b1-003', 'tag-b1-personal'),
  ('exp-b1-004', 'tag-b1-personal'),
  ('exp-b1-002', 'tag-b1-work'),
  ('exp-b1-010', 'tag-b1-work'),
  ('exp-b1-011', 'tag-b1-personal'),
  ('exp-b1-012', 'tag-b1-personal');

-- Charlie's Personal expense tags
INSERT INTO public.expense_tags (expense_id, tag_id) VALUES
  ('exp-c1-002', 'tag-c1-vacation'),
  ('exp-c1-003', 'tag-c1-education'),
  ('exp-c1-005', 'tag-c1-vacation'),
  ('exp-c1-009', 'tag-c1-vacation'),
  ('exp-c1-010', 'tag-c1-education'),
  ('exp-c1-012', 'tag-c1-vacation'),
  ('exp-c1-013', 'tag-c1-education');

-- Household expense tags
INSERT INTO public.expense_tags (expense_id, tag_id) VALUES
  ('exp-ab-001', 'tag-ab-weekly'),
  ('exp-ab-003', 'tag-ab-monthly'),
  ('exp-ab-003', 'tag-ab-essential'),
  ('exp-ab-002', 'tag-ab-monthly'),
  ('exp-ab-006', 'tag-ab-weekly'),
  ('exp-ab-010', 'tag-ab-essential'),
  ('exp-ab-011', 'tag-ab-weekly'),
  ('exp-ab-013', 'tag-ab-monthly'),
  ('exp-ab-013', 'tag-ab-essential'),
  ('exp-ab-012', 'tag-ab-monthly'),
  ('exp-ab-016', 'tag-ab-weekly'),
  ('exp-ab-020', 'tag-ab-essential');

-- Project Alpha expense tags
INSERT INTO public.expense_tags (expense_id, tag_id) VALUES
  ('exp-ac-001', 'tag-ac-mvp'),
  ('exp-ac-002', 'tag-ac-mvp'),
  ('exp-ac-003', 'tag-ac-launch'),
  ('exp-ac-007', 'tag-ac-launch'),
  ('exp-ac-009', 'tag-ac-mvp'),
  ('exp-ac-010', 'tag-ac-mvp'),
  ('exp-ac-011', 'tag-ac-launch'),
  ('exp-ac-015', 'tag-ac-launch');
