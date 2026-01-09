import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateIncomeSchema } from "@/lib/validations/schemas";
import { getExchangeRate, convertAmount } from "@/lib/exchange-rates";
import { sanitizeDbError } from "@/lib/api-errors";
import {
  requireAuth,
  requireAccountMembership,
  validateRequest,
} from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const { data: income, error } = await supabase
    .from("incomes")
    .select(
      `
      *,
      income_category:income_categories(id, name, icon, color)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !income) {
    return NextResponse.json({ error: "Income not found" }, { status: 404 });
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    income.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  return NextResponse.json(income);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const json = await request.json();
  const validation = validateRequest(updateIncomeSchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

  // Get the income to verify account membership
  const { data: existingIncome, error: fetchError } = await supabase
    .from("incomes")
    .select("account_id, amount, currency")
    .eq("id", id)
    .single();

  if (fetchError || !existingIncome) {
    return NextResponse.json({ error: "Income not found" }, { status: 404 });
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    existingIncome.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.currency !== undefined) updateData.currency = body.currency;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.date !== undefined) updateData.date = body.date;
  if (body.income_category_id !== undefined)
    updateData.income_category_id = body.income_category_id;
  if (body.receipt_url !== undefined) updateData.receipt_url = body.receipt_url;

  // Recalculate exchange rate if currency or amount changed
  const newCurrency = body.currency || existingIncome.currency;
  const newAmount = body.amount || existingIncome.amount;

  // Fetch account's default currency
  const { data: account } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", existingIncome.account_id)
    .single();

  const accountCurrency = account?.currency || "EUR";

  if (
    body.currency !== undefined ||
    (body.amount !== undefined && newCurrency !== accountCurrency)
  ) {
    if (newCurrency !== accountCurrency) {
      const rateResult = await getExchangeRate(newCurrency, accountCurrency);
      if (rateResult) {
        updateData.exchange_rate = rateResult.rate;
        updateData.converted_amount = convertAmount(newAmount, rateResult.rate);
        updateData.account_currency = accountCurrency;
        updateData.rate_date = rateResult.date;
      }
    } else {
      // Same currency, clear exchange rate fields
      updateData.exchange_rate = null;
      updateData.converted_amount = null;
      updateData.account_currency = null;
      updateData.rate_date = null;
    }
  }

  const { data: updatedIncome, error } = await supabase
    .from("incomes")
    .update(updateData)
    .eq("id", id)
    .select(
      `
      *,
      income_category:income_categories(id, name, icon, color)
    `,
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "PUT /api/incomes/[id]") },
      { status: 500 },
    );
  }

  return NextResponse.json(updatedIncome);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  // Get the income to verify account membership
  const { data: income, error: fetchError } = await supabase
    .from("incomes")
    .select("account_id")
    .eq("id", id)
    .single();

  if (fetchError || !income) {
    return NextResponse.json({ error: "Income not found" }, { status: 404 });
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    income.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  const { error } = await supabase.from("incomes").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "DELETE /api/incomes/[id]") },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
