/**
 * Shared utilities for generating transactions from recurring items
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { calculateNextOccurrence } from "@/lib/recurrence";
import { getExchangeRate, convertAmount } from "@/lib/exchange-rates";
import type { RecurrenceFrequency, CustomUnit } from "@/types/database";
import type { Database } from "@/types/database.types";

type RecurringExpenseRow =
  Database["public"]["Tables"]["recurring_expenses"]["Row"];
type RecurringIncomeRow =
  Database["public"]["Tables"]["recurring_incomes"]["Row"];

interface GenerationResult {
  generated: number;
  errors: number;
  finalNextOccurrence: string;
  isActive: boolean;
}

/**
 * Generate a single expense from a recurring expense template
 */
async function generateSingleExpense(
  supabase: SupabaseClient<Database>,
  recurring: RecurringExpenseRow,
  occurrenceDate: string,
  accountCurrency: string,
): Promise<void> {
  // Calculate exchange rate if currencies differ
  let convertedAmount: number | null = null;
  let exchangeRate: number | null = null;
  let rateDate: string | null = null;

  if (recurring.currency !== accountCurrency) {
    const rateResult = await getExchangeRate(
      recurring.currency,
      accountCurrency,
    );
    if (rateResult) {
      exchangeRate = rateResult.rate;
      convertedAmount = convertAmount(recurring.amount, rateResult.rate);
      rateDate = rateResult.date;
    }
  }

  // Create the expense record
  const { error: insertError } = await supabase.from("expenses").insert({
    account_id: recurring.account_id,
    user_id: recurring.user_id,
    category_id: recurring.category_id,
    amount: recurring.amount,
    currency: recurring.currency,
    summary: recurring.summary,
    description: recurring.description,
    date: occurrenceDate,
    recurring_expense_id: recurring.id,
    has_items: false,
    converted_amount: convertedAmount,
    exchange_rate: exchangeRate,
    account_currency:
      recurring.currency !== accountCurrency ? accountCurrency : null,
    rate_date: rateDate,
  });

  if (insertError) {
    throw new Error(`Failed to insert expense: ${insertError.message}`);
  }
}

/**
 * Generate a single income from a recurring income template
 */
async function generateSingleIncome(
  supabase: SupabaseClient<Database>,
  recurring: RecurringIncomeRow,
  occurrenceDate: string,
  accountCurrency: string,
): Promise<void> {
  // Calculate exchange rate if currencies differ
  let convertedAmount: number | null = null;
  let exchangeRate: number | null = null;
  let rateDate: string | null = null;

  if (recurring.currency !== accountCurrency) {
    const rateResult = await getExchangeRate(
      recurring.currency,
      accountCurrency,
    );
    if (rateResult) {
      exchangeRate = rateResult.rate;
      convertedAmount = convertAmount(recurring.amount, rateResult.rate);
      rateDate = rateResult.date;
    }
  }

  // Create the income record
  const { error: insertError } = await supabase.from("incomes").insert({
    account_id: recurring.account_id,
    user_id: recurring.user_id,
    income_category_id: recurring.income_category_id,
    amount: recurring.amount,
    currency: recurring.currency,
    summary: recurring.summary,
    description: recurring.description,
    date: occurrenceDate,
    recurring_income_id: recurring.id,
    converted_amount: convertedAmount,
    exchange_rate: exchangeRate,
    account_currency:
      recurring.currency !== accountCurrency ? accountCurrency : null,
    rate_date: rateDate,
  });

  if (insertError) {
    throw new Error(`Failed to insert income: ${insertError.message}`);
  }
}

/**
 * Build a recurrence rule from a recurring expense/income row
 */
function buildRecurrenceRule(
  recurring: RecurringExpenseRow | RecurringIncomeRow,
) {
  return {
    frequency: recurring.frequency as RecurrenceFrequency,
    customInterval: recurring.custom_interval ?? undefined,
    customUnit: recurring.custom_unit as CustomUnit | undefined,
    dayOfWeekMask: recurring.day_of_week_mask,
    dayOfMonth: recurring.day_of_month ?? undefined,
    startDate: new Date(recurring.start_date),
    endDate: recurring.end_date ? new Date(recurring.end_date) : undefined,
  };
}

/**
 * Generate all due expenses from a recurring expense up to today
 * Returns the number of generated expenses and updates the recurring record
 */
export async function catchUpRecurringExpense(
  supabase: SupabaseClient<Database>,
  recurringId: string,
): Promise<GenerationResult> {
  const today = new Date().toISOString().split("T")[0];
  const result: GenerationResult = {
    generated: 0,
    errors: 0,
    finalNextOccurrence: today,
    isActive: true,
  };

  // Fetch the recurring expense
  const { data: recurring, error: fetchError } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("id", recurringId)
    .single();

  if (fetchError || !recurring) {
    throw new Error("Recurring expense not found");
  }

  if (!recurring.is_active) {
    result.isActive = false;
    result.finalNextOccurrence = recurring.next_occurrence;
    return result;
  }

  // Fetch account currency
  const { data: account } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", recurring.account_id)
    .single();

  const accountCurrency = account?.currency || "EUR";
  const rule = buildRecurrenceRule(recurring);

  let currentOccurrence = recurring.next_occurrence;
  let lastGeneratedDate: string | null = recurring.last_generated_date;

  // Generate all due transactions up to today
  while (currentOccurrence <= today && recurring.is_active) {
    try {
      await generateSingleExpense(
        supabase,
        recurring,
        currentOccurrence,
        accountCurrency,
      );
      result.generated++;
      lastGeneratedDate = currentOccurrence;
    } catch (error) {
      console.error(`Error generating expense for ${recurring.id}:`, error);
      result.errors++;
      break; // Stop on error to avoid infinite loops
    }

    // Calculate next occurrence
    const nextDate = calculateNextOccurrence(rule, new Date(currentOccurrence));

    if (
      !nextDate ||
      (recurring.end_date && nextDate > new Date(recurring.end_date))
    ) {
      // No more occurrences or past end date
      result.isActive = false;
      break;
    }

    currentOccurrence = nextDate.toISOString().split("T")[0];
  }

  result.finalNextOccurrence = currentOccurrence;

  // Update the recurring record
  await supabase
    .from("recurring_expenses")
    .update({
      next_occurrence: currentOccurrence,
      last_generated_date: lastGeneratedDate,
      is_active: result.isActive,
    })
    .eq("id", recurringId);

  return result;
}

