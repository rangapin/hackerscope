"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import IdeaGenerator from "@/components/IdeaGenerator";
import Footer from "@/components/footer";
import { createClient } from "../../../supabase/client";
import { checkUserSubscription } from "@/app/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SuccessToast } from "@/components/success-toast";
import { FreeIdeaDisplay } from "@/components/free-idea-display";
import { shouldDisableBackgroundFetching } from "@/components/IdeaGenerator";
import type { User } from "@supabase/supabase-js";

// Function to check if user has generated their free idea
async function checkUserHasFreeIdea(userEmail: string, supabaseClient?: any) {
  const supabase = supabaseClient || createClient();

  // Debug: Check if the Supabase client was created with proper API key
  console.log("🔍 [API KEY DEBUG] Supabase client in checkUserHasFreeIdea:", {
    clientExists: !!supabase,
    clientProvided: !!supabaseClient,
    timestamp: new Date().toISOString(),
  });

  try {
    // Check authentication and JWT token
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    console.log("🔍 [406 DEBUG] Dashboard - checkUserHasFreeIdea auth check:", {
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

    // If auth fails, return false but don't throw
    if (authError || !authUser.user) {
      console.warn(
        "⚠️ [RACE CONDITION FIX] Auth failed in checkUserHasFreeIdea, returning false to preserve UI state",
      );
      return false;
    }

    const { data, error } = await supabase
      .from("generated_ideas")
      .select("id")
      .eq("email", userEmail)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("❌ [406 DEBUG] Dashboard - checkUserHasFreeIdea error:", {
        code: error.code,
        message: error.message,
        hint: error.hint,
        userEmail,
        timestamp: new Date().toISOString(),
      });
      // Return false instead of throwing to prevent UI state clearing
      console.warn(
        "⚠️ [RACE CONDITION FIX] Query failed in checkUserHasFreeIdea, returning false to preserve UI state",
      );
      return false;
    }

    console.log("✅ [DEBUG] Dashboard - checkUserHasFreeIdea result:", {
      hasData: !!data,
      userEmail,
      timestamp: new Date().toISOString(),
    });

    return !!data;
  } catch (error) {
    console.error(
      "❌ [RACE CONDITION FIX] Exception in checkUserHasFreeIdea:",
      error,
    );
    // Return false instead of throwing to prevent UI state clearing
    return false;
  }
}

// Function to get saved ideas with details (from library page)
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
  supabaseClient?: any,
): Promise<(SavedIdea & { generated_idea?: GeneratedIdea })[]> {
  const supabase = supabaseClient || createClient();

  // Debug: Check if the Supabase client was created with proper API key
  console.log(
    "🔍 [API KEY DEBUG] Supabase client in getSavedIdeasWithDetails (Dashboard):",
    {
      clientExists: !!supabase,
      clientProvided: !!supabaseClient,
      timestamp: new Date().toISOString(),
    },
  );

  try {
    // Check authentication and JWT token
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    console.log(
      "🔍 [406 DEBUG] Dashboard - getSavedIdeasWithDetails auth check:",
      {
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
      },
    );

    // If auth fails, return empty array but don't throw
    if (authError || !authUser.user) {
      console.warn(
        "⚠️ [RACE CONDITION FIX] Auth failed in getSavedIdeasWithDetails, returning empty array to preserve UI state",
      );
      return [];
    }

    // Get saved ideas
    const { data: savedIdeas, error: savedError } = await supabase
      .from("saved_ideas")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false });

    if (savedError) {
      console.error("❌ [406 DEBUG] Dashboard - Error loading saved ideas:", {
        code: savedError.code,
        message: savedError.message,
        hint: savedError.hint,
        userEmail,
        timestamp: new Date().toISOString(),
      });
      // Return empty array instead of throwing to prevent UI state clearing
      console.warn(
        "⚠️ [RACE CONDITION FIX] Saved ideas query failed, returning empty array to preserve UI state",
      );
      return [];
    }

    if (!savedIdeas || savedIdeas.length === 0) {
      return [];
    }

    // Get the corresponding generated ideas for detailed information
    const ideaIds = savedIdeas.map((idea: SavedIdea) => idea.idea_id);
    const { data: generatedIdeas, error: generatedError } = await supabase
      .from("generated_ideas")
      .select("*")
      .in("id", ideaIds);

    if (generatedError) {
      console.error(
        "❌ [406 DEBUG] Dashboard - Error loading generated ideas:",
        {
          code: generatedError.code,
          message: generatedError.message,
          hint: generatedError.hint,
          ideaIds,
          userEmail,
          timestamp: new Date().toISOString(),
        },
      );
      // Return saved ideas without generated details instead of throwing
      console.warn(
        "⚠️ [RACE CONDITION FIX] Generated ideas query failed, returning saved ideas without details to preserve UI state",
      );
      return savedIdeas;
    }

    // Merge the data
    const mergedIdeas = savedIdeas.map((savedIdea: any) => {
      const generatedIdea = generatedIdeas?.find(
        (gi: any) => gi.id === savedIdea.idea_id,
      );
      return {
        ...savedIdea,
        generated_idea: generatedIdea,
      };
    });

    return mergedIdeas;
  } catch (error) {
    console.error(
      "❌ [RACE CONDITION FIX] Exception in getSavedIdeasWithDetails:",
      error,
    );
    // Return empty array instead of throwing to prevent UI state clearing
    return [];
  }
}

