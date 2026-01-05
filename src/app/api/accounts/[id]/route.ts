import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

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
    .eq("account_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get account with members
  const { data: account, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get all members
  const { data: members } = await supabase
    .from("account_members")
    .select(
      `
      user_id,
      role,
      joined_at
    `
    )
    .eq("account_id", id);

  // Get user emails from auth (via profiles or user lookup)
  const memberIds = members?.map((m) => m.user_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .in("id", memberIds);

  return NextResponse.json({
    ...account,
    role: membership.role,
    members: members?.map((m) => ({
      ...m,
      profile: profiles?.find((p) => p.id === m.user_id),
    })),
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

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
    .eq("account_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      { error: "Only owners can update accounts" },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.icon !== undefined) updateData.icon = body.icon;
  if (body.color !== undefined) updateData.color = body.color;

  const { data: account, error } = await supabase
    .from("accounts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(account);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

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
    .eq("account_id", id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") {
    return NextResponse.json(
      { error: "Only owners can delete accounts" },
      { status: 403 }
    );
  }

  // Delete account (cascade will handle members, expenses, etc.)
  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
