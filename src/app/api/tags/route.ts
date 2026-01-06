import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createTagSchema } from "@/lib/validations/schemas";
import { sanitizeDbError } from "@/lib/api-errors";
import { requireAuth, requireAccountMembership, validateRequest } from "@/lib/api-helpers";

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
      { status: 400 }
    );
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(supabase, accountId, user.id);
  if (membershipError) return membershipError;

  const { data: tags, error } = await supabase
    .from("tags")
    .select("*")
    .eq("account_id", accountId)
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "GET /api/tags") },
      { status: 500 }
    );
  }

  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const json = await request.json();
  const validation = validateRequest(createTagSchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(supabase, body.account_id, user.id);
  if (membershipError) return membershipError;

  const { data: tag, error } = await supabase
    .from("tags")
    .insert({
      account_id: body.account_id,
      name: body.name,
      color: body.color,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "POST /api/tags") },
      { status: 500 }
    );
  }

  return NextResponse.json(tag, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get("id");

  if (!tagId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // First fetch the tag to get its account_id
  const { data: tag, error: fetchError } = await supabase
    .from("tags")
    .select("account_id")
    .eq("id", tagId)
    .single();

  if (fetchError || !tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // Verify user is a member of this account
  const membershipError = await requireAccountMembership(supabase, tag.account_id, user.id);
  if (membershipError) return membershipError;

  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "DELETE /api/tags") },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
