import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  console.log("🔧 [CLIENT DEBUG] Creating browser client with:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "[PRESENT]" : "[MISSING]",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "[PRESENT]"
      : "[MISSING]",
    timestamp: new Date().toISOString(),
  });

  // Debug: Log the actual environment variable values (first 10 chars only for security)
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

  const client = createBrowserClient(
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
    },
  );

  console.log("✅ [CLIENT DEBUG] Browser client created successfully:", {
    clientExists: !!client,
    timestamp: new Date().toISOString(),
  });

  return client;
};
