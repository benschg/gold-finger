import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test-utils";
import { ExpenseForm } from "@/components/expenses/expense-form";
import type {
  Account,
  ExpenseWithDetails,
  Category,
  Tag,
} from "@/types/database";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockAccounts: Account[] = [
  {
    id: "account-1",
    name: "Personal",
    currency: "EUR",
    icon: "wallet",
    color: "#6366f1",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
  {
    id: "account-2",
    name: "Business",
    currency: "USD",
    icon: "briefcase",
    color: "#22c55e",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  },
];

const mockCategories: Category[] = [
  {
    id: "cat-1",
    account_id: "account-1",
    name: "Food",
    icon: "utensils",
    color: "#ef4444",
    created_at: "2024-01-01",
  },
];

const mockTags: Tag[] = [
  {
    id: "tag-1",
    account_id: "account-1",
    name: "Groceries",
    color: "#3b82f6",
    created_at: "2024-01-01",
  },
];

const createMockExpense = (
  overrides: Partial<ExpenseWithDetails> = {},
): ExpenseWithDetails => ({
  id: "expense-1",
  account_id: "account-1",
  user_id: "user-1",
  amount: 50,
  currency: "EUR",
  summary: null,
  description: "Existing expense",
  date: "2024-01-15",
  category_id: "cat-1",
  created_at: "2024-01-15",
  updated_at: "2024-01-15",
  receipt_url: null,
  has_items: false,
  category: mockCategories[0],
  tags: [],
  ...overrides,
});

describe("ExpenseForm", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "new-expense-id" }),
    });
  });

  describe("Rendering", () => {
    it("should render the form with basic fields", () => {
      const { container } = renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
        />,
      );

      // Form should exist
      expect(container.querySelector("form")).toBeInTheDocument();
      // Amount input should exist
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
      // Description input should exist
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      // Date input should exist
      expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    });

    it("should show account selector when multiple accounts exist", () => {
      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
        />,
      );

      expect(screen.getByLabelText(/account/i)).toBeInTheDocument();
    });

    it("should hide account selector when only one account exists", () => {
      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={[mockAccounts[0]]}
          categories={mockCategories}
          tags={mockTags}
        />,
      );

      expect(screen.queryByLabelText(/account/i)).not.toBeInTheDocument();
    });

    it("should show Add & New button when onAddAnother is provided", () => {
      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          onAddAnother={vi.fn()}
        />,
      );

      expect(
        screen.getByRole("button", { name: /add & new/i }),
      ).toBeInTheDocument();
    });

    it("should not show Add & New button when onAddAnother is not provided", () => {
      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /add & new/i }),
      ).not.toBeInTheDocument();
    });

    it("should not show Add & New button when editing an expense", () => {
      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          expense={createMockExpense()}
          onAddAnother={vi.fn()}
        />,
      );

      expect(
        screen.queryByRole("button", { name: /add & new/i }),
      ).not.toBeInTheDocument();
    });

    it("should show Cancel button when onCancel is provided", () => {
      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          onCancel={vi.fn()}
        />,
      );

      expect(
        screen.getByRole("button", { name: /cancel/i }),
      ).toBeInTheDocument();
    });

    it("should show Update button when editing", () => {
      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          expense={createMockExpense()}
        />,
      );

      expect(
        screen.getByRole("button", { name: /update expense/i }),
      ).toBeInTheDocument();
    });

    it("should render tags when available", () => {
      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
        />,
      );

      expect(screen.getByText("Groceries")).toBeInTheDocument();
    });
  });

  describe("Form Submission", () => {
    it("should call onSuccess when form is submitted", async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();

      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          onSuccess={mockOnSuccess}
        />,
      );

      // Fill in required fields
      await user.type(screen.getByLabelText(/amount/i), "25.50");

      // Submit the form
      await user.click(screen.getByRole("button", { name: /add expense/i }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should submit expense to the correct API endpoint", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          onSuccess={vi.fn()}
        />,
      );

      // Fill in required fields
      await user.type(screen.getByLabelText(/amount/i), "100");

      // Submit
      await user.click(screen.getByRole("button", { name: /add expense/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/expenses",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"account_id":"account-1"'),
          }),
        );
      });
    });

    it("should use PUT method when updating existing expense", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          expense={createMockExpense()}
          onSuccess={vi.fn()}
        />,
      );

      // Submit the form
      await user.click(screen.getByRole("button", { name: /update expense/i }));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/expenses/expense-1",
          expect.objectContaining({
            method: "PUT",
          }),
        );
      });
    });
  });

  describe("Callbacks", () => {
    it("should call onCancel when Cancel is clicked", async () => {
      const user = userEvent.setup();
      const mockOnCancel = vi.fn();

      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          onCancel={mockOnCancel}
        />,
      );

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("should call onAddAnother instead of onSuccess when Add & New is clicked", async () => {
      const user = userEvent.setup();
      const mockOnAddAnother = vi.fn();
      const mockOnSuccess = vi.fn();

      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          onSuccess={mockOnSuccess}
          onAddAnother={mockOnAddAnother}
        />,
      );

      // Fill in fields
      await user.type(screen.getByLabelText(/amount/i), "25.50");

      // Click Add & New
      await user.click(screen.getByRole("button", { name: /add & new/i }));

      await waitFor(() => {
        expect(mockOnAddAnother).toHaveBeenCalled();
        expect(mockOnSuccess).not.toHaveBeenCalled();
      });
    });
  });

  describe("Tags", () => {
    it("should toggle tag selection on click", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ExpenseForm
          accountId="account-1"
          accounts={mockAccounts}
          categories={mockCategories}
          tags={mockTags}
          onSuccess={vi.fn()}
        />,
      );

      // Find and click the tag
      const tagButton = screen.getByText("Groceries");
      await user.click(tagButton);

      // Tag should be selected (has background color)
      expect(tagButton).toHaveStyle({ backgroundColor: "rgb(59, 130, 246)" });

      // Click again to deselect
      await user.click(tagButton);

      // Tag should be deselected (no inline background color)
      expect(tagButton).not.toHaveStyle({
        backgroundColor: "rgb(59, 130, 246)",
      });
    });
  });
});
