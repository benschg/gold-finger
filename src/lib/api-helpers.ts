import { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Database } from "@/types/database.types";
import type { AccountRole } from "@/types/database";
import {
  checkRateLimit,
  getClientIdentifier,
  RateLimitConfig,
} from "./rate-limit";

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
    role: membership ? (membership.role as AccountRole) : null,
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

interface AuthResult {
  user: User;
  error: null;
}

interface AuthError {
  user: null;
  error: NextResponse;
}

/**
 * Require authentication for an API route.
 * Returns the authenticated user or an error response.
 */
export async function requireAuth(
  supabase: SupabaseClient<Database>
): Promise<AuthResult | AuthError> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, error: null };
}

interface ValidationResult<T> {
  data: T;
  error: null;
}

interface ValidationError {
  data: null;
  error: NextResponse;
}

/**
 * Validate request body against a Zod schema.
 * Returns the validated data or an error response.
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> | ValidationError {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return {
      data: null,
      error: NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data, error: null };
}
