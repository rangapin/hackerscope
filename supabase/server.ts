import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  console.log("🔧 [SERVER DEBUG] Creating fresh server client:", {
    timestamp: new Date().toISOString(),
  });

  // Get environment variables with fallback error handling
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("🔍 [API KEY DEBUG] Server environment variables check:", {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "[PRESENT]" : "[MISSING]",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "[PRESENT]" : "[MISSING]",
    timestamp: new Date().toISOString(),
  });

  // Critical validation with detailed error messages
  if (!supabaseUrl) {
    const error = new Error(
      "NEXT_PUBLIC_SUPABASE_URL environment variable is not defined. Please check your environment configuration.",
    );
    console.error(
      "❌ [CRITICAL ERROR] Missing Supabase URL in server:",
      error.message,
    );
    throw error;
  }

  if (!supabaseAnonKey) {
    const error = new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not defined. Please check your environment configuration.",
    );
    console.error(
      "❌ [CRITICAL ERROR] Missing Supabase Anon Key in server:",
      error.message,
    );
    throw error;
  }

  const cookieStore = cookies();

  // Create fresh client instance every time to ensure proper authentication
  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        try {
          return cookieStore.getAll().map(({ name, value }) => ({
            name,
            value,
          }));
        } catch (error) {
          console.warn("[SERVER DEBUG] Cookie access error:", error);
          return [];
        }
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          console.warn("[SERVER DEBUG] Cookie set error:", error);
        }
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    global: {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
    },
  });

  console.log("✅ [SERVER DEBUG] Fresh server client created successfully:", {
    clientExists: !!client,
    timestamp: new Date().toISOString(),
  });

  return client;
};
