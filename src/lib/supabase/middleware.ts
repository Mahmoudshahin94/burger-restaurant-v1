import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

export async function updateSession(request: NextRequest) {
  // Must be `let` so setAll can reassign it with the updated request context
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        // Recommended pattern: pass options to request cookies AND reassign
        // supabaseResponse so downstream code sees the updated request context.
        // This prevents stale cookie state and the token-rotation race condition.
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Use getSession() here instead of getUser() — getSession() reads the JWT
  // locally from the cookie without a server-side network call, keeping every
  // page load fast regardless of auth state.  The actual cryptographic
  // verification still happens in server components (e.g. admin dashboard
  // layout) via getUser() where security matters.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;

  // Helper: redirect while preserving the refreshed auth cookies so the
  // new tokens are not lost when a redirect response is returned.
  function redirectWithCookies(url: URL) {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  }

  // Protect admin routes — role check is intentionally NOT done here to avoid
  // a DB round-trip on every request. The admin layout handles the role check.
  if (pathname.startsWith("/admin/dashboard")) {
    if (!user) {
      return redirectWithCookies(new URL("/admin/login", request.url));
    }
  }

  // Protect user routes — require authentication
  if (
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/account")
  ) {
    if (!user) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return redirectWithCookies(loginUrl);
    }
  }

  // IMPORTANT: always return supabaseResponse (never a plain NextResponse.next())
  // so the refreshed auth cookies are forwarded to the browser.
  return supabaseResponse;
}
