import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createExpenseSchema } from "@/lib/validations/schemas";
import { getExchangeRate, convertAmount } from "@/lib/exchange-rates";
import { sanitizeDbError } from "@/lib/api-errors";
import {
  requireAuth,
  requireAccountMembership,
  validateRequest,
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  // Get query params
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account_id");
  const categoryId = searchParams.get("category_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

  if (!accountId) {
    return NextResponse.json(
      { error: "account_id is required" },
      { status: 400 },
    );
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    accountId,
    user.id,
  );
  if (membershipError) return membershipError;

  // Build query
  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      category:categories(id, name, icon, color)
    `,
    )
    .eq("account_id", accountId)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data: expenses, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "GET /api/expenses") },
      { status: 500 },
    );
  }

  // Get tags for each expense
  const expenseIds = expenses?.map((e) => e.id) || [];

  if (expenseIds.length > 0) {
    const { data: expenseTags } = await supabase
      .from("expense_tags")
      .select(
        `
        expense_id,
        tag:tags(id, name, color)
      `,
      )
      .in("expense_id", expenseIds);

    // Get items for expenses that have them
    // Note: has_items column requires migration 00008_expense_items.sql
    type ExpenseRecord = (typeof expenses)[number] & { has_items?: boolean };
    const expenseIdsWithItems =
      (expenses as ExpenseRecord[])
        ?.filter((e) => e.has_items)
        .map((e) => e.id) || [];

    type ExpenseItemRecord = {
      id: string;
      expense_id: string;
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      category_id: string | null;
      sort_order: number;
      created_at: string;
      category: {
        id: string;
        name: string;
        icon: string;
        color: string;
      } | null;
    };

    let expenseItemsMap: Record<string, ExpenseItemRecord[]> = {};

    if (expenseIdsWithItems.length > 0) {
      // Note: expense_items table requires migration 00008_expense_items.sql
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: items } = (await (supabase as any)
        .from("expense_items")
        .select(
          `
          *,
          category:categories(id, name, icon, color)
        `,
        )
        .in("expense_id", expenseIdsWithItems)
        .order("sort_order", { ascending: true })) as {
        data: ExpenseItemRecord[] | null;
      };

      // Group items by expense_id
      expenseItemsMap = (items || []).reduce(
        (acc, item) => {
          if (!acc[item.expense_id]) acc[item.expense_id] = [];
          acc[item.expense_id].push(item);
          return acc;
        },
        {} as Record<string, ExpenseItemRecord[]>,
      );
    }

    // Attach tags and items to expenses
    const expensesWithDetails = expenses?.map((expense) => ({
      ...expense,
      tags:
        expenseTags
          ?.filter((et) => et.expense_id === expense.id)
          .map((et) => et.tag) || [],
      items: expenseItemsMap[expense.id] || [],
    }));

    return NextResponse.json(expensesWithDetails);
  }

  return NextResponse.json(
    expenses?.map((e) => ({ ...e, tags: [], items: [] })) || [],
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const json = await request.json();
  const validation = validateRequest(createExpenseSchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    body.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  // Calculate amount from items (items are required)
  const calculatedAmount = body.items.reduce(
    (sum: number, item: { quantity?: number; unit_price: number }) =>
      sum + (item.quantity ?? 1) * item.unit_price,
    0,
  );

  // Fetch account's default currency
  const { data: account } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", body.account_id)
    .single();

  const accountCurrency = account?.currency || "EUR";

  // Calculate exchange rate if currencies differ
  let convertedAmount: number | null = null;
  let exchangeRate: number | null = null;
  let rateDate: string | null = null;

  if (body.currency !== accountCurrency) {
    const rateResult = await getExchangeRate(body.currency, accountCurrency);
    if (rateResult) {
      exchangeRate = rateResult.rate;
      convertedAmount = convertAmount(calculatedAmount, rateResult.rate);
      rateDate = rateResult.date;
    }
  }

  // Insert expense
  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      account_id: body.account_id,
      user_id: user.id,
      amount: calculatedAmount,
      currency: body.currency,
      summary: body.summary || null,
      description: body.description || null,
      date: body.date,
      category_id: body.category_id || null,
      receipt_url: body.receipt_url || null,
      converted_amount: convertedAmount,
      exchange_rate: exchangeRate,
      account_currency:
        body.currency !== accountCurrency ? accountCurrency : null,
      rate_date: rateDate,
      has_items: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "POST /api/expenses") },
      { status: 500 },
    );
  }

  // Insert tags if provided
  if (body.tag_ids && body.tag_ids.length > 0) {
    const tagInserts = body.tag_ids.map((tagId) => ({
      expense_id: expense.id,
      tag_id: tagId,
    }));

    await supabase.from("expense_tags").insert(tagInserts);
  }

  // Insert items (items are required)
  // Note: expense_items table requires migration 00008_expense_items.sql
  const itemInserts = body.items.map(
    (
      item: {
        name: string;
        quantity?: number;
        unit_price: number;
        category_id?: string | null;
        sort_order?: number;
      },
      index: number,
    ) => ({
      expense_id: expense.id,
      name: item.name,
      quantity: item.quantity ?? 1,
      unit_price: item.unit_price,
      category_id: item.category_id || null,
      sort_order: item.sort_order ?? index,
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsError } = await (supabase as any)
    .from("expense_items")
    .insert(itemInserts);

  if (itemsError) {
    console.error("Error inserting expense items:", itemsError);
  }

  return NextResponse.json(expense, { status: 201 });
}
