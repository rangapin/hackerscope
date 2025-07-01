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

  const cookieStore = cookies();

  return createServerClient(
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
};
