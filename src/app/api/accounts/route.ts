import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createAccountSchema } from "@/lib/validations/schemas";
import { sanitizeDbError } from "@/lib/api-errors";
import { requireAuth, validateRequest } from "@/lib/api-helpers";

export async function GET() {
  const supabase = await createClient();

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  // Get accounts where user is a member
  const { data: memberships, error: memberError } = await supabase
    .from("account_members")
    .select(
      `
      role,
      account:accounts(*)
    `,
    )
    .eq("user_id", user.id);

  if (memberError) {
    return NextResponse.json(
      { error: sanitizeDbError(memberError, "GET /api/accounts") },
      { status: 500 },
    );
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

  const auth = await requireAuth(supabase);
  if (auth.error) return auth.error;
  const { user } = auth;

  const json = await request.json();
  const validation = validateRequest(createAccountSchema, json);
  if (validation.error) return validation.error;
  const body = validation.data;

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
    return NextResponse.json(
      { error: sanitizeDbError(accountError, "POST /api/accounts") },
      { status: 500 },
    );
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
    // Rollback account creation
    await adminClient.from("accounts").delete().eq("id", account.id);
    return NextResponse.json(
      { error: sanitizeDbError(memberError, "POST /api/accounts (member)") },
      { status: 500 },
    );
  }

  return NextResponse.json({ ...account, role: "owner" }, { status: 201 });
}
