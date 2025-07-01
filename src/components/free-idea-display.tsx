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
  freeIdea?: any | null;
}

export function FreeIdeaDisplay({
  userEmail,
  hasGeneratedIdea = false,
  freeIdea: initialFreeIdea = null,
}: FreeIdeaDisplayProps) {
  const router = useRouter();
  const [freeIdea, setFreeIdea] = useState<GeneratedIdea | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullScreenLoading, setShowFullScreenLoading] = useState(false);

  // Convert server-side data to component format
  const convertToComponentFormat = (data: any): GeneratedIdea => {
    return {
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
        console.log(
          "🎉 [DEBUG] Idea generation completed, redirecting to library",
        );
        // Redirect to library to show the generated idea immediately
        window.location.href = "/library";
      }, 500);
    } catch (err) {
      console.error("Error generating free idea:", err);
      setError("Failed to generate your free idea. Please try again.");
      setIsGenerating(false);
      setShowFullScreenLoading(false);
      // Reset idea generation state on error
      setIdeaGenerationState(false);
    }
  };

  // Initialize component with server-side data
  useEffect(() => {
    console.log("🔍 [SERVER-SIDE] FreeIdeaDisplay initializing with props:", {
      userEmail,
      hasGeneratedIdea,
      hasFreeIdea: !!initialFreeIdea,
      freeIdeaId: initialFreeIdea?.id,
      timestamp: new Date().toISOString(),
    });

    if (initialFreeIdea) {
      const convertedIdea = convertToComponentFormat(initialFreeIdea);
      setFreeIdea(convertedIdea);
      console.log("✅ [SERVER-SIDE] Set free idea from server-side data:", {
        ideaId: convertedIdea.id,
        ideaTitle: convertedIdea.title,
      });
    } else {
      setFreeIdea(null);
      console.log("ℹ️ [SERVER-SIDE] No free idea data from server");
    }
  }, [initialFreeIdea, userEmail]);

  // Listen for idea generation completion to refresh the page
  useEffect(() => {
    const handleIdeaGenerated = () => {
      console.log(
        "🎉 [IDEA GENERATED] FreeIdeaDisplay - Redirecting to refresh server-side data",
      );
      // Redirect to dashboard to get fresh server-side data
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    };

    window.addEventListener("ideaGenerated", handleIdeaGenerated);
    return () =>
      window.removeEventListener("ideaGenerated", handleIdeaGenerated);
  }, []);

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
            {/* Debug info */}
            {process.env.NODE_ENV === "development" && (
              <div className="text-xs text-gray-500 mb-2">
                Debug: hasGeneratedIdea={String(hasGeneratedIdea)}, freeIdea=
                {freeIdea ? "exists" : "null"}, serverData=
                {initialFreeIdea ? "provided" : "null"}
              </div>
            )}

            {freeIdea ? (
              /* Show the generated idea */
              <div className="text-center w-full">
                <span className="text-sm font-medium text-gray-700 block mb-2">
                  {freeIdea.title}
                </span>
                <Button
                  onClick={() => setShowDetailsModal(true)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  View Details
                </Button>
              </div>
            ) : !hasGeneratedIdea ? (
              /* Show generation button for users who haven't generated */
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
                ) : (
                  "Generate your Free idea"
                )}
              </Button>
            ) : (
              /* Show upgrade button for users who have generated but idea not found */
              <div className="text-center w-full">
                <p className="text-sm text-gray-600 mb-2">
                  You've used your free idea
                </p>
                <Button
                  onClick={generateFreeIdea}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Upgrade for More Ideas
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal for idea details */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {freeIdea?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Your generated startup idea details
            </DialogDescription>
          </DialogHeader>

          {freeIdea && (
            <div className="space-y-6">
              {/* Problem & Solution */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Problem</h3>
                  <p className="text-gray-700 text-sm">{freeIdea.problem}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Solution</h3>
                  <div className="text-gray-700 text-sm">
                    {showFullDescription ? (
                      <p>{freeIdea.solution}</p>
                    ) : (
                      <p>
                        {freeIdea.solution.length > 200
                          ? `${freeIdea.solution.substring(0, 200)}...`
                          : freeIdea.solution}
                      </p>
                    )}
                    {freeIdea.solution.length > 200 && (
                      <button
                        onClick={() =>
                          setShowFullDescription(!showFullDescription)
                        }
                        className="text-blue-600 hover:text-blue-800 text-xs mt-1 underline"
                      >
                        {showFullDescription ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Market & Audience */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Market Size
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {freeIdea.market_size}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Target Audience
                  </h3>
                  <p className="text-gray-700 text-sm">
                    {freeIdea.target_audience}
                  </p>
                </div>
              </div>

              {/* Revenue Streams */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Revenue Streams
                </h3>
                <div className="flex flex-wrap gap-2">
                  {freeIdea.revenue_streams.map(
                    (stream: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {stream}
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              {/* Validation Data */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">
                  Market Validation
                </h3>

                <div>
                  <h4 className="font-medium text-gray-800 mb-1 text-sm">
                    Market Trends
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {freeIdea.validation_data.market_trends.map(
                      (trend: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {trend}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-1 text-sm">
                    Competitor Analysis
                  </h4>
                  <p className="text-gray-700 text-sm">
                    {freeIdea.validation_data.competitor_analysis}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-1 text-sm">
                    Demand Indicators
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {freeIdea.validation_data.demand_indicators.map(
                      (indicator: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {indicator}
                        </Badge>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
