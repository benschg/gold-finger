import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/types/database.types";
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimitConfig,
} from "./rate-limit";

type AccountRole = "owner" | "member";

interface MembershipResult {
  isMember: boolean;
  role: AccountRole | null;
}

/**
 * Check if a user is a member of an account.
 * Returns membership status and role.
 */
export async function checkAccountMembership(
  supabase: SupabaseClient<Database>,
  accountId: string,
  userId: string
): Promise<MembershipResult> {
  const { data: membership } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .single();

  return {
    isMember: !!membership,
    role: membership?.role as AccountRole | null,
  };
}

/**
 * Require that a user is a member of an account.
 * Returns a 403 response if not a member, or null if authorized.
 */
export async function requireAccountMembership(
  supabase: SupabaseClient<Database>,
  accountId: string,
  userId: string
): Promise<NextResponse | null> {
  const { isMember } = await checkAccountMembership(supabase, accountId, userId);

  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}

/**
 * Require that a user is an owner of an account.
 * Returns a 403 response if not an owner, or null if authorized.
 */
export async function requireAccountOwner(
  supabase: SupabaseClient<Database>,
  accountId: string,
  userId: string,
  errorMessage = "Only owners can perform this action"
): Promise<NextResponse | null> {
  const { isMember, role } = await checkAccountMembership(
    supabase,
    accountId,
    userId
  );

  if (!isMember || role !== "owner") {
    return NextResponse.json({ error: errorMessage }, { status: 403 });
  }

  return null;
}

/**
 * Apply rate limiting and return error response if limit exceeded.
 * Returns a 429 response if rate limited, or null if allowed.
 */
export function applyRateLimit(
  request: Request,
  userId: string,
  config: RateLimitConfig
): NextResponse | null {
  const identifier = getClientIdentifier(request, userId);
  const result = checkRateLimit(identifier, config);

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((result.resetTime - Date.now()) / 1000)
          ),
        },
      }
    );
  }

  return null;
}
