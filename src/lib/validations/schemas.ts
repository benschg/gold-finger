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
      })
    )
    .optional(),
  category_suggestion: z.string().optional(),
});

// Expense schemas
export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().length(3),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  description: z.string().max(500).optional(),
  category_id: z.string().uuid().optional().nullable(),
  account_id: z.string().uuid(),
  receipt_url: z.string().url().optional().nullable(),
  receipt_analysis: receiptAnalysisSchema.optional().nullable(),
  tag_ids: z.array(z.string().uuid()).optional(),
  // Exchange rate fields (computed server-side)
  converted_amount: z.number().optional().nullable(),
  exchange_rate: z.number().optional().nullable(),
  account_currency: z.string().length(3).optional().nullable(),
  rate_date: z.string().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema
  .partial()
  .omit({ account_id: true });

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

// Type exports
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ReceiptAnalysis = z.infer<typeof receiptAnalysisSchema>;
