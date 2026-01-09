import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateRecurringExpenseSchema } from "@/lib/validations/schemas";
import { sanitizeDbError } from "@/lib/api-errors";
import {
  requireAuth,
  requireAccountMembership,
  validateRequest,
} from "@/lib/api-helpers";
import {
  calculateNextOccurrence,
  calculateFirstOccurrence,
} from "@/lib/recurrence";
import type { RecurrenceFrequency, CustomUnit } from "@/types/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const { data: recurringExpense, error } = await supabase
    .from("recurring_expenses")
    .select(
      `
      *,
      category:categories(id, name, icon, color)
    `,
    )
    .eq("id", id)
    .single();

  if (error || !recurringExpense) {
    return NextResponse.json(
      { error: "Recurring expense not found" },
      { status: 404 },
    );
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    recurringExpense.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  return NextResponse.json(recurringExpense);
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
  const validation = validateRequest(updateRecurringExpenseSchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

  // Get the recurring expense to verify account membership
  const { data: existingRecurring, error: fetchError } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existingRecurring) {
    return NextResponse.json(
      { error: "Recurring expense not found" },
      { status: 404 },
    );
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    existingRecurring.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.currency !== undefined) updateData.currency = body.currency;
  if (body.summary !== undefined) updateData.summary = body.summary;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.category_id !== undefined) updateData.category_id = body.category_id;
  if (body.frequency !== undefined) updateData.frequency = body.frequency;
  if (body.custom_interval !== undefined)
    updateData.custom_interval = body.custom_interval;
  if (body.custom_unit !== undefined) updateData.custom_unit = body.custom_unit;
  if (body.day_of_week_mask !== undefined)
    updateData.day_of_week_mask = body.day_of_week_mask;
  if (body.day_of_month !== undefined)
    updateData.day_of_month = body.day_of_month;
  if (body.start_date !== undefined) updateData.start_date = body.start_date;
  if (body.end_date !== undefined) updateData.end_date = body.end_date;
  if (body.is_active !== undefined) updateData.is_active = body.is_active;

  // Recalculate next_occurrence if recurrence rules changed
  const recurrenceChanged =
    body.frequency !== undefined ||
    body.custom_interval !== undefined ||
    body.custom_unit !== undefined ||
    body.day_of_week_mask !== undefined ||
    body.day_of_month !== undefined ||
    body.start_date !== undefined;

  if (recurrenceChanged) {
    const frequency = (body.frequency ||
      existingRecurring.frequency) as RecurrenceFrequency;
    const startDate = body.start_date || existingRecurring.start_date;
    const endDate =
      body.end_date !== undefined ? body.end_date : existingRecurring.end_date;

    // If resuming from paused state, recalculate from today
    const isResuming = body.is_active === true && !existingRecurring.is_active;

    const rule = {
      frequency,
      customInterval:
        body.custom_interval ?? existingRecurring.custom_interval ?? undefined,
      customUnit: (body.custom_unit ??
        existingRecurring.custom_unit ??
        undefined) as CustomUnit | undefined,
      dayOfWeekMask:
        body.day_of_week_mask ?? existingRecurring.day_of_week_mask,
      dayOfMonth:
        body.day_of_month ?? existingRecurring.day_of_month ?? undefined,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
    };

    if (isResuming) {
      // When resuming, find next occurrence from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let nextOccurrence = calculateFirstOccurrence(rule);

      // If first occurrence is in the past, calculate from today
      if (nextOccurrence < today) {
        const nextFromToday = calculateNextOccurrence(rule, today);
        if (nextFromToday) {
          nextOccurrence = nextFromToday;
        }
      }

      updateData.next_occurrence = nextOccurrence.toISOString().split("T")[0];
    } else if (body.start_date !== undefined) {
      // If start date changed, recalculate first occurrence
      const firstOccurrence = calculateFirstOccurrence(rule);
      updateData.next_occurrence = firstOccurrence.toISOString().split("T")[0];
    }
  }

  const { data: updatedRecurring, error } = await supabase
    .from("recurring_expenses")
    .update(updateData)
    .eq("id", id)
    .select(
      `
      *,
      category:categories(id, name, icon, color)
    `,
    )
    .single();

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "PUT /api/recurring-expenses/[id]") },
      { status: 500 },
    );
  }

  return NextResponse.json(updatedRecurring);
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

  // Get the recurring expense to verify account membership
  const { data: recurringExpense, error: fetchError } = await supabase
    .from("recurring_expenses")
    .select("account_id")
    .eq("id", id)
    .single();

  if (fetchError || !recurringExpense) {
    return NextResponse.json(
      { error: "Recurring expense not found" },
      { status: 404 },
    );
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    recurringExpense.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  const { error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "DELETE /api/recurring-expenses/[id]") },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
