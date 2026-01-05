import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createExpenseSchema } from "@/lib/validations/schemas";

export async function GET(request: Request) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get query params
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("account_id");
  const categoryId = searchParams.get("category_id");
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!accountId) {
    return NextResponse.json(
      { error: "account_id is required" },
      { status: 400 }
    );
  }

  // Build query
  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      category:categories(id, name, icon, color)
    `
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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
      `
      )
      .in("expense_id", expenseIds);

    // Attach tags to expenses
    const expensesWithTags = expenses?.map((expense) => ({
      ...expense,
      tags:
        expenseTags
          ?.filter((et) => et.expense_id === expense.id)
          .map((et) => et.tag) || [],
    }));

    return NextResponse.json(expensesWithTags);
  }

  return NextResponse.json(
    expenses?.map((e) => ({ ...e, tags: [] })) || []
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = createExpenseSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // Insert expense
  const { data: expense, error } = await supabase
    .from("expenses")
    .insert({
      account_id: body.account_id,
      user_id: user.id,
      amount: body.amount,
      currency: body.currency,
      description: body.description || null,
      date: body.date,
      category_id: body.category_id || null,
      receipt_url: body.receipt_url || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert tags if provided
  if (body.tag_ids && body.tag_ids.length > 0) {
    const tagInserts = body.tag_ids.map((tagId) => ({
      expense_id: expense.id,
      tag_id: tagId,
    }));

    await supabase.from("expense_tags").insert(tagInserts);
  }

  return NextResponse.json(expense, { status: 201 });
}
