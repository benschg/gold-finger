import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createAccountSchema } from "@/lib/validations/schemas";

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
  const adminClient = createAdminClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = createAccountSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const body = parsed.data;

  // Create account using admin client (bypasses RLS)
  const { data: account, error: accountError } = await adminClient
    .from("accounts")
    .insert({
      name: body.name,
      icon: body.icon || "wallet",
      color: body.color || "#6366f1",
      currency: body.currency || "EUR",
    })
    .select()
    .single();

  if (accountError) {
    console.error("Account creation error:", accountError);
    return NextResponse.json({ error: accountError.message }, { status: 500 });
  }

  // Add user as owner using admin client
  const { error: memberError } = await adminClient
    .from("account_members")
    .insert({
      account_id: account.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    console.error("Member insert error:", memberError);
    // Rollback account creation
    await adminClient.from("accounts").delete().eq("id", account.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ ...account, role: "owner" }, { status: 201 });
}
