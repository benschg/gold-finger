import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sanitizeDbError } from "@/lib/api-errors";
import { checkAccountMembership } from "@/lib/api-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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
  const { isMember } = await checkAccountMembership(
    supabase,
    accountId,
    user.id,
  );
  if (!isMember) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get all members with their profiles
  const { data: members, error } = await supabase
    .from("account_members")
    .select(
      `
      user_id,
      role,
      joined_at,
      profile:profiles(id, avatar_url)
    `,
    )
    .eq("account_id", accountId)
    .order("joined_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "GET /api/accounts/[id]/members") },
      { status: 500 },
    );
  }

  return NextResponse.json(members || []);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
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

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("user_id");

  if (!memberId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  // Check if current user is a member
  const { isMember, role } = await checkAccountMembership(
    supabase,
    accountId,
    user.id,
  );
  if (!isMember) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // User can remove themselves (leave) or owners can remove others
  const isSelf = memberId === user.id;
  const isOwner = role === "owner";

  if (!isSelf && !isOwner) {
    return NextResponse.json(
      { error: "Only owners can remove members" },
      { status: 403 },
    );
  }

  // Check if trying to remove the last owner
  if (isOwner && isSelf) {
    const { data: owners } = await supabase
      .from("account_members")
      .select("user_id")
      .eq("account_id", accountId)
      .eq("role", "owner");

    if (owners && owners.length === 1) {
      return NextResponse.json(
        {
          error:
            "Cannot leave: you are the only owner. Transfer ownership or delete the account.",
        },
        { status: 400 },
      );
    }
  }

  // Remove member
  const { error } = await supabase
    .from("account_members")
    .delete()
    .eq("account_id", accountId)
    .eq("user_id", memberId);

  if (error) {
    return NextResponse.json(
      { error: sanitizeDbError(error, "DELETE /api/accounts/[id]/members") },
      { status: 500 },
    );
  }

  return new NextResponse(null, { status: 204 });
}
