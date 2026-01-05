import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateExpenseSchema } from "@/lib/validations/schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get expense with category
  const { data: expense, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      category:categories(id, name, icon, color)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Get tags
  const { data: expenseTags } = await supabase
    .from("expense_tags")
    .select(
      `
      tag:tags(id, name, color)
    `
    )
    .eq("expense_id", id);

  return NextResponse.json({
    ...expense,
    tags: expenseTags?.map((et) => et.tag) || [],
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = updateExpenseSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // Build update object (only include provided fields)
  const updateData: Record<string, unknown> = {};
  if (body.amount !== undefined) updateData.amount = body.amount;
  if (body.currency !== undefined) updateData.currency = body.currency;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.date !== undefined) updateData.date = body.date;
  if (body.category_id !== undefined) updateData.category_id = body.category_id;
  if (body.receipt_url !== undefined) updateData.receipt_url = body.receipt_url;

  // Update expense
  const { data: expense, error } = await supabase
    .from("expenses")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update tags if provided
  if (body.tag_ids !== undefined) {
    // Remove existing tags
    await supabase.from("expense_tags").delete().eq("expense_id", id);

    // Insert new tags
    if (body.tag_ids.length > 0) {
      const tagInserts = body.tag_ids.map((tagId) => ({
        expense_id: id,
        tag_id: tagId,
      }));
      await supabase.from("expense_tags").insert(tagInserts);
    }
  }

  return NextResponse.json(expense);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete expense (cascade will handle expense_tags)
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
