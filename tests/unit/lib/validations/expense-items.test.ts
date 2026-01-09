import { describe, expect, it } from "vitest";
import {
  expenseItemSchema,
  createExpenseItemSchema,
  updateExpenseItemSchema,
  createExpenseSchema,
} from "@/lib/validations/schemas";

describe("Expense Item Schemas", () => {
  describe("expenseItemSchema", () => {
    it("should validate a valid item", () => {
      const validItem = {
        name: "Coffee",
        quantity: 2,
        unit_price: 3.5,
      };

      const result = expenseItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it("should set default quantity to 1", () => {
      const itemWithoutQuantity = {
        name: "Coffee",
        unit_price: 3.5,
      };

      const result = expenseItemSchema.safeParse(itemWithoutQuantity);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(1);
      }
    });

    it("should reject empty name", () => {
      const invalidItem = {
        name: "",
        quantity: 1,
        unit_price: 3.5,
      };

      const result = expenseItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("should reject name longer than 200 characters", () => {
      const invalidItem = {
        name: "a".repeat(201),
        quantity: 1,
        unit_price: 3.5,
      };

      const result = expenseItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const invalidItem = {
        name: "Coffee",
        quantity: -1,
        unit_price: 3.5,
      };

      const result = expenseItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      const invalidItem = {
        name: "Coffee",
        quantity: 0,
        unit_price: 3.5,
      };

      const result = expenseItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("should reject negative unit_price", () => {
      const invalidItem = {
        name: "Coffee",
        quantity: 1,
        unit_price: -5,
      };

      const result = expenseItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("should allow zero unit_price", () => {
      const validItem = {
        name: "Free sample",
        quantity: 1,
        unit_price: 0,
      };

      const result = expenseItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it("should accept optional category_id as UUID", () => {
      const validItem = {
        name: "Coffee",
        quantity: 1,
        unit_price: 3.5,
        category_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = expenseItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it("should accept null category_id", () => {
      const validItem = {
        name: "Coffee",
        quantity: 1,
        unit_price: 3.5,
        category_id: null,
      };

      const result = expenseItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for category_id", () => {
      const invalidItem = {
        name: "Coffee",
        quantity: 1,
        unit_price: 3.5,
        category_id: "not-a-uuid",
      };

      const result = expenseItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it("should accept optional sort_order", () => {
      const validItem = {
        name: "Coffee",
        quantity: 1,
        unit_price: 3.5,
        sort_order: 5,
      };

      const result = expenseItemSchema.safeParse(validItem);
      expect(result.success).toBe(true);
    });

    it("should reject negative sort_order", () => {
      const invalidItem = {
        name: "Coffee",
        quantity: 1,
        unit_price: 3.5,
        sort_order: -1,
      };

      const result = expenseItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });
  });

  describe("createExpenseItemSchema", () => {
    it("should be identical to expenseItemSchema", () => {
      const validItem = {
        name: "Coffee",
        quantity: 2,
        unit_price: 3.5,
      };

      const baseResult = expenseItemSchema.safeParse(validItem);
      const createResult = createExpenseItemSchema.safeParse(validItem);

      expect(baseResult.success).toBe(createResult.success);
    });
  });

  describe("updateExpenseItemSchema", () => {
    it("should allow partial updates", () => {
      const partialUpdate = {
        name: "Updated name",
      };

      const result = updateExpenseItemSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it("should allow optional id field", () => {
      const updateWithId = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Updated name",
      };

      const result = updateExpenseItemSchema.safeParse(updateWithId);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID for id", () => {
      const invalidUpdate = {
        id: "not-a-uuid",
        name: "Updated name",
      };

      const result = updateExpenseItemSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("createExpenseSchema with items", () => {
    const validExpenseBase = {
      account_id: "123e4567-e89b-12d3-a456-426614174000",
      currency: "EUR",
      date: "2024-01-15",
    };

    it("should require at least one item", () => {
      const expenseWithoutItems = {
        ...validExpenseBase,
        items: [],
      };

      const result = createExpenseSchema.safeParse(expenseWithoutItems);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one item");
      }
    });

    it("should accept expense with one item", () => {
      const expenseWithItem = {
        ...validExpenseBase,
        items: [
          {
            name: "Coffee",
            quantity: 1,
            unit_price: 3.5,
          },
        ],
      };

      const result = createExpenseSchema.safeParse(expenseWithItem);
      expect(result.success).toBe(true);
    });

    it("should accept expense with multiple items", () => {
      const expenseWithItems = {
        ...validExpenseBase,
        items: [
          { name: "Coffee", quantity: 2, unit_price: 3.5 },
          { name: "Sandwich", quantity: 1, unit_price: 8.0 },
          { name: "Cookie", quantity: 3, unit_price: 1.5 },
        ],
      };

      const result = createExpenseSchema.safeParse(expenseWithItems);
      expect(result.success).toBe(true);
    });

    it("should reject expense with invalid item", () => {
      const expenseWithInvalidItem = {
        ...validExpenseBase,
        items: [
          { name: "", quantity: 1, unit_price: 3.5 }, // Empty name
        ],
      };

      const result = createExpenseSchema.safeParse(expenseWithInvalidItem);
      expect(result.success).toBe(false);
    });

    it("should accept optional summary field", () => {
      const expenseWithSummary = {
        ...validExpenseBase,
        summary: "Morning coffee run",
        items: [{ name: "Coffee", quantity: 1, unit_price: 3.5 }],
      };

      const result = createExpenseSchema.safeParse(expenseWithSummary);
      expect(result.success).toBe(true);
    });

    it("should reject summary longer than 100 characters", () => {
      const expenseWithLongSummary = {
        ...validExpenseBase,
        summary: "a".repeat(101),
        items: [{ name: "Coffee", quantity: 1, unit_price: 3.5 }],
      };

      const result = createExpenseSchema.safeParse(expenseWithLongSummary);
      expect(result.success).toBe(false);
    });
  });
});
