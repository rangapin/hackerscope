import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export const createClient = () => {
  console.log("🔧 [CLIENT DEBUG] Creating fresh browser client:", {
    timestamp: new Date().toISOString(),
  });

  // Get environment variables with fallback error handling
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("🔍 [API KEY DEBUG] Environment variables check:", {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? "[PRESENT]" : "[MISSING]",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? "[PRESENT]" : "[MISSING]",
    timestamp: new Date().toISOString(),
  });

  // Critical validation with detailed error messages
  if (!supabaseUrl) {
    const error = new Error(
      "NEXT_PUBLIC_SUPABASE_URL environment variable is not defined. Please check your environment configuration.",
    );
    console.error("❌ [CRITICAL ERROR] Missing Supabase URL:", error.message);
    throw error;
  }

  if (!supabaseAnonKey) {
    const error = new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is not defined. Please check your environment configuration.",
    );
    console.error(
      "❌ [CRITICAL ERROR] Missing Supabase Anon Key:",
      error.message,
    );
    throw error;
  }

  // Create fresh client instance every time to avoid stale authentication
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    db: {
      schema: "public",
    },
  });

  console.log("✅ [CLIENT DEBUG] Fresh browser client created successfully:", {
    clientExists: !!client,
    timestamp: new Date().toISOString(),
  });

  return client;
};
