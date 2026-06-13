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

  // Validate input parameters
  if (!userEmail) {
    console.error(
      "❌ [USER_ID DEBUG] checkUserHasFreeIdea called with undefined userEmail",
    );
    return false;
  }

  try {
    // Check authentication and JWT token
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.warn(
        "⚠️ [RACE CONDITION FIX] Auth error in checkUserHasFreeIdea, returning false to preserve UI state:",
        authError,
      );
      return false;
    }

    if (!authData || !authData.user) {
      console.warn(
        "⚠️ [RACE CONDITION FIX] No user data in checkUserHasFreeIdea, returning false to preserve UI state:",
        authData,
      );
      return false;
    }

    const authUser = authData.user;
    if (!authUser.id) {
      console.warn(
        "⚠️ [RACE CONDITION FIX] User ID missing in checkUserHasFreeIdea, returning false to preserve UI state:",
        authUser,
      );
      return false;
    }

    // Additional validation for user ID format
    if (typeof authUser.id !== "string" || authUser.id.trim() === "") {
      console.error(
        "❌ [USER_ID DEBUG] checkUserHasFreeIdea - Invalid user ID format:",
        { userId: authUser.id, type: typeof authUser.id },
      );
      return false;
    }

    console.log("🔍 [406 DEBUG] Dashboard - checkUserHasFreeIdea auth check:", {
      hasUser: !!authUser,
      userId: authUser.id,
      userEmail: authUser.email,
      requestEmail: userEmail,
      timestamp: new Date().toISOString(),
    });

    // Verify email matches authenticated user
    if (authUser.email !== userEmail) {
      console.error(
        "❌ [USER_ID DEBUG] Email mismatch in checkUserHasFreeIdea:",
        {
          authEmail: authUser.email,
          requestEmail: userEmail,
        },
      );
      return false;
    }

    console.log(
      "🔍 [USER_ID DEBUG] checkUserHasFreeIdea using email:",
      userEmail,
    );

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

