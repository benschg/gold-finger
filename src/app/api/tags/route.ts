import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createTagSchema } from "@/lib/validations/schemas";

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

  const { data: tags, error } = await supabase
    .from("tags")
    .select("*")
    .eq("account_id", accountId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  const { error } = await supabase.from("tags").delete().eq("id", tagId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
