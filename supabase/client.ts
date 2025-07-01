import { createBrowserClient } from "@supabase/ssr";

export const createClient = () => {
  console.log("🔧 [CLIENT DEBUG] Creating browser client with:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "[PRESENT]" : "[MISSING]",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "[PRESENT]"
      : "[MISSING]",
    timestamp: new Date().toISOString(),
  });

  return createBrowserClient(
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
};