// Function to get the user's free generated idea (server-side)
async function getUserFreeIdea(userEmail: string): Promise<any | null> {
  console.log("🔄 [SERVER-SIDE] Dashboard - Starting getUserFreeIdea:", {
    userEmail,
    timestamp: new Date().toISOString(),
  });

  const supabase = createClient();

  // Debug: Check if the Supabase client was created with proper API key
  console.log("🔍 [API KEY DEBUG] Supabase client in getUserFreeIdea:", {
    clientExists: !!supabase,
    timestamp: new Date().toISOString(),
  });

  // Check authentication and JWT token
  const { data: authUser, error: authError } = await supabase.auth.getUser();
  console.log("🔍 [406 DEBUG] Dashboard - getUserFreeIdea auth check:", {
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

  if (authError || !authUser.user) {
    console.error("❌ [SERVER-SIDE] Auth error in getUserFreeIdea:", authError);
    return null;
  }

  // Verify email matches authenticated user
  if (authUser.user.email !== userEmail) {
    console.error("❌ [SERVER-SIDE] Email mismatch in getUserFreeIdea:", {
      authEmail: authUser.user.email,
      requestEmail: userEmail,
    });
    return null;
  }

  try {
    console.log("🔍 [SERVER-SIDE] Querying database for user:", userEmail);

    const { data, error } = await supabase
      .from("generated_ideas")
      .select("*")
      .eq("email", userEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    console.log("🔍 [SERVER-SIDE] Database query result:", {
      hasData: !!data,
      error: error ? { code: error.code, message: error.message } : null,
      dataId: data?.id,
      dataTitle: data?.title,
    });

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned", which is expected for new users
      console.error("❌ [SERVER-SIDE] Error in getUserFreeIdea:", {
        code: error.code,
        message: error.message,
        userEmail,
        timestamp: new Date().toISOString(),
      });
      return null;
    }

    if (error && error.code === "PGRST116") {
      console.log(
        "ℹ️ [SERVER-SIDE] No generated ideas found for user (PGRST116)",
      );
      return null;
    }

    if (data) {
      console.log("✅ [SERVER-SIDE] Found generated idea:", {
        id: data.id,
        title: data.title,
        description: data.description?.substring(0, 100) + "...",
      });
      return data;
    }

    return null;
  } catch (err) {
    console.error("❌ [SERVER-SIDE] Exception in getUserFreeIdea:", err);
    return null;
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
  const [freeIdea, setFreeIdea] = useState<any | null>(null);
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

  // TEMPORARILY DISABLED: Function to refresh subscription status
  const refreshSubscriptionStatus = async (userId: string) => {
    console.log(
      "🚫 [SUBSCRIPTION DISABLED] refreshSubscriptionStatus temporarily disabled - returning false",
      {
        userId,
        timestamp: new Date().toISOString(),
      },
    );

    // Always return false to bypass subscription checks
    return false;

    /* COMMENTED OUT - ORIGINAL SUBSCRIPTION REFRESH CODE
    // Validate userId parameter with comprehensive checks
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      console.error(
        "❌ [USER_ID DEBUG] refreshSubscriptionStatus called with invalid userId:",
        { userId, type: typeof userId, stringified: String(userId) },
      );
      return isSubscribed;
    }

    // Skip background fetching if idea generation just completed
    if (shouldDisableBackgroundFetching()) {
      console.log(
        "🚫 [BACKGROUND FETCH DISABLED] Skipping subscription status refresh - idea generation in progress or recently completed (5 second block)",
      );
      return isSubscribed;
    }

    try {
      console.log(
        "🔍 [USER_ID DEBUG] refreshSubscriptionStatus calling checkUserSubscription with:",
        { userId, type: typeof userId },
      );
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
    */
  };

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error in loadUserData:", authError);
          router.push("/sign-in");
          return;
        }

        if (!authData || !authData.user) {
          console.error("No user data in loadUserData:", authData);
          router.push("/sign-in");
          return;
        }

        const user = authData.user;
        if (!user.id) {
          console.error("User ID missing in loadUserData:", user);
          router.push("/sign-in");
          return;
        }

        // Additional validation for user ID format
        if (typeof user.id !== "string" || user.id.trim() === "") {
          console.error(
            "❌ [USER_ID DEBUG] loadUserData - Invalid user ID format:",
            { userId: user.id, type: typeof user.id },
          );
          router.push("/sign-in");
          return;
        }

        setUser(user);

        // TEMPORARILY DISABLED: Check for successful payment session
        if (searchParams.session_id) {
          console.log(
            "🚫 [SUBSCRIPTION DISABLED] Skipping payment session subscription refresh",
          );
          // Skip subscription refresh for now

          /* COMMENTED OUT - ORIGINAL PAYMENT SESSION HANDLING
          // If there's a session_id, wait a bit for Stripe to process and then refresh subscription
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (user.id && typeof user.id === "string" && user.id.trim() !== "") {
            await refreshSubscriptionStatus(user.id);
          } else {
            console.error(
              "❌ [USER_ID DEBUG] Invalid user.id for subscription refresh after payment:",
              { userId: user.id, type: typeof user.id },
            );
          }
          */
        } else {
          // TEMPORARILY DISABLED: Check subscription status
          console.log(
            "🚫 [SUBSCRIPTION DISABLED] Skipping subscription status check in fetchUserData",
          );
          setIsSubscribed(false); // Always set to false for now

          /* COMMENTED OUT - ORIGINAL SUBSCRIPTION CHECK
          if (user.id && typeof user.id === "string" && user.id.trim() !== "") {
            const subscriptionStatus = await checkUserSubscription(user.id);
            setIsSubscribed(subscriptionStatus);
          } else {
            console.error(
              "❌ [USER_ID DEBUG] Invalid user.id for normal subscription check:",
              { userId: user.id, type: typeof user.id },
            );
            setIsSubscribed(false);
          }
          */
        }

        // Fetch free idea data server-side to avoid client-side 406 errors
        if (!shouldDisableBackgroundFetching()) {
          try {
            const freeIdeaData = await getUserFreeIdea(user.email || "");
            setFreeIdea(freeIdeaData);
            setHasGeneratedFreeIdea(!!freeIdeaData);
          } catch (error) {
            console.error(
              "❌ [SERVER-SIDE] Error fetching free idea data:",
              error,
            );
            console.warn(
              "⚠️ [SERVER-SIDE] Free idea data fetch failed, preserving current state",
            );
            // Don't change the free idea state if fetch fails
          }
        } else {
          console.log(
            "🚫 [BACKGROUND FETCH DISABLED] Skipping free idea data fetch - idea generation in progress or recently completed (5 second block)",
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
      if (user?.id && typeof user.id === "string" && user.id.trim() !== "") {
        console.log(
          "🔄 [SUBSCRIPTION INTERVAL] Checking subscription status for user:",
          { userId: user.id },
        );
        await refreshSubscriptionStatus(user.id);
      } else if (user?.id) {
        console.error(
          "❌ [USER_ID DEBUG] Invalid user ID in subscription check interval:",
          {
            userId: user.id,
            type: typeof user.id,
            stringified: String(user.id),
          },
        );
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(subscriptionCheckInterval);
  }, [router, supabase, searchParams.session_id, user?.id]);

  // Listen for focus events to refresh data when user returns to tab
  useEffect(() => {
    const handleFocus = async () => {
      if (
        user?.id &&
        typeof user.id === "string" &&
        user.id.trim() !== "" &&
        !shouldDisableBackgroundFetching()
      ) {
        await refreshSubscriptionStatus(user.id);
        // Also refresh free idea data with error handling
        try {
          const freeIdeaData = await getUserFreeIdea(user.email || "");
          setFreeIdea(freeIdeaData);
          setHasGeneratedFreeIdea(!!freeIdeaData);
        } catch (error) {
          console.error(
            "❌ [SERVER-SIDE] Error refreshing free idea data on focus:",
            error,
          );
          console.warn(
            "⚠️ [SERVER-SIDE] Free idea data refresh failed on focus, preserving current state",
          );
          // Don't change the free idea state if refresh fails
        }
      } else if (
        user?.id &&
        (typeof user.id !== "string" || user.id.trim() === "")
      ) {
        console.error("❌ [USER_ID DEBUG] Invalid user ID in focus handler:", {
          userId: user.id,
          type: typeof user.id,
        });
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
                    freeIdea={freeIdea}
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
