import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { updateCategorySchema } from "@/lib/validations/schemas";
import { sanitizeDbError } from "@/lib/api-errors";
import {
  requireAuth,
  requireAccountMembership,
  validateRequest,
} from "@/lib/api-helpers";

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
  const validation = validateRequest(updateCategorySchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

  // Get the category to verify account membership
  const { data: category, error: fetchError } = await supabase
    .from("categories")
    .select("account_id")
    .eq("id", id)
    .single();

  if (fetchError || !category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    category.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.icon !== undefined) updateData.icon = body.icon;
  if (body.color !== undefined) updateData.color = body.color;

  const { data: updatedCategory, error } = await supabase
    .from("categories")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "PUT /api/categories/[id]") },
      { status: 500 },
    );
  }

  return NextResponse.json(updatedCategory);
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

  // Get the category to verify account membership
  const { data: category, error: fetchError } = await supabase
    .from("categories")
    .select("account_id")
    .eq("id", id)
    .single();

  if (fetchError || !category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    category.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  // Delete the category (expenses will have category_id set to null due to ON DELETE SET NULL)
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "DELETE /api/categories/[id]") },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
