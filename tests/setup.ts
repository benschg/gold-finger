// Test setup file for Vitest
// This file runs before all tests

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

// Export test utilities
export const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  created_at: new Date().toISOString(),
};

export const mockAccount = {
  id: "test-account-id",
  name: "Test Account",
  currency: "EUR",
  icon: "wallet",
  color: "#6366f1",
};

export const mockExpense = {
  id: "test-expense-id",
  account_id: "test-account-id",
  user_id: "test-user-id",
  amount: 42.5,
  currency: "EUR",
  description: "Test expense",
  date: "2024-01-15",
  category_id: "test-category-id",
};

export const mockCategory = {
  id: "test-category-id",
  account_id: "test-account-id",
  name: "Food & Dining",
  icon: "utensils",
  color: "#ef4444",
};
