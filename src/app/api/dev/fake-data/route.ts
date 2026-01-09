import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  requireAuth,
  requireAccountMembership,
  validateRequest,
} from "@/lib/api-helpers";

const FAKE_EXPENSE_NAMES = [
  "Groceries",
  "Coffee",
  "Lunch",
  "Dinner",
  "Transportation",
  "Office Supplies",
  "Books",
  "Utilities",
  "Entertainment",
  "Clothing",
  "Gas",
  "Pharmacy",
  "Subscription",
  "Hardware",
  "Software",
  "Restaurant",
  "Snacks",
  "Taxi",
  "Parking",
  "Gym",
];

const FAKE_INCOME_DESCRIPTIONS = [
  "Monthly Salary",
  "Freelance Payment",
  "Bonus",
  "Investment Return",
  "Consulting Fee",
  "Refund",
  "Commission",
  "Dividend",
  "Rental Income",
  "Side Project Revenue",
  "Gift",
  "Reimbursement",
  "Interest",
  "Royalties",
  "Contract Work",
];

const generateFakeDataSchema = z.object({
  account_id: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().length(3).optional(),
  expenseCount: z.number().int().min(0).max(100),
  expenseTotalAmount: z.number().min(0),
  incomeCount: z.number().int().min(0).max(100),
  incomeTotalAmount: z.number().min(0),
});

function distributeAmount(total: number, count: number): number[] {
  if (count === 0) return [];
  if (count === 1) return [Math.round(total * 100) / 100];

  const weights = Array.from({ length: count }, () => Math.random());
  const sum = weights.reduce((a, b) => a + b, 0);
  const amounts = weights.map((w) => (w / sum) * total);

  // Round to 2 decimals and ensure total matches
  const rounded = amounts.map((a) => Math.round(a * 100) / 100);
  const roundedSum = rounded.reduce((a, b) => a + b, 0);
  const diff = Math.round((total - roundedSum) * 100) / 100;
  rounded[0] = Math.round((rounded[0] + diff) * 100) / 100;

  return rounded;
}

function generateRandomDates(
  startDate: string,
  endDate: string,
  count: number,
): string[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  return Array.from({ length: count }, () => {
    const randomTime = start + Math.random() * (end - start);
    const date = new Date(randomTime);
    return date.toISOString().split("T")[0];
  }).sort();
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(request: Request) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 },
    );
  }

  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const json = await request.json();
  const validation = validateRequest(generateFakeDataSchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    body.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  // Fetch account currency (use provided currency or fall back to account default)
  const { data: account } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", body.account_id)
    .single();

  const currency = body.currency || account?.currency || "EUR";

  // Fetch categories for expenses
  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .eq("account_id", body.account_id);

  // Fetch income categories
  const { data: incomeCategories } = await supabase
    .from("income_categories")
    .select("id")
    .eq("account_id", body.account_id);

  const categoryIds = categories?.map((c) => c.id) || [];
  const incomeCategoryIds = incomeCategories?.map((c) => c.id) || [];

  let createdExpenses = 0;
  let createdIncomes = 0;

  // Generate expenses
  if (body.expenseCount > 0 && body.expenseTotalAmount > 0) {
    const expenseAmounts = distributeAmount(
      body.expenseTotalAmount,
      body.expenseCount,
    );
    const expenseDates = generateRandomDates(
      body.startDate,
      body.endDate,
      body.expenseCount,
    );

    for (let i = 0; i < body.expenseCount; i++) {
      const amount = expenseAmounts[i];
      const date = expenseDates[i];

      // Generate 1-3 items per expense
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const itemAmounts = distributeAmount(amount, itemCount);
      const items = itemAmounts.map((itemAmount, idx) => ({
        name: getRandomItem(FAKE_EXPENSE_NAMES),
        quantity: 1,
        unit_price: itemAmount,
        category_id: categoryIds.length > 0 ? getRandomItem(categoryIds) : null,
        sort_order: idx,
      }));

      const summary = items
        .slice(0, 2)
        .map((item) => item.name)
        .join(", ");

      // Insert expense
      const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          account_id: body.account_id,
          user_id: user.id,
          amount: amount,
          currency: currency,
          summary: summary,
          date: date,
          category_id:
            categoryIds.length > 0 ? getRandomItem(categoryIds) : null,
          has_items: true,
        })
        .select()
        .single();

      if (expenseError) {
        console.error("Error creating fake expense:", expenseError);
        continue;
      }

      // Insert expense items
      const itemInserts = items.map((item) => ({
        expense_id: expense.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        category_id: item.category_id,
        sort_order: item.sort_order,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: itemsError } = await (supabase as any)
        .from("expense_items")
        .insert(itemInserts);

      if (itemsError) {
        console.error("Error inserting expense items:", itemsError);
      }

      createdExpenses++;
    }
  }

  // Generate incomes
  let lastIncomeError: string | null = null;
  if (body.incomeCount > 0 && body.incomeTotalAmount > 0) {
    const incomeAmounts = distributeAmount(
      body.incomeTotalAmount,
      body.incomeCount,
    );
    const incomeDates = generateRandomDates(
      body.startDate,
      body.endDate,
      body.incomeCount,
    );

    for (let i = 0; i < body.incomeCount; i++) {
      const { error: incomeError } = await supabase.from("incomes").insert({
        account_id: body.account_id,
        user_id: user.id,
        amount: incomeAmounts[i],
        currency: currency,
        description: getRandomItem(FAKE_INCOME_DESCRIPTIONS),
        date: incomeDates[i],
        income_category_id:
          incomeCategoryIds.length > 0
            ? getRandomItem(incomeCategoryIds)
            : null,
        receipt_url: null,
        converted_amount: null,
        exchange_rate: null,
        account_currency: null,
        rate_date: null,
      });

      if (incomeError) {
        console.error("Error creating fake income:", incomeError);
        lastIncomeError = incomeError.message;
        continue;
      }

      createdIncomes++;
    }
  }

  return NextResponse.json(
    {
      success: true,
      createdExpenses,
      createdIncomes,
      ...(lastIncomeError && { incomeError: lastIncomeError }),
    },
    { status: 201 },
  );
}
