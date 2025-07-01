import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { checkUserSubscription } from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Loader2 } from "lucide-react";
import { LibraryClient } from "@/components/library-client";
import { headers } from "next/headers";

// Force dynamic rendering to prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
// Disable all caching layers
export const fetchCache = "force-no-store";
export const runtime = "nodejs";

// Add cache headers to prevent browser caching
export async function generateMetadata() {
  return {
    other: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  };
}

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_liked: boolean;
  idea_id: string;
}

interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
  market_size: string;
  target_audience: string;
  revenue_streams: any[];
  validation_data: any;
  preferences: string;
  constraints: string;
  industry: string;
  created_at: string;
}

async function getSavedIdeasWithDetails(
  userEmail: string,
): Promise<(SavedIdea & { generated_idea?: GeneratedIdea })[]> {
  console.log(
    "🔄 [CACHE DEBUG] Library Page - Starting getSavedIdeasWithDetails:",
    {
      userEmail,
      timestamp: new Date().toISOString(),
      cacheHeaders: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );

  const supabase = await createClient();

  // Debug: Check if the Supabase client was created with proper API key
  console.log(
    "🔍 [API KEY DEBUG] Supabase client in getSavedIdeasWithDetails:",
    {
      clientExists: !!supabase,
      timestamp: new Date().toISOString(),
    },
  );

  // Check authentication and JWT token
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  console.log("🔍 [406 DEBUG] Library Page - Auth check:", {
    hasUser: !!authUser.user,
    userId: authUser.user?.id,
    userEmail: authUser.user?.email,
    authError: authError
      ? {
          code: authError.code,
          message: authError.message,
        }
      : null,
    requestEmail: userEmail,
    timestamp: new Date().toISOString(),
  });

  // Check session and JWT token
  const { data: session, error: sessionError } =
    await supabase.auth.getSession();
  console.log("🔍 [406 DEBUG] Library Page - Session check:", {
    hasSession: !!session.session,
    accessToken: session.session?.access_token ? "[PRESENT]" : "[MISSING]",
    refreshToken: session.session?.refresh_token ? "[PRESENT]" : "[MISSING]",
    expiresAt: session.session?.expires_at,
    tokenType: session.session?.token_type,
    sessionError: sessionError
      ? {
          code: sessionError.code,
          message: sessionError.message,
        }
      : null,
    timestamp: new Date().toISOString(),
  });

  // CRITICAL DEBUG: Compare client configurations
  console.log(
    "🔍 [CLIENT CONFIG DEBUG] Library Page - Fetching operation client config:",
    {
      clientType: "server-side",
      context: "server component",
      authMethod: "server-side auth.getUser()",
      hasAccessToken: session.session?.access_token ? "[PRESENT]" : "[MISSING]",
      tokenType: session.session?.token_type,
      userFromAuth: {
        id: authUser.user?.id,
        email: authUser.user?.email,
        role: authUser.user?.role,
      },
      timestamp: new Date().toISOString(),
    },
  );

  // Force fresh data by adding timestamp to prevent any client-side caching
  const cacheBreaker = Date.now();

  // Get saved ideas with cache-busting
  console.log("🔍 [CACHE DEBUG] Fetching saved_ideas with cache breaker:", {
    userEmail,
    cacheBreaker,
    timestamp: new Date().toISOString(),
  });

  const { data: savedIdeas, error: savedError } = await supabase
    .from("saved_ideas")
    .select("*")
    .eq("user_email", userEmail)
    .order("created_at", { ascending: false })
    .limit(1000); // Add explicit limit to prevent caching issues

  if (savedError) {
    console.error("❌ [406 DEBUG] Library Page - Error loading saved ideas:", {
      code: savedError.code,
      message: savedError.message,
      hint: savedError.hint,
      userEmail,
      timestamp: new Date().toISOString(),
    });
    return [];
  }

  console.log("📊 [DEBUG] Library Page - Fetched saved ideas:", {
    count: savedIdeas?.length || 0,
    ideas:
      savedIdeas?.map((idea) => ({
        id: idea.id,
        title: idea.title,
        created_at: idea.created_at,
      })) || [],
    timestamp: new Date().toISOString(),
  });

  if (!savedIdeas || savedIdeas.length === 0) {
    console.log("📭 [DEBUG] Library Page - No saved ideas found");
    return [];
  }

  // Get the corresponding generated ideas for detailed information
  const ideaIds = savedIdeas.map((idea) => idea.idea_id);
  console.log(
    "🔍 [CACHE DEBUG] Library Page - Fetching generated ideas for IDs:",
    {
      ideaIds,
      cacheBreaker,
      timestamp: new Date().toISOString(),
    },
  );

  console.log("🔍 [API KEY DEBUG] About to query generated_ideas table:", {
    ideaIds,
    ideaIdsCount: ideaIds.length,
    userEmail,
    supabaseClientExists: !!supabase,
    timestamp: new Date().toISOString(),
  });

  const { data: generatedIdeas, error: generatedError } = await supabase
    .from("generated_ideas")
    .select("*")
    .in("id", ideaIds)
    .limit(1000); // Add explicit limit to prevent caching issues

  if (generatedError) {
    console.error(
      "❌ [406 DEBUG] Library Page - Error loading generated ideas:",
      {
        code: generatedError.code,
        message: generatedError.message,
        hint: generatedError.hint,
        ideaIds,
        userEmail,
        timestamp: new Date().toISOString(),
      },
    );
    return savedIdeas;
  }

  console.log("📊 [DEBUG] Library Page - Fetched generated ideas:", {
    count: generatedIdeas?.length || 0,
    ideas:
      generatedIdeas?.map((idea) => ({ id: idea.id, title: idea.title })) || [],
    timestamp: new Date().toISOString(),
  });

  // Merge the data
  const mergedIdeas = savedIdeas.map((savedIdea) => {
    const generatedIdea = generatedIdeas?.find(
      (gi) => gi.id === savedIdea.idea_id,
    );
    return {
      ...savedIdea,
      generated_idea: generatedIdea,
    };
  });

  console.log("✅ [DEBUG] Library Page - Completed getSavedIdeasWithDetails:", {
    mergedCount: mergedIdeas.length,
    timestamp: new Date().toISOString(),
  });

  return mergedIdeas;
}

export default async function LibraryPage() {
  console.log("🚀 [CACHE DEBUG] Library Page - Component rendering started:", {
    timestamp: new Date().toISOString(),
    renderType: "force-dynamic",
    revalidate: 0,
    fetchCache: "force-no-store",
  });

  // Force dynamic rendering to prevent caching issues
  const headersList = headers();
  const timestamp = headersList.get("x-timestamp") || Date.now();
  const cacheControl = headersList.get("cache-control");

  console.log("📋 [CACHE DEBUG] Request headers analysis:", {
    timestamp,
    cacheControl,
    userAgent: headersList.get("user-agent")?.substring(0, 50),
    requestTime: new Date().toISOString(),
  });

  const supabase = await createClient();

  // Debug: Check if the Supabase client was created with proper API key
  console.log(
    "🔍 [API KEY DEBUG] Supabase client in LibraryPage main function:",
    {
      clientExists: !!supabase,
      timestamp: new Date().toISOString(),
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log(
      "❌ [DEBUG] Library Page - No user found, redirecting to sign-in",
    );
    return redirect("/sign-in");
  }

  console.log("👤 [DEBUG] Library Page - User authenticated:", {
    userId: user.id,
    email: user.email,
    timestamp: new Date().toISOString(),
  });

  console.log("🔄 [CACHE DEBUG] Starting data fetching operations:", {
    userId: user.id,
    userEmail: user.email,
    timestamp: new Date().toISOString(),
  });

  const isSubscribed = await checkUserSubscription(user.id);
  const savedIdeas = await getSavedIdeasWithDetails(user.email || "");

  console.log("📋 [CACHE DEBUG] Library Page - Final data before render:", {
    savedIdeasCount: savedIdeas.length,
    isSubscribed,
    userId: user.id,
    userEmail: user.email,
    renderTimestamp: new Date().toISOString(),
    dataFreshness: {
      savedIdeasFetched: new Date().toISOString(),
      subscriptionChecked: new Date().toISOString(),
    },
  });

  console.log("🎨 [CACHE DEBUG] Library Page - Starting render with data:", {
    savedIdeasCount: savedIdeas.length,
    isSubscribed,
    renderStart: new Date().toISOString(),
  });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFDFB" }}>
      <DashboardNavbar user={user} isSubscribed={isSubscribed} />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1
                className="text-3xl md:text-3xl font-bold flex items-center gap-3"
                style={{ fontSize: "24px" }}
              >
                <BookOpen className="w-8 h-8 text-black" />
                <span className="md:text-3xl" style={{ fontSize: "24px" }}>
                  Your Ideas Library
                </span>
              </h1>
              <p className="text-gray-600">
                All your saved startup ideas in one place
              </p>
            </div>

            {/* Ideas Grid */}
            <LibraryClient savedIdeas={savedIdeas} />
          </div>
        </div>
      </main>
    </div>
  );
}
