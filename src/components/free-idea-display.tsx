"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  shouldDisableBackgroundFetching,
  setIdeaGenerationState,
} from "@/components/IdeaGenerator";
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
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "../../supabase/client";

// Full-screen loading overlay component
function FullScreenLoadingOverlay({ isVisible }: { isVisible: boolean }) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [fadeClass, setFadeClass] = useState("opacity-100");

  const loadingPhrases = [
    "Scanning market signals across the web...",
    "Reasoning through market dynamics...",
    "Excavating hidden market opportunities...",
    "Analyzing thousands of data points...",
    "Weighing opportunity factors...",
    "Connecting entrepreneurial patterns...",
    "Extracting market insights...",
    "Processing validation signals...",
    "Researching markets, reasoning through opportunities...",
    "Mapping competitive landscapes...",
    "Synthesizing research findings...",
    "Formulating your concept...",
  ];

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setFadeClass("opacity-0");

      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
        setFadeClass("opacity-100");
      }, 300);
    }, 2500);

    return () => clearInterval(interval);
  }, [isVisible, loadingPhrases.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Light backdrop with subtle blur */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm" />

      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
        {/* Pulsing terracotta dot */}
        <div className="mb-8">
          <div
            className="w-4 h-4 bg-[#D4714B] rounded-full"
            style={{
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>

        {/* Loading phrase */}
        <div className="h-14 flex items-center justify-center">
          <p
            className={`text-gray-700 text-base font-normal max-w-md transition-opacity duration-300 ${fadeClass}`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {loadingPhrases[currentPhraseIndex]}
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(212, 113, 75, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(212, 113, 75, 0);
          }
        }
      `}</style>
    </div>
  );
}

interface GeneratedIdea {
  id: string;
  title: string;
  problem: string;
  solution: string;
  market_size: string;
  target_audience: string;
  revenue_streams: string[];
  validation_data: {
    market_trends: string[];
    competitor_analysis: string;
    demand_indicators: string[];
  };
}

interface FreeIdeaDisplayProps {
  userEmail: string;
  hasGeneratedIdea?: boolean;
}

export function FreeIdeaDisplay({
  userEmail,
  hasGeneratedIdea = false,
}: FreeIdeaDisplayProps) {
  const router = useRouter();
  const [freeIdea, setFreeIdea] = useState<GeneratedIdea | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullScreenLoading, setShowFullScreenLoading] = useState(false);
  const [supabase] = useState(() => createClient());

  // Check if user already has a free idea stored with race condition protection
  const checkExistingFreeIdea = async () => {
    // Skip background fetching if idea generation just completed
    if (shouldDisableBackgroundFetching()) {
      console.log(
        "🚫 [BACKGROUND FETCH DISABLED] FreeIdeaDisplay - Skipping checkExistingFreeIdea - idea generation in progress or recently completed",
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from("generated_ideas")
        .select("*")
        .eq("email", userEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "no rows returned", which is expected for new users
        console.error(
          "❌ [RACE CONDITION FIX] Error in checkExistingFreeIdea:",
          {
            code: error.code,
            message: error.message,
            userEmail,
            timestamp: new Date().toISOString(),
          },
        );

        // Don't set error state if we already have a free idea displayed
        if (!freeIdea) {
          setError("Failed to load your free idea");
        } else {
          console.warn(
            "⚠️ [RACE CONDITION FIX] Query failed but preserving existing free idea display",
          );
        }
        return;
      }

      if (data) {
        // Convert database format to component format
        const ideaData: GeneratedIdea = {
          id: data.id,
          title: data.title,
          problem: "Identified market opportunity", // We don't store problem separately in DB
          solution: data.description,
          market_size: data.market_size || "Market size analysis pending",
          target_audience:
            data.target_audience || "Target audience analysis pending",
          revenue_streams: data.revenue_streams || [],
          validation_data: data.validation_data || {
            market_trends: [],
            competitor_analysis: "Competitor analysis pending",
            demand_indicators: [],
          },
        };
        setFreeIdea(ideaData);
        // Clear any previous error if we successfully loaded data
        setError(null);
      }
    } catch (err) {
      console.error(
        "❌ [RACE CONDITION FIX] Exception in checkExistingFreeIdea:",
        err,
      );

      // Don't set error state if we already have a free idea displayed
      if (!freeIdea) {
        setError("Failed to load your free idea");
      } else {
        console.warn(
          "⚠️ [RACE CONDITION FIX] Exception occurred but preserving existing free idea display",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a new free idea or redirect to checkout
  const generateFreeIdea = async () => {
    // If user has already generated their free idea, redirect to checkout
    if (hasGeneratedIdea) {
      try {
        const response = await fetch("/api/billing/create-checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            price_id: "price_1RfgF5CBtpFxI513jBPiqq2o",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to create checkout session",
          );
        }

        const { url } = await response.json();
        if (url) {
          window.location.href = url;
        } else {
          throw new Error("No checkout URL received");
        }
      } catch (error) {
        console.error("Error creating checkout session:", error);
        setError("Failed to start checkout process. Please try again.");
      }
      return;
    }

    // Generate free idea for first-time users
    setIsGenerating(true);
    setShowFullScreenLoading(true);
    setError(null);

    // Set global state to prevent background fetching
    setIdeaGenerationState(true);

    try {
      const response = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          preferences: "Generate a unique startup idea for an indie hacker",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate idea");
      }

      // Mark idea generation as complete
      setIdeaGenerationState(false);

      // Hide loading overlay with a slight delay for smooth transition
      setTimeout(() => {
        setShowFullScreenLoading(false);
      }, 500);

      // Redirect to library page after hiding overlay with router refresh
      setTimeout(() => {
        router.push("/library");
        router.refresh();
      }, 800);
    } catch (err) {
      console.error("Error generating free idea:", err);
      setError("Failed to generate your free idea. Please try again.");
      setIsGenerating(false);
      setShowFullScreenLoading(false);
      // Reset idea generation state on error
      setIdeaGenerationState(false);
    }
  };

  useEffect(() => {
    checkExistingFreeIdea();
  }, [userEmail]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Free Idea</CardTitle>
          <CardDescription>
            Loading your complimentary startup idea...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !freeIdea) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Free Idea</CardTitle>
          <CardDescription>
            Here's your complimentary startup idea to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={generateFreeIdea} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate Free Idea
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Always show the generation interface for free users
  return (
    <>
      {/* Full-screen loading overlay */}
      <FullScreenLoadingOverlay isVisible={showFullScreenLoading} />

      <Card className="h-48">
        <CardHeader>
          <CardTitle>Your Free Idea</CardTitle>
          <CardDescription>
            {hasGeneratedIdea
              ? "You have already used your free idea. Upgrade to generate more ideas (9 EUR/month)."
              : "Generate your complimentary startup idea to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="p-4 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "#FEFDFB" }}
          >
            {!hasGeneratedIdea ? (
              <Button
                onClick={generateFreeIdea}
                disabled={isGenerating}
                size="lg"
                className="w-64 bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : hasGeneratedIdea ? (
                  "Generate more ideas"
                ) : (
                  "Generate your Free idea"
                )}
              </Button>
            ) : (
              freeIdea && (
                <span className="text-sm font-medium text-gray-700 text-center w-full">
                  {freeIdea.title}
                </span>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