/**
 * Generate all due incomes from a recurring income up to today
 * Returns the number of generated incomes and updates the recurring record
 */
export async function catchUpRecurringIncome(
  supabase: SupabaseClient<Database>,
  recurringId: string,
): Promise<GenerationResult> {
  const today = new Date().toISOString().split("T")[0];
  const result: GenerationResult = {
    generated: 0,
    errors: 0,
    finalNextOccurrence: today,
    isActive: true,
  };

  // Fetch the recurring income
  const { data: recurring, error: fetchError } = await supabase
    .from("recurring_incomes")
    .select("*")
    .eq("id", recurringId)
    .single();

  if (fetchError || !recurring) {
    throw new Error("Recurring income not found");
  }

  if (!recurring.is_active) {
    result.isActive = false;
    result.finalNextOccurrence = recurring.next_occurrence;
    return result;
  }

  // Fetch account currency
  const { data: account } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", recurring.account_id)
    .single();

  const accountCurrency = account?.currency || "EUR";
  const rule = buildRecurrenceRule(recurring);

  let currentOccurrence = recurring.next_occurrence;
  let lastGeneratedDate: string | null = recurring.last_generated_date;

  // Generate all due transactions up to today
  while (currentOccurrence <= today && recurring.is_active) {
    try {
      await generateSingleIncome(
        supabase,
        recurring,
        currentOccurrence,
        accountCurrency,
      );
      result.generated++;
      lastGeneratedDate = currentOccurrence;
    } catch (error) {
      console.error(`Error generating income for ${recurring.id}:`, error);
      result.errors++;
      break; // Stop on error to avoid infinite loops
    }

    // Calculate next occurrence
    const nextDate = calculateNextOccurrence(rule, new Date(currentOccurrence));

    if (
      !nextDate ||
      (recurring.end_date && nextDate > new Date(recurring.end_date))
    ) {
      // No more occurrences or past end date
      result.isActive = false;
      break;
    }

    currentOccurrence = nextDate.toISOString().split("T")[0];
  }

  result.finalNextOccurrence = currentOccurrence;

  // Update the recurring record
  await supabase
    .from("recurring_incomes")
    .update({
      next_occurrence: currentOccurrence,
      last_generated_date: lastGeneratedDate,
      is_active: result.isActive,
    })
    .eq("id", recurringId);

  return result;
}

/**
 * Process a single recurring expense for the cron job
 * Generates one transaction and updates next_occurrence
 */
export async function processRecurringExpense(
  supabase: SupabaseClient<Database>,
  recurring: RecurringExpenseRow,
): Promise<void> {
  // Fetch account currency
  const { data: account } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", recurring.account_id)
    .single();

  const accountCurrency = account?.currency || "EUR";

  // Generate the expense
  await generateSingleExpense(
    supabase,
    recurring,
    recurring.next_occurrence,
    accountCurrency,
  );

  // Calculate next occurrence
  const rule = buildRecurrenceRule(recurring);
  const nextDate = calculateNextOccurrence(
    rule,
    new Date(recurring.next_occurrence),
  );

  // Update recurring record
  if (
    nextDate &&
    (!recurring.end_date || nextDate <= new Date(recurring.end_date))
  ) {
    await supabase
      .from("recurring_expenses")
      .update({
        next_occurrence: nextDate.toISOString().split("T")[0],
        last_generated_date: recurring.next_occurrence,
      })
      .eq("id", recurring.id);
  } else {
    // End date reached or no more occurrences
    await supabase
      .from("recurring_expenses")
      .update({
        is_active: false,
        last_generated_date: recurring.next_occurrence,
      })
      .eq("id", recurring.id);
  }
}

/**
 * Process a single recurring income for the cron job
 * Generates one transaction and updates next_occurrence
 */
export async function processRecurringIncome(
  supabase: SupabaseClient<Database>,
  recurring: RecurringIncomeRow,
): Promise<void> {
  // Fetch account currency
  const { data: account } = await supabase
    .from("accounts")
    .select("currency")
    .eq("id", recurring.account_id)
    .single();

  const accountCurrency = account?.currency || "EUR";

  // Generate the income
  await generateSingleIncome(
    supabase,
    recurring,
    recurring.next_occurrence,
    accountCurrency,
  );

  // Calculate next occurrence
  const rule = buildRecurrenceRule(recurring);
  const nextDate = calculateNextOccurrence(
    rule,
    new Date(recurring.next_occurrence),
  );

  // Update recurring record
  if (
    nextDate &&
    (!recurring.end_date || nextDate <= new Date(recurring.end_date))
  ) {
    await supabase
      .from("recurring_incomes")
      .update({
        next_occurrence: nextDate.toISOString().split("T")[0],
        last_generated_date: recurring.next_occurrence,
      })
      .eq("id", recurring.id);
  } else {
    // End date reached or no more occurrences
    await supabase
      .from("recurring_incomes")
      .update({
        is_active: false,
        last_generated_date: recurring.next_occurrence,
      })
      .eq("id", recurring.id);
  }
}
