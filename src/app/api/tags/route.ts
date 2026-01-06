import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createTagSchema } from "@/lib/validations/schemas";
import { sanitizeDbError } from "@/lib/api-errors";

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

  if (!accountId) {
    return NextResponse.json(
      { error: "account_id is required" },
      { status: 400 }
    );
  }

  // Verify user is a member of this account
  const { data: membership } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = createTagSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // Verify user is a member of this account
  const { data: membership } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", body.account_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  const { data: membership } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", tag.account_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "DELETE /api/tags") },
      { status: 500 }
    );
  }

  return new NextResponse(null, { status: 204 });
}
