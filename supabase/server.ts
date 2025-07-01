import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = async () => {
  console.log("🔧 [SERVER DEBUG] Creating server client with:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "[PRESENT]" : "[MISSING]",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "[PRESENT]"
      : "[MISSING]",
    timestamp: new Date().toISOString(),
  });

  // Debug: Log the actual environment variable values (first 10 chars only for security)
  console.log("🔍 [API KEY DEBUG] Server client environment variables:", {
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
      "❌ [API KEY DEBUG] NEXT_PUBLIC_SUPABASE_URL is missing in server client!",
    );
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error(
      "❌ [API KEY DEBUG] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in server client!",
    );
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable",
    );
  }

  const cookieStore = cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll().map(({ name, value }) => ({
              name,
              value,
            }));
          } catch (error) {
            // If cookies() is called in an environment where it's not allowed
            return [];
          }
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // If cookies() is called in an environment where it's not allowed
            // Silently handle the error
          }
        },
      },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  console.log("✅ [SERVER DEBUG] Server client created successfully:", {
    clientExists: !!client,
    timestamp: new Date().toISOString(),
  });

  return client;
};
