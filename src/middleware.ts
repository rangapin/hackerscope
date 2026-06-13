import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Skip middleware for auth callback route
  if (req.nextUrl.pathname.startsWith('/auth/callback')) {
    return res;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            });
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Handle refresh token errors gracefully
  if (error && error.message?.includes("refresh_token_not_found")) {
    // Clear invalid session cookies
    res.cookies.delete("sb-access-token");
    res.cookies.delete("sb-refresh-token");
  }

  // Protected routes - redirect to sign-in if not authenticated
  if (req.nextUrl.pathname.startsWith("/dashboard") && (error || !user)) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Redirect authenticated users from root to dashboard
  if (req.nextUrl.pathname === "/" && user && !error) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

// Ensure the middleware is only called for relevant paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/payments/webhook (webhook endpoints)
     * - auth/callback (auth callback route)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/payments/webhook|auth/callback).*)",
  ],
};
