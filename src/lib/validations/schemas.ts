import { z } from "zod";

// Account schemas
export const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  currency: z.string().length(3).optional(),
});

export const updateAccountSchema = createAccountSchema.partial();

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  icon: z.string().min(1, "Icon is required").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  account_id: z.string().uuid(),
});

export const updateCategorySchema = createCategorySchema.partial().omit({
  account_id: true,
});

// Tag schemas
export const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format")
    .optional(),
  account_id: z.string().uuid(),
});

export const updateTagSchema = createTagSchema.partial().omit({
  account_id: true,
});

// Receipt analysis schema (used by both expenses and AI analysis)
export const receiptAnalysisSchema = z.object({
  merchant: z.string().optional(),
  date: z.string().optional(),
  total: z.number().optional(),
  currency: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().optional(),
        price: z.number().optional(),
      }),
    )
    .optional(),
  category_suggestion: z.string().optional(),
});

// Expense item schemas
export const expenseItemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(200),
  quantity: z.number().positive().default(1),
  unit_price: z.number().min(0, "Price cannot be negative"),
  category_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().min(0).optional(),
});

export const createExpenseItemSchema = expenseItemSchema;

export const updateExpenseItemSchema = expenseItemSchema.partial().extend({
  id: z.string().uuid().optional(),
});

// Expense schemas
export const createExpenseSchema = z.object({
  currency: z.string().length(3),
  summary: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  category_id: z.string().uuid().optional().nullable(),
  account_id: z.string().uuid(),
  receipt_url: z.string().url().optional().nullable(),
  receipt_analysis: receiptAnalysisSchema.optional().nullable(),
  tag_ids: z.array(z.string().uuid()).optional(),
  items: z
    .array(createExpenseItemSchema)
    .min(1, "At least one item is required"),
  // Exchange rate fields (computed server-side)
  converted_amount: z.number().optional().nullable(),
  exchange_rate: z.number().optional().nullable(),
  account_currency: z.string().length(3).optional().nullable(),
  rate_date: z.string().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema
  .partial()
  .omit({ account_id: true })
  .extend({
    items: z
      .array(updateExpenseItemSchema)
      .min(1, "At least one item is required")
      .optional(),
  });

// Income category schemas
export const createIncomeCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  icon: z.string().min(1, "Icon is required").max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  account_id: z.string().uuid(),
});

export const updateIncomeCategorySchema = createIncomeCategorySchema
  .partial()
  .omit({
    account_id: true,
  });

// Income schemas
export const createIncomeSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  summary: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  income_category_id: z.string().uuid().optional().nullable(),
  account_id: z.string().uuid(),
  receipt_url: z.string().url().optional().nullable(),
  // Exchange rate fields (computed server-side)
  converted_amount: z.number().optional().nullable(),
  exchange_rate: z.number().optional().nullable(),
  account_currency: z.string().length(3).optional().nullable(),
  rate_date: z.string().optional().nullable(),
});

export const updateIncomeSchema = createIncomeSchema.partial().omit({
  account_id: true,
});

// Invitation schemas
export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Profile schemas
export const updateProfileSchema = z.object({
  avatar_url: z.string().url().optional().nullable(),
  preferred_currency: z.string().length(3).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

// ============================================
// RECURRING TRANSACTION SCHEMAS
// ============================================

export const recurrenceFrequencySchema = z.enum([
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
]);

export const customUnitSchema = z.enum(["days", "weeks", "months", "years"]);

// Recurring expense schemas - base object without refinement for partial support
const recurringExpenseBaseSchema = z.object({
  account_id: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3),
  summary: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  category_id: z.string().uuid().optional().nullable(),
  frequency: recurrenceFrequencySchema,
  custom_interval: z.number().int().positive().optional(),
  custom_unit: customUnitSchema.optional(),
  day_of_week_mask: z.number().int().min(0).max(127).optional(),
  day_of_month: z.number().int().min(-1).max(31).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional()
    .nullable(),
});

export const createRecurringExpenseSchema = recurringExpenseBaseSchema.refine(
  (data) => {
    // Custom frequency requires interval and unit
    if (data.frequency === "custom") {
      return data.custom_interval && data.custom_unit;
    }
    return true;
  },
  {
    message: "Custom frequency requires custom_interval and custom_unit",
    path: ["frequency"],
  },
);

export const updateRecurringExpenseSchema = recurringExpenseBaseSchema
  .partial()
  .omit({ account_id: true })
  .extend({
    is_active: z.boolean().optional(),
  });

// Recurring income schemas - base object without refinement for partial support
const recurringIncomeBaseSchema = z.object({
  account_id: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3),
  summary: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  income_category_id: z.string().uuid().optional().nullable(),
  frequency: recurrenceFrequencySchema,
  custom_interval: z.number().int().positive().optional(),
  custom_unit: customUnitSchema.optional(),
  day_of_week_mask: z.number().int().min(0).max(127).optional(),
  day_of_month: z.number().int().min(-1).max(31).optional().nullable(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional()
    .nullable(),
});

export const createRecurringIncomeSchema = recurringIncomeBaseSchema.refine(
  (data) => {
    if (data.frequency === "custom") {
      return data.custom_interval && data.custom_unit;
    }
    return true;
  },
  {
    message: "Custom frequency requires custom_interval and custom_unit",
    path: ["frequency"],
  },
);

export const updateRecurringIncomeSchema = recurringIncomeBaseSchema
  .partial()
  .omit({ account_id: true })
  .extend({
    is_active: z.boolean().optional(),
  });

// Type exports
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type ExpenseItemInput = z.infer<typeof expenseItemSchema>;
export type CreateExpenseItemInput = z.infer<typeof createExpenseItemSchema>;
export type UpdateExpenseItemInput = z.infer<typeof updateExpenseItemSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type CreateIncomeCategoryInput = z.infer<
  typeof createIncomeCategorySchema
>;
export type UpdateIncomeCategoryInput = z.infer<
  typeof updateIncomeCategorySchema
>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type UpdateIncomeInput = z.infer<typeof updateIncomeSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ReceiptAnalysis = z.infer<typeof receiptAnalysisSchema>;
export type RecurrenceFrequency = z.infer<typeof recurrenceFrequencySchema>;
export type CustomUnit = z.infer<typeof customUnitSchema>;
export type CreateRecurringExpenseInput = z.infer<
  typeof createRecurringExpenseSchema
>;
export type UpdateRecurringExpenseInput = z.infer<
  typeof updateRecurringExpenseSchema
>;
export type CreateRecurringIncomeInput = z.infer<
  typeof createRecurringIncomeSchema
>;
export type UpdateRecurringIncomeInput = z.infer<
  typeof updateRecurringIncomeSchema
>;
