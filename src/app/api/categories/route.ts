import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { CreateCategoryInput } from "@/types/database";

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

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .eq("account_id", accountId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(categories);
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

  const body: CreateCategoryInput = await request.json();

  // Validate required fields
  if (!body.account_id || !body.name || !body.icon || !body.color) {
    return NextResponse.json(
      { error: "Missing required fields: account_id, name, icon, color" },
      { status: 400 }
    );
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(category, { status: 201 });
}
