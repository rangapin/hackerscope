"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";
import { shouldDisableBackgroundFetching } from "@/components/IdeaGenerator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

// Terracotta pulsing dot loading animation
function LoadingAnimation() {
  return (
    <div className="flex justify-center items-center py-12">
      <div
        className="w-4 h-4 bg-[#D4714B] rounded-full"
        style={{
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_liked: boolean;
  idea_id: string;
  generated_idea?: {
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
  };
}

interface LibraryClientProps {
  savedIdeas: SavedIdea[];
}

export function LibraryClient({
  savedIdeas: initialSavedIdeas,
}: LibraryClientProps) {
  console.log("🎨 [DEBUG] LibraryClient - Component initialized with:", {
    initialIdeasCount: initialSavedIdeas.length,
    initialIdeas: initialSavedIdeas.map((idea) => ({
      id: idea.id,
      title: idea.title,
      created_at: idea.created_at,
    })),
    timestamp: new Date().toISOString(),
  });

  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(initialSavedIdeas);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Use a single Supabase client instance throughout the component
  const supabase = useMemo(() => {
    const client = createClient();
    console.log(
      "🔍 [API KEY DEBUG] Supabase client created in LibraryClient:",
      {
        clientExists: !!client,
        timestamp: new Date().toISOString(),
      },
    );
    return client;
  }, []);

  const handleViewDetails = (idea: SavedIdea) => {
    setSelectedIdea(idea);
    setShowDetailsModal(true);
  };

  // Function to refresh saved ideas from the database
  const refreshSavedIdeas = async () => {
    // Skip background fetching if idea generation just completed
    if (shouldDisableBackgroundFetching()) {
      console.log(
        "🚫 [BACKGROUND FETCH DISABLED] LibraryClient - Skipping refresh - idea generation in progress or recently completed (5 second block)",
      );
      return;
    }

    try {
      console.log(
        "🔄 [CACHE DEBUG] LibraryClient - refreshSavedIdeas called:",
        {
          timestamp: new Date().toISOString(),
          cacheInvalidation: "manual-refresh",
        },
      );

      setIsRefreshing(true);
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) {
        console.error(
          "❌ [USER_ID DEBUG] LibraryClient - Auth error in refresh:",
          authError,
        );
        return;
      }

      if (!authData || !authData.user) {
        console.error(
          "❌ [USER_ID DEBUG] LibraryClient - No user data in refresh:",
          authData,
        );
        return;
      }

      const user = authData.user;
      if (!user.email) {
        console.error(
          "❌ [USER_ID DEBUG] LibraryClient - No user email found in refresh:",
          user,
        );
        return;
      }

      if (!user.id) {
        console.error(
          "❌ [USER_ID DEBUG] LibraryClient - No user ID found in refresh:",
          user,
        );
        return;
      }

      // Additional validation before using user properties
      if (typeof user.id !== "string" || user.id.trim() === "") {
        console.error(
          "❌ [USER_ID DEBUG] LibraryClient - Invalid user ID format:",
          { userId: user.id, type: typeof user.id },
        );
        return;
      }

      if (typeof user.email !== "string" || user.email.trim() === "") {
        console.error(
          "❌ [USER_ID DEBUG] LibraryClient - Invalid user email format:",
          { userEmail: user.email, type: typeof user.email },
        );
        return;
      }

      console.log("🔍 [USER_ID DEBUG] LibraryClient refreshSavedIdeas using:", {
        userId: user.id,
        userEmail: user.email,
      });

      console.log("👤 [DEBUG] LibraryClient - Refreshing for user:", {
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      // Get saved ideas with cache-busting
      const cacheBreaker = Date.now();
      console.log(
        "🔍 [CACHE DEBUG] LibraryClient - Fetching saved_ideas with cache breaker:",
        {
          userEmail: user.email,
          cacheBreaker,
          timestamp: new Date().toISOString(),
        },
      );

      console.log(
        "🔍 [API KEY DEBUG] LibraryClient - About to query saved_ideas:",
        {
          userEmail: user.email,
          supabaseClientExists: !!supabase,
          timestamp: new Date().toISOString(),
        },
      );

      // CRITICAL DEBUG: Compare client configurations
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      console.log(
        "🔍 [CLIENT CONFIG DEBUG] LibraryClient - Fetching operation client config:",
        {
          clientType: "browser-side",
          context: "client component",
          authMethod: "browser-side auth.getUser()",
          hasAccessToken: sessionData?.session?.access_token
            ? "[PRESENT]"
            : "[MISSING]",
          tokenType: sessionData?.session?.token_type,
          sessionError: sessionError,
          userFromAuth: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          timestamp: new Date().toISOString(),
        },
      );

      const { data: savedIdeasData, error: savedError } = await supabase
        .from("saved_ideas")
        .select("*")
        .eq("user_email", user.email)
        .order("created_at", { ascending: false })
        .limit(1000); // Add explicit limit to prevent caching issues

      if (savedError) {
        console.error(
          "❌ [406 DEBUG] LibraryClient - Error loading saved ideas:",
          {
            code: savedError.code,
            message: savedError.message,
            details: savedError.details,
            hint: savedError.hint,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
          },
        );

        // Don't clear existing saved ideas if refresh fails - preserve UI state
        console.warn(
          "⚠️ [RACE CONDITION FIX] Saved ideas query failed, preserving existing UI state",
        );
        return;
      }

      console.log(
        "📊 [DEBUG] LibraryClient - Fetched saved ideas in refresh:",
        {
          count: savedIdeasData?.length || 0,
          ideas:
            savedIdeasData?.map((idea) => ({
              id: idea.id,
              title: idea.title,
              created_at: idea.created_at,
            })) || [],
          timestamp: new Date().toISOString(),
        },
      );

      if (!savedIdeasData || savedIdeasData.length === 0) {
        console.log(
          "📭 [DEBUG] LibraryClient - No saved ideas found, setting empty array",
        );
        setSavedIdeas([]);
        return;
      }

      // Get the corresponding generated ideas for detailed information
      const ideaIds = savedIdeasData.map((idea) => idea.idea_id);
      console.log(
        "🔄 [DEBUG] LibraryClient - Fetching generated ideas for IDs:",
        ideaIds,
      );

      console.log(
        "🔍 [API KEY DEBUG] LibraryClient - About to query generated_ideas:",
        {
          ideaIds,
          ideaIdsCount: ideaIds.length,
          userEmail: user.email,
          supabaseClientExists: !!supabase,
          timestamp: new Date().toISOString(),
        },
      );

      const { data: generatedIdeas, error: generatedError } = await supabase
        .from("generated_ideas")
        .select("*")
        .in("id", ideaIds)
        .limit(1000); // Add explicit limit to prevent caching issues

      if (generatedError) {
        console.error(
          "❌ [406 DEBUG] LibraryClient - Error loading generated ideas:",
          {
            code: generatedError.code,
            message: generatedError.message,
            details: generatedError.details,
            hint: generatedError.hint,
            ideaIds,
            userEmail: user.email,
            timestamp: new Date().toISOString(),
          },
        );

        // Set saved ideas without generated details instead of failing completely
        console.warn(
          "⚠️ [RACE CONDITION FIX] Generated ideas query failed, showing saved ideas without full details",
        );
        setSavedIdeas(savedIdeasData);
        return;
      }

      console.log(
        "📊 [DEBUG] LibraryClient - Fetched generated ideas in refresh:",
        {
          count: generatedIdeas?.length || 0,
          ideas:
            generatedIdeas?.map((idea) => ({
              id: idea.id,
              title: idea.title,
            })) || [],
          timestamp: new Date().toISOString(),
        },
      );

      // Merge the data
      const mergedIdeas = savedIdeasData.map((savedIdea) => {
        const generatedIdea = generatedIdeas?.find(
          (gi) => gi.id === savedIdea.idea_id,
        );
        return {
          ...savedIdea,
          generated_idea: generatedIdea,
        };
      });

      console.log("✅ [DEBUG] LibraryClient - Setting merged ideas:", {
        mergedCount: mergedIdeas.length,
        timestamp: new Date().toISOString(),
      });

      setSavedIdeas(mergedIdeas);
    } catch (error) {
      console.error(
        "❌ [RACE CONDITION FIX] LibraryClient - Error refreshing saved ideas:",
        error,
      );
      console.warn(
        "⚠️ [RACE CONDITION FIX] Refresh failed, preserving existing saved ideas state",
      );
      // Don't clear existing saved ideas on error - preserve UI state
    } finally {
      setIsRefreshing(false);
      console.log("🏁 [DEBUG] LibraryClient - refreshSavedIdeas completed:", {
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Set up real-time subscriptions for saved_ideas and generated_ideas tables
  useEffect(() => {
    console.log(
      "🔗 [CACHE DEBUG] LibraryClient - Setting up real-time subscriptions:",
      {
        timestamp: new Date().toISOString(),
        subscriptionType: "supabase-realtime",
        tables: ["saved_ideas", "generated_ideas"],
      },
    );

    const channel = supabase
      .channel("library-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "saved_ideas",
        },
        (payload) => {
          console.log(
            "🔔 [CACHE DEBUG] LibraryClient - Saved ideas table changed:",
            {
              event: payload.eventType,
              table: payload.table,
              new: payload.new,
              old: payload.old,
              timestamp: new Date().toISOString(),
              triggerSource: "realtime-subscription",
            },
          );
          // Add small delay to ensure database consistency
          setTimeout(() => {
            if (!shouldDisableBackgroundFetching()) {
              console.log(
                "⏰ [CACHE DEBUG] Triggering refresh after realtime event delay",
              );
              refreshSavedIdeas();
            } else {
              console.log(
                "🚫 [BACKGROUND FETCH DISABLED] Skipping realtime refresh - idea generation in progress or recently completed (5 second block)",
              );
            }
          }, 100);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "generated_ideas",
        },
        (payload) => {
          console.log(
            "🔔 [CACHE DEBUG] LibraryClient - Generated ideas table changed:",
            {
              event: payload.eventType,
              table: payload.table,
              new: payload.new,
              old: payload.old,
              timestamp: new Date().toISOString(),
              triggerSource: "realtime-subscription",
            },
          );
          // Add small delay to ensure database consistency
          setTimeout(() => {
            if (!shouldDisableBackgroundFetching()) {
              console.log(
                "⏰ [CACHE DEBUG] Triggering refresh after realtime event delay",
              );
              refreshSavedIdeas();
            } else {
              console.log(
                "🚫 [BACKGROUND FETCH DISABLED] Skipping realtime refresh - idea generation in progress or recently completed (5 second block)",
              );
            }
          }, 100);
        },
      )
      .subscribe();

    console.log(
      "✅ [DEBUG] LibraryClient - Real-time subscriptions established",
    );

    return () => {
      console.log(
        "🔌 [DEBUG] LibraryClient - Cleaning up real-time subscriptions",
      );
      supabase.removeChannel(channel);
    };
  }, []);

  // Check URL params for refresh trigger and refresh data on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refreshParam = urlParams.get("refresh");

    if (refreshParam) {
      console.log(
        "🔄 [CACHE DEBUG] LibraryClient - Refresh parameter detected, forcing refresh:",
        {
          refreshParam,
          timestamp: new Date().toISOString(),
          triggerSource: "url-refresh-parameter",
        },
      );
      // Force refresh when coming from idea generation
      setTimeout(() => {
        refreshSavedIdeas();
      }, 500);

      // Clean up URL without causing navigation
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Listen for focus events to refresh data when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      if (!shouldDisableBackgroundFetching()) {
        console.log(
          "🎯 [CACHE DEBUG] LibraryClient - Window focused, refreshing saved ideas:",
          {
            timestamp: new Date().toISOString(),
            triggerSource: "window-focus-event",
          },
        );
        refreshSavedIdeas();
      } else {
        console.log(
          "🚫 [BACKGROUND FETCH DISABLED] LibraryClient - Skipping focus refresh - idea generation in progress or recently completed (5 second block)",
        );
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !shouldDisableBackgroundFetching()) {
        console.log(
          "👁️ [CACHE DEBUG] LibraryClient - Page became visible, refreshing:",
          {
            timestamp: new Date().toISOString(),
            triggerSource: "visibility-change-event",
          },
        );
        refreshSavedIdeas();
      } else if (!document.hidden && shouldDisableBackgroundFetching()) {
        console.log(
          "🚫 [BACKGROUND FETCH DISABLED] LibraryClient - Skipping visibility refresh - idea generation in progress or recently completed (5 second block)",
        );
      }
    };

    const handleIdeaGenerated = () => {
      console.log(
        "🎉 [CACHE DEBUG] LibraryClient - Idea generated event received, refreshing:",
        {
          timestamp: new Date().toISOString(),
          triggerSource: "idea-generated-event",
        },
      );
      // Add a small delay to ensure the database has been updated
      setTimeout(() => {
        refreshSavedIdeas();
      }, 1000);
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("ideaGenerated", handleIdeaGenerated);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("ideaGenerated", handleIdeaGenerated);
    };
  }, []);

  if (savedIdeas.length === 0) {
    return (
      <div className="space-y-8">
        <Card className="bg-white border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No saved ideas yet
              </h3>
              <p className="text-gray-600 mb-4">
                Your saved startup ideas will appear here.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                If you just generated an idea and it's not showing up, try{" "}
                <button
                  onClick={refreshSavedIdeas}
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  refreshing
                </button>{" "}
                or{" "}
                <button
                  onClick={() => window.location.reload()}
                  className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  reload the page
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button
            onClick={refreshSavedIdeas}
            disabled={isRefreshing}
            variant="outline"
            size="lg"
            className="w-32"
          >
            {isRefreshing ? <LoadingAnimation /> : "Refresh"}
          </Button>
          <Button
            onClick={() => router.push("/dashboard")}
            size="lg"
            className="w-64 bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
          >
            Generate more ideas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {savedIdeas.map((idea) => (
          <Card
            key={idea.id}
            className="bg-white border-gray-200 hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <CardHeader className="flex-shrink-0">
              <CardTitle className="text-lg font-medium text-gray-900 line-clamp-2 text-center">
                {idea.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow">
              <div className="flex flex-col h-full">
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                  {idea.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>
                    Saved on{" "}
                    {new Date(idea.created_at).toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                  {idea.is_liked && <span className="text-red-500">♥</span>}
                </div>
                <div className="mt-auto">
                  <Button
                    onClick={() => handleViewDetails(idea)}
                    variant="outline"
                    className="w-full"
                  >
                    View details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={refreshSavedIdeas}
          disabled={isRefreshing}
          variant="outline"
          size="lg"
          className="w-32"
        >
          {isRefreshing ? <LoadingAnimation /> : "Refresh"}
        </Button>
        <Button
          onClick={() => router.push("/dashboard")}
          size="lg"
          className="w-64 bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
        >
          Generate more ideas
        </Button>
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2 text-center">
              {selectedIdea?.title}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-center">
              Detailed market analysis and validation data
            </DialogDescription>
          </DialogHeader>

          {selectedIdea && (
            <div className="space-y-8">
              {/* Solution Section */}
              <div className="bg-cream rounded-lg p-8 border border-gray-200">
                <h3 className="text-lg font-medium text-black mb-6 border-l-4 border-[#D4714B] pl-4">
                  Solution
                </h3>
                <p className="text-[#666] leading-loose">
                  {selectedIdea.description}
                </p>
              </div>

              {selectedIdea.generated_idea && (
                <>
                  {/* Market Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-cream rounded-lg p-8 border border-gray-200">
                      <h4 className="text-lg font-medium text-black mb-6 border-l-4 border-[#D4714B] pl-4">
                        Market Size
                      </h4>
                      <p className="text-[#666] leading-loose">
                        {selectedIdea.generated_idea.market_size ||
                          "Market size analysis not available"}
                      </p>
                    </div>

                    <div className="bg-cream rounded-lg p-8 border border-gray-200">
                      <h4 className="text-lg font-medium text-black mb-6 border-l-4 border-[#D4714B] pl-4">
                        Target Audience
                      </h4>
                      <p className="text-[#666] leading-loose">
                        {selectedIdea.generated_idea.target_audience ||
                          "Target audience analysis not available"}
                      </p>
                    </div>
                  </div>

                  {/* Revenue Streams */}
                  {selectedIdea.generated_idea.revenue_streams &&
                    selectedIdea.generated_idea.revenue_streams.length > 0 && (
                      <div className="bg-cream rounded-lg p-8 border border-gray-200">
                        <h4 className="text-lg font-medium text-black mb-6 border-l-4 border-[#D4714B] pl-4">
                          Revenue Streams
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {selectedIdea.generated_idea.revenue_streams
                            .slice(0, 6)
                            .map((stream, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-4 bg-white rounded-md border border-gray-200"
                              >
                                <span className="text-[#666] leading-relaxed">
                                  {stream}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Validation Data */}
                  {selectedIdea.generated_idea.validation_data && (
                    <div className="bg-cream rounded-lg p-8 border border-gray-200">
                      <h3 className="text-lg font-medium text-black mb-8 border-l-4 border-[#D4714B] pl-4">
                        Market Validation
                      </h3>

                      <div className="space-y-8">
                        {/* Market Trends */}
                        {selectedIdea.generated_idea.validation_data
                          .market_trends &&
                          selectedIdea.generated_idea.validation_data
                            .market_trends.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-black text-base">
                                Key Market Trends
                              </h4>
                              <div className="space-y-3">
                                {selectedIdea.generated_idea.validation_data.market_trends
                                  .slice(0, 5)
                                  .map((trend: string, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-start gap-3 text-[#666] leading-loose"
                                    >
                                      <div className="w-2 h-2 bg-terracotta-500 rounded-full mt-2 flex-shrink-0" />
                                      <span>{trend}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                        {/* Competitor Analysis */}
                        {selectedIdea.generated_idea.validation_data
                          .competitor_analysis && (
                          <div className="space-y-4">
                            <h4 className="font-semibold text-black text-base">
                              Competitor Analysis
                            </h4>
                            <p className="text-[#666] leading-loose">
                              {
                                selectedIdea.generated_idea.validation_data
                                  .competitor_analysis
                              }
                            </p>
                          </div>
                        )}

                        {/* Demand Indicators */}
                        {selectedIdea.generated_idea.validation_data
                          .demand_indicators &&
                          selectedIdea.generated_idea.validation_data
                            .demand_indicators.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-black text-base">
                                Demand Indicators
                              </h4>
                              <div className="space-y-3">
                                {selectedIdea.generated_idea.validation_data.demand_indicators
                                  .slice(0, 5)
                                  .map((indicator: string, index: number) => (
                                    <div
                                      key={index}
                                      className="flex items-start gap-3 text-[#666] leading-loose"
                                    >
                                      <div className="w-2 h-2 bg-terracotta-500 rounded-full mt-2 flex-shrink-0" />
                                      <span>{indicator}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Generation Details */}
                  <div className="pt-8 border-t border-gray-200 bg-[#FAFAFA] rounded-lg p-8">
                    <div className="flex flex-col md:flex-row md:justify-center md:items-center gap-8 text-sm">
                      {selectedIdea.generated_idea.industry && (
                        <div className="text-center space-y-2">
                          <span className="font-medium text-black block">
                            Industry:
                          </span>
                          <div className="text-[#666] leading-relaxed">
                            {selectedIdea.generated_idea.industry}
                          </div>
                        </div>
                      )}
                      {selectedIdea.generated_idea.preferences && (
                        <div className="text-center space-y-2">
                          <span className="font-medium text-black block">
                            Preferences:
                          </span>
                          <div className="text-[#666] leading-relaxed">
                            {selectedIdea.generated_idea.preferences}
                          </div>
                        </div>
                      )}
                      <div className="text-center space-y-2">
                        <span className="font-medium text-black block">
                          Generated:
                        </span>
                        <div className="text-[#666] leading-relaxed">
                          {new Date(
                            selectedIdea.generated_idea.created_at,
                          ).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Centered Close Button at Bottom */}
          <div className="flex justify-center pt-8 mt-8 border-t border-gray-200">
            <Button
              onClick={() => setShowDetailsModal(false)}
              className="text-white bg-black rounded-lg px-6 py-2 font-medium hover:opacity-80 transition-opacity duration-200"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
