import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { inviteUserSchema } from "@/lib/validations/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: accountId } = await params;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is owner
  const { data: membership } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      { error: "Only owners can invite members" },
      { status: 403 }
    );
  }

  const json = await request.json();
  const parsed = inviteUserSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // Check for existing pending invitation
  const { data: existingInvite } = await supabase
    .from("account_invitations")
    .select("id")
    .eq("account_id", accountId)
    .eq("invitee_email", email.toLowerCase())
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existingInvite) {
    return NextResponse.json(
      { error: "Invitation already sent" },
      { status: 400 }
    );
  }

  // Create invitation (expires in 7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data: invitation, error } = await supabase
    .from("account_invitations")
    .insert({
      account_id: accountId,
      invitee_email: email.toLowerCase(),
      inviter_id: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: Send invitation email

  return NextResponse.json(invitation, { status: 201 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: accountId } = await params;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check membership
  const { data: membership } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get pending invitations
  const { data: invitations, error } = await supabase
    .from("account_invitations")
    .select("*")
    .eq("account_id", accountId)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(invitations || []);
}
