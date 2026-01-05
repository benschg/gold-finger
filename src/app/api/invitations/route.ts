import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Get pending invitations for current user
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get invitations for user's email
  const { data: invitations, error } = await supabase
    .from("account_invitations")
    .select(
      `
      *,
      account:accounts(id, name, icon, color)
    `
    )
    .eq("email", user.email?.toLowerCase())
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(invitations || []);
}
