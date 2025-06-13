import { createClient } from "../../../../../supabase/server";
import { NextResponse } from "next/server";

// Allowed redirect URLs to prevent open redirect attacks
const ALLOWED_REDIRECTS = ["/dashboard", "/library", "/profile", "/pricing"];

function validateRedirectUrl(url: string): string {
  // Remove any protocol or domain
  const path = url.replace(/^https?:\/\/[^/]+/, "");

  // Check if it's in our allowed list
  if (ALLOWED_REDIRECTS.includes(path) || path.startsWith("/dashboard/")) {
    return path;
  }

  // Default to dashboard if invalid
  return "/dashboard";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect_to = requestUrl.searchParams.get("redirect_to");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL("/sign-in?error=auth_failed", requestUrl.origin),
      );
    }
  }

  // Always redirect to dashboard after successful authentication
  // regardless of redirect_to parameter for security
  return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
}
