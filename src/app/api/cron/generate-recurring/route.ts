import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  processRecurringExpense,
  processRecurringIncome,
} from "@/lib/recurring-generator";

// Vercel cron: runs daily at 00:05 UTC
export const dynamic = "force-dynamic";

interface GenerationResult {
  expenses: {
    processed: number;
    generated: number;
    errors: number;
  };
  incomes: {
    processed: number;
    generated: number;
    errors: number;
  };
}

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date().toISOString().split("T")[0];

  const result: GenerationResult = {
    expenses: { processed: 0, generated: 0, errors: 0 },
    incomes: { processed: 0, generated: 0, errors: 0 },
  };

  // Process recurring expenses
  const { data: dueExpenses, error: expensesFetchError } = await supabase
    .from("recurring_expenses")
    .select("*")
    .eq("is_active", true)
    .lte("next_occurrence", today);

  if (expensesFetchError) {
    console.error("Error fetching due expenses:", expensesFetchError);
  } else if (dueExpenses) {
    for (const recurring of dueExpenses) {
      result.expenses.processed++;
      try {
        await processRecurringExpense(supabase, recurring);
        result.expenses.generated++;
      } catch (error) {
        console.error(`Error generating expense for ${recurring.id}:`, error);
        result.expenses.errors++;
      }
    }
  }

  // Process recurring incomes
  const { data: dueIncomes, error: incomesFetchError } = await supabase
    .from("recurring_incomes")
    .select("*")
    .eq("is_active", true)
    .lte("next_occurrence", today);

  if (incomesFetchError) {
    console.error("Error fetching due incomes:", incomesFetchError);
  } else if (dueIncomes) {
    for (const recurring of dueIncomes) {
      result.incomes.processed++;
      try {
        await processRecurringIncome(supabase, recurring);
        result.incomes.generated++;
      } catch (error) {
        console.error(`Error generating income for ${recurring.id}:`, error);
        result.incomes.errors++;
      }
    }
  }

  return NextResponse.json({
    success: true,
    date: today,
    result,
  });
}