export default function Dashboard({
  searchParams,
}: {
  searchParams: { session_id?: string; canceled?: string };
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasGeneratedFreeIdea, setHasGeneratedFreeIdea] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Use a single Supabase client instance throughout the component
  const supabase = useMemo(() => {
    const client = createClient();
    console.log("🔍 [API KEY DEBUG] Supabase client created in Dashboard:", {
      clientExists: !!client,
      timestamp: new Date().toISOString(),
    });
    return client;
  }, []);

  // Function to refresh subscription status with error handling to prevent UI clearing
  const refreshSubscriptionStatus = async (userId: string) => {
    // Skip background fetching if idea generation just completed
    if (shouldDisableBackgroundFetching()) {
      console.log(
        "🚫 [BACKGROUND FETCH DISABLED] Skipping subscription status refresh - idea generation in progress or recently completed (5 second block)",
      );
      return isSubscribed;
    }

    try {
      const subscriptionStatus = await checkUserSubscription(userId);
      setIsSubscribed(subscriptionStatus);
      return subscriptionStatus;
    } catch (error) {
      console.error(
        "❌ [RACE CONDITION FIX] Error refreshing subscription status:",
        error,
      );
      console.warn(
        "⚠️ [RACE CONDITION FIX] Subscription status refresh failed, preserving current state",
      );
      // Don't change the subscription state if refresh fails
      return isSubscribed;
    }
  };

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/sign-in");
          return;
        }

        setUser(user);

        // Check for successful payment session
        if (searchParams.session_id) {
          // If there's a session_id, wait a bit for Stripe to process and then refresh subscription
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await refreshSubscriptionStatus(user.id);
        } else {
          // Normal subscription check
          const subscriptionStatus = await checkUserSubscription(user.id);
          setIsSubscribed(subscriptionStatus);
        }

        // Check free idea status with error handling to prevent race condition
        if (!shouldDisableBackgroundFetching()) {
          try {
            const freeIdeaStatus = await checkUserHasFreeIdea(
              user.email || "",
              supabase,
            );
            setHasGeneratedFreeIdea(freeIdeaStatus);
          } catch (error) {
            console.error(
              "❌ [RACE CONDITION FIX] Error checking free idea status:",
              error,
            );
            console.warn(
              "⚠️ [RACE CONDITION FIX] Free idea status check failed, preserving current state",
            );
            // Don't change the free idea state if check fails
          }
        } else {
          console.log(
            "🚫 [BACKGROUND FETCH DISABLED] Skipping free idea status check - idea generation in progress or recently completed (5 second block)",
          );
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    }

    loadUserData();

    // Set up an interval to periodically check subscription status in case of external updates
    const subscriptionCheckInterval = setInterval(async () => {
      if (user?.id) {
        await refreshSubscriptionStatus(user.id);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(subscriptionCheckInterval);
  }, [router, supabase, searchParams.session_id, user?.id]);

  // Listen for focus events to refresh data when user returns to tab
  useEffect(() => {
    const handleFocus = async () => {
      if (user?.id && !shouldDisableBackgroundFetching()) {
        await refreshSubscriptionStatus(user.id);
        // Also refresh free idea status with error handling
        try {
          const freeIdeaStatus = await checkUserHasFreeIdea(
            user.email || "",
            supabase,
          );
          setHasGeneratedFreeIdea(freeIdeaStatus);
        } catch (error) {
          console.error(
            "❌ [RACE CONDITION FIX] Error refreshing free idea status on focus:",
            error,
          );
          console.warn(
            "⚠️ [RACE CONDITION FIX] Free idea status refresh failed on focus, preserving current state",
          );
          // Don't change the free idea state if refresh fails
        }
      } else if (shouldDisableBackgroundFetching()) {
        console.log(
          "🚫 [BACKGROUND FETCH DISABLED] Skipping focus refresh - idea generation in progress or recently completed (5 second block)",
        );
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user?.id, user?.email, supabase]);

  const showSuccessToast = !!searchParams.session_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEFDFB] flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center">
          <div
            className="w-6 h-6 bg-[#D4714B] rounded-full"
            style={{
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
        <style jsx>{`
          @keyframes pulse {
            0% {
              transform: scale(0.8);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.2);
              opacity: 1;
            }
            100% {
              transform: scale(0.8);
              opacity: 0.6;
            }
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#FEFDFB" }}
    >
      <DashboardNavbar user={user} isSubscribed={isSubscribed} />
      {showSuccessToast && <SuccessToast />}

      {/* Main Content - Flex grow to push footer down */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <header className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              {/* Desktop Layout */}
              <h1
                className="hidden md:block font-bold flex items-center gap-3"
                style={{ fontSize: "30px" }}
              >
                Welcome,{" "}
                {user.user_metadata?.full_name ||
                  user.email?.split("@")[0] ||
                  "User"}
                ! •{" "}
                {isSubscribed ? (
                  <span className="text-orange-600">Premium</span>
                ) : (
                  <span className="text-gray-600">Free Tier</span>
                )}
              </h1>

              {/* Mobile Layout */}
              <div className="md:hidden">
                <div className="flex flex-wrap items-baseline gap-1">
                  <span
                    className="text-lg font-bold text-gray-900"
                    style={{ fontFamily: "Crimson Pro", fontSize: "24px" }}
                  >
                    Welcome,
                  </span>
                  <span
                    className="text-lg font-bold text-gray-900"
                    style={{ fontFamily: "Crimson Pro", fontSize: "24px" }}
                  >
                    {user.user_metadata?.full_name ||
                      user.email?.split("@")[0] ||
                      "User"}
                    !
                  </span>
                  <span
                    className="text-lg font-bold text-gray-600 whitespace-nowrap"
                    style={{ fontFamily: "Crimson Pro", fontSize: "24px" }}
                  >
                    • {isSubscribed ? "Premium" : "Free Tier"}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {isSubscribed ? (
            /* Premium User Dashboard */
            <div className="grid gap-4">
              {/* Idea Generator Component */}
              <IdeaGenerator
                userEmail={user.email || ""}
                onIdeaGenerated={() => {
                  // Trigger a refresh of the library data
                  window.dispatchEvent(new CustomEvent("ideaGenerated"));
                }}
              />
            </div>
          ) : (
            /* Free Tier Dashboard */
            <div className="grid gap-4">
              {/* Usage Stats and Free Idea Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Usage Stats */}
                <Card className="bg-white border-gray-200 h-48">
                  <CardHeader>
                    <CardTitle>Your Usage</CardTitle>
                    <CardDescription>
                      Track your idea generation usage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: "#FEFDFB" }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Free Ideas
                        </span>
                        <span className="text-sm text-gray-500">
                          {hasGeneratedFreeIdea ? "1" : "0"} / 1
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Free Idea - Takes remaining space */}
                <div className="lg:col-span-2">
                  <FreeIdeaDisplay
                    userEmail={user.email || ""}
                    hasGeneratedIdea={hasGeneratedFreeIdea}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
