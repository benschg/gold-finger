import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Validate redirect path to prevent open redirect attacks
function isValidRedirectPath(path: string): boolean {
  // Must start with / and not with // (protocol-relative URL)
  if (!path.startsWith("/") || path.startsWith("//")) {
    return false;
  }
  // Disallow any URL-like patterns that could redirect externally
  if (path.includes(":") || path.includes("@")) {
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/dashboard";

  // Validate the next parameter to prevent open redirects
  const next = isValidRedirectPath(rawNext) ? rawNext : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
