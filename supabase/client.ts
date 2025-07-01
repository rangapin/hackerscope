import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton instance to ensure we use the same client across the app
let supabaseClient: SupabaseClient | null = null;

export const createClient = () => {
  // Return existing client if already created
  if (supabaseClient) {
    console.log("🔄 [CLIENT DEBUG] Returning existing browser client:", {
      clientExists: !!supabaseClient,
      timestamp: new Date().toISOString(),
    });
    return supabaseClient;
  }

  console.log("🔧 [CLIENT DEBUG] Creating new browser client with:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "[PRESENT]" : "[MISSING]",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "[PRESENT]"
      : "[MISSING]",
    timestamp: new Date().toISOString(),
  });

  // Debug: Log the actual environment variable values (first 30 chars for URL, 20 for key)
  console.log("🔍 [API KEY DEBUG] Browser client environment variables:", {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...`
      : "[UNDEFINED]",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
      : "[UNDEFINED]",
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });

  // Validate that required environment variables are present
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error(
      "❌ [API KEY DEBUG] NEXT_PUBLIC_SUPABASE_URL is missing in browser client!",
    );
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error(
      "❌ [API KEY DEBUG] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in browser client!",
    );
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable",
    );
  }

  // Create the client with enhanced configuration
  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
      global: {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
      },
    },
  );

  console.log("✅ [CLIENT DEBUG] Browser client created successfully:", {
    clientExists: !!supabaseClient,
    hasApiKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    timestamp: new Date().toISOString(),
  });

  return supabaseClient;
};

// Function to reset the client (useful for testing or when auth state changes)
export const resetClient = () => {
  console.log("🔄 [CLIENT DEBUG] Resetting browser client");
  supabaseClient = null;
};
