import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRecurringExpenseSchema } from "@/lib/validations/schemas";
import { sanitizeDbError } from "@/lib/api-errors";
import {
  requireAuth,
  requireAccountMembership,
  validateRequest,
} from "@/lib/api-helpers";
import { calculateFirstOccurrence } from "@/lib/recurrence";
import { catchUpRecurringExpense } from "@/lib/recurring-generator";

export async function GET(request: Request) {
  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  // Get query params
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account_id");
  const isActive = searchParams.get("is_active");
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
    .from("recurring_expenses")
    .select(
      `
      *,
      category:categories(id, name, icon, color)
    `,
    )
    .eq("account_id", accountId)
    .order("next_occurrence", { ascending: true })
    .range(offset, offset + limit - 1);

  if (isActive !== null && isActive !== undefined) {
    query = query.eq("is_active", isActive === "true");
  }

  const { data: recurringExpenses, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "GET /api/recurring-expenses") },
      { status: 500 },
    );
  }

  return NextResponse.json(recurringExpenses || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const json = await request.json();
  const validation = validateRequest(createRecurringExpenseSchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    body.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  // Calculate first occurrence
  const firstOccurrence = calculateFirstOccurrence({
    frequency: body.frequency,
    customInterval: body.custom_interval,
    customUnit: body.custom_unit,
    dayOfWeekMask: body.day_of_week_mask,
    dayOfMonth: body.day_of_month,
    startDate: new Date(body.start_date),
    endDate: body.end_date ? new Date(body.end_date) : undefined,
  });

  // Insert recurring expense
  const { data: recurringExpense, error } = await supabase
    .from("recurring_expenses")
    .insert({
      account_id: body.account_id,
      user_id: user.id,
      amount: body.amount,
      currency: body.currency,
      summary: body.summary || null,
      description: body.description || null,
      category_id: body.category_id || null,
      frequency: body.frequency,
      custom_interval: body.custom_interval || null,
      custom_unit: body.custom_unit || null,
      day_of_week_mask: body.day_of_week_mask || 0,
      day_of_month: body.day_of_month || null,
      start_date: body.start_date,
      end_date: body.end_date || null,
      next_occurrence: firstOccurrence.toISOString().split("T")[0],
      is_active: true,
    })
    .select(
      `
      *,
      category:categories(id, name, icon, color)
    `,
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "POST /api/recurring-expenses") },
      { status: 500 },
    );
  }

  // Check if we need to catch up past occurrences
  const today = new Date().toISOString().split("T")[0];
  const firstOccurrenceDate = firstOccurrence.toISOString().split("T")[0];

  if (firstOccurrenceDate <= today) {
    // Generate all past transactions up to today
    try {
      await catchUpRecurringExpense(supabase, recurringExpense.id);

      // Fetch the updated recurring expense to return current state
      const { data: updatedRecurring } = await supabase
        .from("recurring_expenses")
        .select(
          `
          *,
          category:categories(id, name, icon, color)
        `,
        )
        .eq("id", recurringExpense.id)
        .single();

      return NextResponse.json(updatedRecurring || recurringExpense, {
        status: 201,
      });
    } catch (catchUpError) {
      console.error("Error during catch-up generation:", catchUpError);
      // Still return the created recurring expense even if catch-up failed
    }
  }

  return NextResponse.json(recurringExpense, { status: 201 });
}
