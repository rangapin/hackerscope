"use client";

import { useEffect, useState } from "react";
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
import type { User } from "@supabase/supabase-js";

// Function to check if user has generated their free idea
async function checkUserHasFreeIdea(userEmail: string) {
  const supabase = createClient();

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
    return false;
  }

  console.log("✅ [DEBUG] Dashboard - checkUserHasFreeIdea result:", {
    hasData: !!data,
    userEmail,
    timestamp: new Date().toISOString(),
  });

  return !!data;
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
): Promise<(SavedIdea & { generated_idea?: GeneratedIdea })[]> {
  const supabase = createClient();

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
    return [];
  }

  if (!savedIdeas || savedIdeas.length === 0) {
    return [];
  }

  // Get the corresponding generated ideas for detailed information
  const ideaIds = savedIdeas.map((idea) => idea.idea_id);
  const { data: generatedIdeas, error: generatedError } = await supabase
    .from("generated_ideas")
    .select("*")
    .in("id", ideaIds);

  if (generatedError) {
    console.error("❌ [406 DEBUG] Dashboard - Error loading generated ideas:", {
      code: generatedError.code,
      message: generatedError.message,
      hint: generatedError.hint,
      ideaIds,
      userEmail,
      timestamp: new Date().toISOString(),
    });
    return savedIdeas;
  }

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

  return mergedIdeas;
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
  const supabase = createClient();

  // Function to refresh subscription status
  const refreshSubscriptionStatus = async (userId: string) => {
    try {
      const subscriptionStatus = await checkUserSubscription(userId);
      setIsSubscribed(subscriptionStatus);
      return subscriptionStatus;
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
      return false;
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

        const freeIdeaStatus = await checkUserHasFreeIdea(user.email || "");
        setHasGeneratedFreeIdea(freeIdeaStatus);
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
      if (user?.id) {
        await refreshSubscriptionStatus(user.id);
        // Also refresh free idea status
        const freeIdeaStatus = await checkUserHasFreeIdea(user.email || "");
        setHasGeneratedFreeIdea(freeIdeaStatus);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user?.id, user?.email]);

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
              <IdeaGenerator userEmail={user.email || ""} />
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
