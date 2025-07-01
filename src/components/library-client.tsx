"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";
import { getUser } from "@/utils/auth";
import DashboardNavbar from "@/components/dashboard-navbar";
import { checkUserSubscription } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, RefreshCw } from "lucide-react";

// Terracotta pulsing dot loading animation
function LoadingAnimation() {
  return (
    <div className="flex items-center justify-center min-h-screen">
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

interface LibraryClientProps {}

export function LibraryClient({}: LibraryClientProps = {}) {
  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const router = useRouter();

  // Fetch saved ideas with details
  const getSavedIdeasWithDetails = async (
    userEmail: string,
  ): Promise<(SavedIdea & { generated_idea?: any })[]> => {
    const supabase = createClient();

    // Get saved ideas
    const { data: savedIdeas, error: savedError } = await supabase
      .from("saved_ideas")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false });

    if (savedError) {
      console.error("Error loading saved ideas:", savedError);
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
      console.error("Error loading generated ideas:", generatedError);
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
  };

  // Load user data and ideas on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // Get user
        const currentUser = await getUser();
        if (!currentUser) {
          router.push("/sign-in");
          return;
        }

        setUser(currentUser);

        // Check subscription
        const subscriptionStatus = await checkUserSubscription(currentUser.id);
        setIsSubscribed(subscriptionStatus);

        // Get saved ideas
        const savedIdeas = await getSavedIdeasWithDetails(
          currentUser.email || "",
        );
        setIdeas(savedIdeas);
      } catch (error) {
        console.error("Error loading library data:", error);
        router.push("/sign-in");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleViewDetails = (idea: SavedIdea) => {
    setSelectedIdea(idea);
    setShowDetailsModal(true);
  };

  // Show loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FEFDFB" }}>
        <div className="container mx-auto px-4 py-8">
          <LoadingAnimation />
        </div>
      </div>
    );
  }

  if (!ideas || ideas.length === 0) {
    return (
      <>
        <DashboardNavbar user={user} isSubscribed={isSubscribed} />
        <div className="min-h-screen" style={{ backgroundColor: "#FEFDFB" }}>
          <main className="w-full pt-8">
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

                {/* No Ideas Content */}
                <div className="space-y-8">
                  <Card className="bg-white border-gray-200">
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                          No saved ideas yet
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Generate your first startup idea or refresh if you
                          just created one.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="lg"
                      className="bg-white border-2 border-[#D4714B] text-[#D4714B] hover:bg-[#D4714B] hover:text-white font-medium py-3 px-6 rounded-md transition-colors duration-200 flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Page
                    </Button>
                    <Button
                      onClick={() => router.push("/dashboard")}
                      size="lg"
                      className="bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
                    >
                      Generate more ideas
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar user={user} isSubscribed={isSubscribed} />
      <div className="min-h-screen" style={{ backgroundColor: "#FEFDFB" }}>
        <main className="w-full pt-8">
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
              <div className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {ideas && ideas.length > 0 ? (
                    ideas.map((idea) => (
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
                                {new Date(idea.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "2-digit",
                                    day: "2-digit",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                              {idea.is_liked && (
                                <span className="text-red-500">♥</span>
                              )}
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
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <p className="text-gray-500">No saved ideas found</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="lg"
                    className="bg-white border-2 border-[#D4714B] text-[#D4714B] hover:bg-[#D4714B] hover:text-white font-medium py-3 px-6 rounded-md transition-colors duration-200 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Page
                  </Button>
                  <Button
                    onClick={() => router.push("/dashboard")}
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
                  >
                    Generate more ideas
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
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
              <div className="bg-orange-50 rounded-lg p-8 border border-gray-200">
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
                    <div className="bg-orange-50 rounded-lg p-8 border border-gray-200">
                      <h4 className="text-lg font-medium text-black mb-6 border-l-4 border-[#D4714B] pl-4">
                        Market Size
                      </h4>
                      <p className="text-[#666] leading-loose">
                        {selectedIdea.generated_idea.market_size ||
                          "Market size analysis not available"}
                      </p>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-8 border border-gray-200">
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
                      <div className="bg-orange-50 rounded-lg p-8 border border-gray-200">
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
                    <div className="bg-orange-50 rounded-lg p-8 border border-gray-200">
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
                                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
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
                                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
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
    </>
  );
}
