import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  defaultLocale,
  isValidLocale,
  LOCALE_COOKIE_NAME,
} from "@/i18n/config";

// Detect locale from Accept-Language header
function detectLocaleFromHeader(request: NextRequest): string {
  const acceptLanguage = request.headers.get("Accept-Language");
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,de;q=0.8")
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, q = "q=1"] = lang.trim().split(";");
      return {
        code: code.split("-")[0], // Get primary language code
        quality: parseFloat(q.replace("q=", "")) || 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first matching locale
  for (const { code } of languages) {
    if (isValidLocale(code)) {
      return code;
    }
  }

  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Handle locale cookie
  let locale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  // If no cookie or invalid locale, detect from Accept-Language
  if (!locale || !isValidLocale(locale)) {
    locale = detectLocaleFromHeader(request);

    // Set cookie in response
    supabaseResponse.cookies.set(LOCALE_COOKIE_NAME, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  // Protected routes that require auth
  const protectedRoutes = ["/dashboard", "/expenses", "/accounts", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Redirect unauthenticated users from protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users from auth pages to dashboard
  if (user && (pathname === "/login" || pathname === "/verify")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
