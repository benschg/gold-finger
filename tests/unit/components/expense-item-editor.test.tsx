import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test-utils";
import { ExpenseItemEditor } from "@/components/expenses/expense-item-editor";
import type { Category, CreateExpenseItemInput } from "@/types/database";

const mockCategories: Category[] = [
  {
    id: "cat-1",
    account_id: "account-1",
    name: "Food",
    icon: "utensils",
    color: "#ef4444",
    created_at: "2024-01-01",
  },
  {
    id: "cat-2",
    account_id: "account-1",
    name: "Transport",
    icon: "car",
    color: "#3b82f6",
    created_at: "2024-01-01",
  },
];

const defaultItem: CreateExpenseItemInput = {
  name: "",
  quantity: 1,
  unit_price: 0,
  category_id: null,
  sort_order: 0,
};

describe("ExpenseItemEditor", () => {
  let mockOnChange: Mock<(items: CreateExpenseItemInput[]) => void>;

  beforeEach(() => {
    mockOnChange = vi.fn<(items: CreateExpenseItemInput[]) => void>();
  });

  describe("Rendering", () => {
    it("should render with one item", () => {
      renderWithProviders(
        <ExpenseItemEditor
          items={[defaultItem]}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      // Should show the line items label
      expect(screen.getByText(/line items/i)).toBeInTheDocument();
      // Should show add item button
      expect(
        screen.getByRole("button", { name: /add item/i }),
      ).toBeInTheDocument();
    });

    it("should render multiple items", () => {
      const items: CreateExpenseItemInput[] = [
        { name: "Coffee", quantity: 1, unit_price: 3.5, category_id: null },
        { name: "Sandwich", quantity: 2, unit_price: 5.0, category_id: null },
      ];

      renderWithProviders(
        <ExpenseItemEditor
          items={items}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      // Should have input fields for both items
      const nameInputs = screen.getAllByPlaceholderText(/item name/i);
      expect(nameInputs).toHaveLength(2);
      expect(nameInputs[0]).toHaveValue("Coffee");
      expect(nameInputs[1]).toHaveValue("Sandwich");
    });

    it("should display the currency symbol", () => {
      renderWithProviders(
        <ExpenseItemEditor
          items={[defaultItem]}
          categories={mockCategories}
          currencySymbol="$"
          onChange={mockOnChange}
        />,
      );

      expect(screen.getByText("$")).toBeInTheDocument();
    });

    it("should calculate and display total", () => {
      const items: CreateExpenseItemInput[] = [
        { name: "Coffee", quantity: 2, unit_price: 3.5, category_id: null },
        { name: "Sandwich", quantity: 1, unit_price: 5.0, category_id: null },
      ];

      renderWithProviders(
        <ExpenseItemEditor
          items={items}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      // Total should be 2 * 3.5 + 1 * 5.0 = 12.00
      expect(screen.getByText(/12\.00/)).toBeInTheDocument();
    });

    it("should not show delete button when only one item exists", () => {
      renderWithProviders(
        <ExpenseItemEditor
          items={[defaultItem]}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      // The delete button has the class hover:text-destructive
      const deleteButtons = document.querySelectorAll(
        "button.hover\\:text-destructive",
      );
      expect(deleteButtons.length).toBe(0);
    });

    it("should show delete button when multiple items exist", () => {
      const items: CreateExpenseItemInput[] = [
        { name: "Coffee", quantity: 1, unit_price: 3.5, category_id: null },
        { name: "Sandwich", quantity: 1, unit_price: 5.0, category_id: null },
      ];

      renderWithProviders(
        <ExpenseItemEditor
          items={items}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      // The delete button has the class hover:text-destructive
      const deleteButtons = document.querySelectorAll(
        "button.hover\\:text-destructive",
      );
      expect(deleteButtons.length).toBe(2);
    });
  });

  describe("Adding items", () => {
    it("should add a new item when Add Item is clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ExpenseItemEditor
          items={[defaultItem]}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      await user.click(screen.getByRole("button", { name: /add item/i }));

      // onChange should be called with 2 items
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: "" }),
          expect.objectContaining({ name: "" }),
        ]),
      );
    });
  });

  describe("Updating items", () => {
    it("should update item name", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ExpenseItemEditor
          items={[defaultItem]}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      const nameInput = screen.getByPlaceholderText(/item name/i);
      await user.type(nameInput, "Coffee");

      // onChange should be called with updated name
      expect(mockOnChange).toHaveBeenCalled();
      const lastCall =
        mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall[0][0].name).toContain("Coffee");
    });

    it("should update item quantity when input changes", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ExpenseItemEditor
          items={[{ ...defaultItem, name: "Coffee", quantity: 1 }]}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      const qtyInput = screen.getByPlaceholderText(/qty/i);
      // Type additional number to change quantity
      await user.type(qtyInput, "0");

      // onChange should be called with updated quantity (10)
      expect(mockOnChange).toHaveBeenCalled();
      const lastCall =
        mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall[0][0].quantity).toBe(10);
    });

    it("should update item price", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ExpenseItemEditor
          items={[{ ...defaultItem, name: "Coffee" }]}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      const priceInput = screen.getByPlaceholderText("0.00");
      await user.type(priceInput, "12.50");

      expect(mockOnChange).toHaveBeenCalled();
      const lastCall =
        mockOnChange.mock.calls[mockOnChange.mock.calls.length - 1];
      expect(lastCall[0][0].unit_price).toBe(12.5);
    });
  });

  describe("Removing items", () => {
    it("should remove an item when delete is clicked", async () => {
      const user = userEvent.setup();
      const items: CreateExpenseItemInput[] = [
        { name: "Coffee", quantity: 1, unit_price: 3.5, category_id: null },
        { name: "Sandwich", quantity: 1, unit_price: 5.0, category_id: null },
      ];

      renderWithProviders(
        <ExpenseItemEditor
          items={items}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
        />,
      );

      // Find delete buttons (they have hover:text-destructive class)
      const deleteButtons = document.querySelectorAll(
        "button.hover\\:text-destructive",
      );
      expect(deleteButtons.length).toBe(2);

      // Click the first delete button
      await user.click(deleteButtons[0]);

      // onChange should be called with only one item (the second one)
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({ name: "Sandwich" }),
      ]);
    });
  });

  describe("Category selection", () => {
    it("should render category dropdown", () => {
      renderWithProviders(
        <ExpenseItemEditor
          items={[defaultItem]}
          categories={mockCategories}
          currencySymbol="€"
          onChange={mockOnChange}
          expenseCategoryId="cat-1"
        />,
      );

      // The category dropdown should be visible (combobox role)
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });
  });
});
