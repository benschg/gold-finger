import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createCategorySchema } from "@/lib/validations/schemas";
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

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .eq("account_id", accountId)
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "GET /api/categories") },
      { status: 500 },
    );
  }

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const json = await request.json();
  const validation = validateRequest(createCategorySchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(
    supabase,
    body.account_id,
    user.id,
  );
  if (membershipError) return membershipError;

  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      account_id: body.account_id,
      name: body.name,
      icon: body.icon,
      color: body.color,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "POST /api/categories") },
      { status: 500 },
    );
  }

  return NextResponse.json(category, { status: 201 });
}
