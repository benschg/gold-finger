import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { CreateAccountInput } from "@/types/database";

export async function GET() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get accounts where user is a member
  const { data: memberships, error: memberError } = await supabase
    .from("account_members")
    .select(
      `
      role,
      account:accounts(*)
    `
    )
    .eq("user_id", user.id);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const accounts = memberships?.map((m) => ({
    ...m.account,
    role: m.role,
  }));

  return NextResponse.json(accounts || []);
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

  const body: CreateAccountInput = await request.json();

  // Validate required fields
  if (!body.name) {
    return NextResponse.json(
      { error: "Missing required field: name" },
      { status: 400 }
    );
  }

  // Create account
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .insert({
      name: body.name,
      icon: body.icon || "wallet",
      color: body.color || "#6366f1",
    })
    .select()
    .single();

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 500 });
  }

  // Add user as owner
  const { error: memberError } = await supabase.from("account_members").insert({
    account_id: account.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    // Rollback account creation
    await supabase.from("accounts").delete().eq("id", account.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ ...account, role: "owner" }, { status: 201 });
}
