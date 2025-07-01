"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

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

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  created_at: string;
  is_liked: boolean;
}

interface IdeaGeneratorProps {
  userEmail: string;
}

export default function IdeaGenerator({ userEmail }: IdeaGeneratorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [industry, setIndustry] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  const [preferences, setPreferences] = useState("");
  const [budget, setBudget] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdea, setGeneratedIdea] = useState<GeneratedIdea | null>(
    null,
  );
  const [isLiked, setIsLiked] = useState(false);
  const [remainingIdeas, setRemainingIdeas] = useState<number | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFullScreenLoading, setShowFullScreenLoading] = useState(false);

  const industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Education",
    "E-commerce",
    "Food & Beverage",
    "Real Estate",
    "Transportation",
    "Entertainment",
    "Sustainability",
    "Gaming",
    "Social Media",
  ];

  const businessModels = [
    "SaaS",
    "Marketplace",
    "E-commerce",
    "Subscription",
    "Freemium",
    "Mobile App",
    "Consulting/Service",
    "Platform",
  ];

  const budgetRanges = [
    "Under $1,000",
    "$1,000 - $5,000",
    "$5,000 - $10,000",
    "$10,000 - $25,000",
    "$25,000 - $50,000",
    "$50,000 - $100,000",
    "Over $100,000",
  ];

  const difficultyLevels = [
    "Beginner (Simple execution)",
    "Intermediate (Moderate complexity)",
    "Advanced (High complexity)",
    "Expert (Very challenging)",
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setShowFullScreenLoading(true);
    setGeneratedIdea(null);

    try {
      const response = await fetch("/api/ideas/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          industry: industry || undefined,
          preferences: preferences || undefined,
          budget: budget || undefined,
          difficultyLevel: difficultyLevel || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 402 && data.requiresUpgrade) {
          toast({
            title: "AI Service at Capacity",
            description:
              "Our AI service is currently at capacity. Upgrade to Premium for priority access and unlimited idea generation. Click 'Upgrade to Premium' in the navigation bar to get started!",
            variant: "destructive",
          });
          return;
        }

        if (response.status === 429) {
          toast({
            title: "Generation Limit Reached",
            description:
              "You have reached your limit. Premium users can generate up to 12 ideas per hour and 24 ideas per day. Your limit will reset soon!",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.message || "Failed to generate idea");
      }

      // Show success message
      toast({
        title: "Idea Generated Successfully!",
        description: "Your new startup idea has been saved to your library.",
        variant: "default",
      });

      // Store the generated idea data for immediate display
      setGeneratedIdea(data.idea);
      setRemainingIdeas(data.remainingIdeas);

      // Add a small delay to ensure the idea is fully saved
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error generating idea:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate idea. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
      setShowFullScreenLoading(false);
      return;
    }

    // Hide loading overlay
    setIsGenerating(false);
    setShowFullScreenLoading(false);

    // Add a delay to ensure database transaction is fully committed and then redirect
    setTimeout(() => {
      // Use router.push with refresh to ensure fresh data
      router.push("/library");
      router.refresh();
    }, 2000);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <>
      {/* Full-screen loading overlay */}
      <FullScreenLoadingOverlay isVisible={showFullScreenLoading} />

      <div className="space-y-6">
        {/* Generation Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="mb-8">
            <h2 className="section-heading text-black mb-3">
              Generate New Startup Idea
            </h2>
            <p className="body-text text-gray-600 leading-relaxed">
              Customize your preferences to get a tailored startup idea with
              AI-powered market research
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-normal text-gray-600">
                  Industry (Optional)
                </label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black">
                    <SelectValue placeholder="Select an industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {industries.map((ind) => (
                      <SelectItem
                        key={ind}
                        value={ind}
                        className="hover:bg-gray-50"
                      >
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-normal text-gray-600">
                  Business Model (Optional)
                </label>
                <Select value={businessModel} onValueChange={setBusinessModel}>
                  <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black">
                    <SelectValue placeholder="Select a business model" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {businessModels.map((model) => (
                      <SelectItem
                        key={model}
                        value={model}
                        className="hover:bg-gray-50"
                      >
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-normal text-gray-600">
                  Budget (Optional)
                </label>
                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {budgetRanges.map((range) => (
                      <SelectItem
                        key={range}
                        value={range}
                        className="hover:bg-gray-50"
                      >
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-normal text-gray-600">
                  Difficulty Level (Optional)
                </label>
                <Select
                  value={difficultyLevel}
                  onValueChange={setDifficultyLevel}
                >
                  <SelectTrigger className="bg-white border-gray-300 hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black">
                    <SelectValue placeholder="Select difficulty level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {difficultyLevels.map((level) => (
                      <SelectItem
                        key={level}
                        value={level}
                        className="hover:bg-gray-50"
                      >
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-normal text-gray-600">
                Preferences (Optional)
              </label>
              <Textarea
                placeholder="e.g., Focus on mobile apps, target millennials, use AI technology..."
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="min-h-[100px] bg-white border-gray-300 hover:border-gray-400 focus:border-black focus:ring-1 focus:ring-black resize-none"
              />
            </div>

            <div className="flex justify-center">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="w-64 bg-black hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
              >
                {isGenerating ? "Generating Your Idea..." : "Generate Idea"}
              </Button>
            </div>
          </div>
        </div>

        {/* Generated Idea Display */}
        {generatedIdea && (
          <Card className="bg-white border-2 border-gray-300">
            <CardHeader>
              <div className="space-y-4">
                <h2 className="section-heading text-black">
                  {generatedIdea.title}
                </h2>
                <p className="body-text text-gray-600 leading-relaxed">
                  {generatedIdea.solution}
                </p>
                <Badge
                  variant="outline"
                  className="bg-[#D4714B]/20 text-[#D4714B] border-[#D4714B]/40 w-fit"
                >
                  {industry}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDetailsModal(true)}
                >
                  View Details
                </Button>
                <div className="flex-1 flex items-center justify-center text-sm text-green-600 font-medium">
                  ✓ Saved to library - Redirecting...
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Idea Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="section-heading text-black mb-6">
                {generatedIdea?.title}
              </DialogTitle>
            </DialogHeader>

            {generatedIdea && (
              <div className="space-y-6">
                {/* Problem Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-black">Problem</h3>
                  <p className="body-text text-gray-600 leading-relaxed">
                    {generatedIdea.problem}
                  </p>
                </div>

                {/* Solution Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-black">Solution</h3>
                  <p className="body-text text-gray-600 leading-relaxed">
                    {generatedIdea.solution}
                  </p>
                </div>

                {/* Market Size Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-black">
                    Market Size
                  </h3>
                  <p className="body-text text-gray-600 leading-relaxed">
                    {generatedIdea.market_size}
                  </p>
                </div>

                {/* Target Audience Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-black">
                    Target Audience
                  </h3>
                  <p className="body-text text-gray-600 leading-relaxed">
                    {generatedIdea.target_audience}
                  </p>
                </div>

                {/* Revenue Streams Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-black">
                    Revenue Streams
                  </h3>
                  <div className="space-y-3">
                    {generatedIdea.revenue_streams.map((stream, index) => (
                      <p
                        key={index}
                        className="body-text text-gray-600 leading-relaxed"
                      >
                        {stream}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Key Market Trends Section */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium text-black">
                    Key Market Trends
                  </h3>
                  <div className="space-y-5">
                    {generatedIdea.validation_data.market_trends.length > 0 && (
                      <div className="space-y-3">
                        {generatedIdea.validation_data.market_trends.map(
                          (trend, index) => (
                            <p
                              key={index}
                              className="body-text text-gray-600 leading-relaxed"
                            >
                              {trend}
                            </p>
                          ),
                        )}
                      </div>
                    )}

                    {generatedIdea.validation_data.competitor_analysis && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-black">
                          Competitor Analysis
                        </h4>
                        <p className="body-text text-gray-600 leading-relaxed">
                          {generatedIdea.validation_data.competitor_analysis}
                        </p>
                      </div>
                    )}

                    {generatedIdea.validation_data.demand_indicators.length >
                      0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-black">
                          Demand Indicators
                        </h4>
                        <div className="space-y-2">
                          {generatedIdea.validation_data.demand_indicators.map(
                            (indicator, index) => (
                              <p
                                key={index}
                                className="body-text text-gray-600 leading-relaxed"
                              >
                                {indicator}
                              </p>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <div className="flex-1 flex items-center justify-center text-sm text-green-600 font-medium">
                    ✓ Saved to your library
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
