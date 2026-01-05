import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Accept invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: invitationId } = await params;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get invitation
  const { data: invitation, error: inviteError } = await supabase
    .from("account_invitations")
    .select("*")
    .eq("id", invitationId)
    .single();

  if (inviteError || !invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  // Verify the invitation is for this user
  if (invitation.invitee_email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json(
      { error: "This invitation is not for you" },
      { status: 403 }
    );
  }

  // Check if expired
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json(
      { error: "Invitation has expired" },
      { status: 400 }
    );
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("account_members")
    .select("user_id")
    .eq("account_id", invitation.account_id)
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    // Delete the invitation since they're already a member
    await supabase
      .from("account_invitations")
      .delete()
      .eq("id", invitationId);

    return NextResponse.json(
      { error: "You are already a member of this account" },
      { status: 400 }
    );
  }

  // Add user as member
  const { error: memberError } = await supabase
    .from("account_members")
    .insert({
      account_id: invitation.account_id,
      user_id: user.id,
      role: "member",
    });

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  // Delete the invitation
  await supabase
    .from("account_invitations")
    .delete()
    .eq("id", invitationId);

  // Get the account details
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", invitation.account_id)
    .single();

  return NextResponse.json({
    message: "Invitation accepted",
    account,
  });
}

// Decline invitation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: invitationId } = await params;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get invitation
  const { data: invitation, error: inviteError } = await supabase
    .from("account_invitations")
    .select("*")
    .eq("id", invitationId)
    .single();

  if (inviteError || !invitation) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  }

  // Verify the invitation is for this user OR user is account owner
  const isRecipient = invitation.invitee_email.toLowerCase() === user.email?.toLowerCase();

  let isOwner = false;
  if (!isRecipient) {
    const { data: membership } = await supabase
      .from("account_members")
      .select("role")
      .eq("account_id", invitation.account_id)
      .eq("user_id", user.id)
      .single();

    isOwner = membership?.role === "owner";
  }

  if (!isRecipient && !isOwner) {
    return NextResponse.json(
      { error: "Not authorized to decline this invitation" },
      { status: 403 }
    );
  }

  // Delete the invitation
  const { error } = await supabase
    .from("account_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
