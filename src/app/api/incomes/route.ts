import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createIncomeSchema } from "@/lib/validations/schemas";
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
  const incomeCategoryId = searchParams.get("income_category_id");
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
    .from("incomes")
    .select(
      `
      *,
      income_category:income_categories(id, name, icon, color)
    `,
    )
    .eq("account_id", accountId)
    .order("date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (incomeCategoryId) {
    query = query.eq("income_category_id", incomeCategoryId);
  }

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data: incomes, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "GET /api/incomes") },
      { status: 500 },
    );
  }

  return NextResponse.json(incomes || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const json = await request.json();
  const validation = validateRequest(createIncomeSchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    body.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

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
      convertedAmount = convertAmount(body.amount, rateResult.rate);
      rateDate = rateResult.date;
    }
  }

  // Insert income
  const { data: income, error } = await supabase
    .from("incomes")
    .insert({
      account_id: body.account_id,
      user_id: user.id,
      amount: body.amount,
      currency: body.currency,
      description: body.description || null,
      date: body.date,
      income_category_id: body.income_category_id || null,
      receipt_url: body.receipt_url || null,
      converted_amount: convertedAmount,
      exchange_rate: exchangeRate,
      account_currency:
        body.currency !== accountCurrency ? accountCurrency : null,
      rate_date: rateDate,
    })
    .select(
      `
      *,
      income_category:income_categories(id, name, icon, color)
    `,
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "POST /api/incomes") },
      { status: 500 },
    );
  }

  return NextResponse.json(income, { status: 201 });
}
