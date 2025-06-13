import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import pRetry from "p-retry";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimit } from "@/lib/rate-limit";
import { sanitizeHtml } from "@/utils/utils";

// Rate limiting
const ideaGenerationLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// Input validation schema with stricter validation
const generateIdeaSchema = z.object({
  preferences: z.string().max(1000).optional(),
  constraints: z.string().max(1000).optional(),
  industry: z.string().max(100).optional(),
  email: z.string().email().min(1).max(254),
  budget: z.string().max(100).optional(),
  difficultyLevel: z.string().max(100).optional(),
});

// Response structure schema
const ideaResponseSchema = z.object({
  title: z.string(),
  problem: z.string(),
  solution: z.string(),
  market_size: z.string(),
  target_audience: z
    .union([z.string(), z.array(z.string())])
    .transform((val) => (Array.isArray(val) ? val.join(", ") : val)),
  revenue_streams: z.array(z.string()),
  validation_data: z.object({
    market_trends: z.array(z.string()),
    competitor_analysis: z.string(),
    demand_indicators: z.array(z.string()),
  }),
});

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// EXA API call with retry logic
async function callExaAPI(query: string) {
  return pRetry(
    async () => {
      const response = await fetch("https://api.exa.ai/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.EXA_API_KEY || "",
        },
        body: JSON.stringify({
          query,
          type: "neural",
          useAutoprompt: true,
          numResults: 10,
          contents: {
            text: true,
            highlights: true,
            summary: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `EXA API error: ${response.status} ${response.statusText}`,
        );
      }

      return response.json();
    },
    {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 10000,
      onFailedAttempt: (error) => {
        console.log(
          `EXA API attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
        );
      },
    },
  );
}

// Claude API call with retry logic
async function callClaudeAPI(
  marketData: any,
  preferences?: string,
  constraints?: string,
  industry?: string,
) {
  return pRetry(
    async () => {
      // Reduce market data to key insights only to minimize token usage
      const marketInsights =
        marketData?.results?.slice(0, 3)?.map((result: any) => ({
          title: result.title?.substring(0, 100),
          summary: result.summary?.substring(0, 200),
        })) || [];

      const prompt = `Generate a startup idea based on these market insights:
${JSON.stringify(marketInsights)}

Preferences: ${preferences?.substring(0, 100) || "None"}
Constraints: ${constraints?.substring(0, 100) || "None"}
Industry: ${industry?.substring(0, 50) || "Any"}

Return JSON format:
{
  "title": "Startup Name",
  "problem": "Problem statement",
  "solution": "Solution description",
  "market_size": "Market size estimate",
  "target_audience": "Target audience",
  "revenue_streams": ["Stream 1", "Stream 2", "Stream 3"],
  "validation_data": {
    "market_trends": ["Trend 1", "Trend 2", "Trend 3"],
    "competitor_analysis": "Competitor analysis",
    "demand_indicators": ["Indicator 1", "Indicator 2", "Indicator 3"]
  }
}`;

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response format from Claude API");
      }

      // Extract JSON from Claude's response with improved robustness
      let responseText = content.text.trim();

      // Clean up the response text - remove Windows line endings and normalize
      responseText = responseText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      // Try multiple approaches to extract valid JSON
      let jsonString = "";
      let parseSuccess = false;

      // Approach 1: Find the first complete JSON object using brace counting
      let braceCount = 0;
      let startIndex = -1;
      let endIndex = -1;

      for (let i = 0; i < responseText.length; i++) {
        const char = responseText[i];

        if (char === "{") {
          if (braceCount === 0) {
            startIndex = i;
          }
          braceCount++;
        } else if (char === "}") {
          braceCount--;
          if (braceCount === 0 && startIndex !== -1) {
            endIndex = i;
            break;
          }
        }
      }

      if (startIndex !== -1 && endIndex !== -1) {
        jsonString = responseText.substring(startIndex, endIndex + 1);

        // Clean the JSON string
        jsonString = jsonString
          .replace(/\n\s*/g, " ") // Replace newlines with spaces
          .replace(/\s+/g, " ") // Normalize multiple spaces
          .replace(/,\s*}/g, "}") // Remove trailing commas before closing braces
          .replace(/,\s*]/g, "]") // Remove trailing commas before closing brackets
          .trim();

        try {
          const parsed = JSON.parse(jsonString);
          return parsed;
        } catch (parseError) {
          console.log(
            "First parsing attempt failed, trying fallback methods...",
          );
        }
      }

      // Approach 2: Use regex to find JSON-like structure
      const jsonRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
      const matches = responseText.match(jsonRegex);

      if (matches && matches.length > 0) {
        // Try the largest match first (most likely to be complete)
        const sortedMatches = matches.sort((a, b) => b.length - a.length);

        for (const match of sortedMatches) {
          try {
            let cleanMatch = match
              .replace(/\n\s*/g, " ")
              .replace(/\s+/g, " ")
              .replace(/,\s*}/g, "}")
              .replace(/,\s*]/g, "]")
              .trim();

            const parsed = JSON.parse(cleanMatch);
            // Validate that it has the expected structure
            if (parsed.title && parsed.problem && parsed.solution) {
              return parsed;
            }
          } catch (e) {
            continue;
          }
        }
      }

      // Approach 3: Manual extraction with more aggressive cleaning
      const firstBrace = responseText.indexOf("{");
      const lastBrace = responseText.lastIndexOf("}");

      if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
        jsonString = responseText.substring(firstBrace, lastBrace + 1);

        // More aggressive cleaning
        jsonString = jsonString
          .replace(/[\r\n]+/g, " ") // Replace all line breaks
          .replace(/\s+/g, " ") // Normalize spaces
          .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
          .replace(/([{\[])\s+/g, "$1") // Remove spaces after opening brackets
          .replace(/\s+([}\]])/g, "$1") // Remove spaces before closing brackets
          .replace(/"\s*:\s*/g, '":') // Normalize key-value separators
          .trim();

        try {
          const parsed = JSON.parse(jsonString);
          return parsed;
        } catch (finalError) {
          console.error("All JSON parsing attempts failed");
          console.error("Original response:", responseText);
          console.error("Final attempt string:", jsonString);
          console.error("Final error:", finalError);

          throw new Error(
            "Could not parse JSON from Claude response after multiple attempts",
          );
        }
      }

      throw new Error("Could not find valid JSON structure in Claude response");
    },
    {
      retries: 2,
      factor: 3,
      minTimeout: 2000,
      maxTimeout: 30000,
      onFailedAttempt: (error) => {
        console.log(
          `Claude API attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
        );
        // If it's a rate limit error, don't retry immediately
        if (
          error.message?.includes("rate_limit") ||
          error.message?.includes("429")
        ) {
          throw error; // Stop retrying for rate limits
        }
      },
    },
  );
}

// Check user subscription status
async function checkUserLimits(email: string, supabase: any) {
  // Check if user has active subscription
  const { data: user } = await supabase
    .from("users")
    .select("subscription")
    .eq("email", email)
    .single();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user?.user_id)
    .eq("status", "active")
    .single();

  const hasActiveSubscription = !!subscription;

  if (hasActiveSubscription) {
    return {
      hasActiveSubscription,
      remainingIdeas: Infinity,
      canGenerate: true,
      limitType: null,
    };
  }

  // Check hourly limit (12 per hour for free users)
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  const { count: hourlyCount } = await supabase
    .from("generated_ideas")
    .select("*", { count: "exact" })
    .eq("email", email)
    .gte("created_at", oneHourAgo.toISOString());

  const hourlyLimit = 12;
  const remainingHourlyIdeas = Math.max(0, hourlyLimit - (hourlyCount || 0));

  // Check daily limit (24 per day for free users)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: dailyCount } = await supabase
    .from("generated_ideas")
    .select("*", { count: "exact" })
    .eq("email", email)
    .gte("created_at", today.toISOString());

  const dailyLimit = 24;
  const remainingDailyIdeas = Math.max(0, dailyLimit - (dailyCount || 0));

  // User can generate if they haven't hit either limit
  const canGenerate = remainingHourlyIdeas > 0 && remainingDailyIdeas > 0;

  // Determine which limit is more restrictive
  const limitType =
    remainingHourlyIdeas === 0
      ? "hourly"
      : remainingDailyIdeas === 0
        ? "daily"
        : null;

  return {
    hasActiveSubscription,
    remainingIdeas: Math.min(remainingHourlyIdeas, remainingDailyIdeas),
    canGenerate,
    limitType,
    remainingHourlyIdeas,
    remainingDailyIdeas,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = generateIdeaSchema.parse(body);

    const {
      preferences,
      constraints,
      industry,
      email,
      budget,
      difficultyLevel,
    } = validatedData;

    // Verify the email matches the authenticated user
    if (email !== user.email) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 403 });
    }

    // Rate limiting per user
    try {
      await ideaGenerationLimiter.check(20, user.id); // 20 requests per minute per user
    } catch {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message:
            "Too many requests. Please wait a moment before generating another idea.",
        },
        { status: 429 },
      );
    }

    // Sanitize user inputs
    const sanitizedPreferences = preferences
      ? sanitizeHtml(preferences)
      : undefined;
    const sanitizedConstraints = constraints
      ? sanitizeHtml(constraints)
      : undefined;
    const sanitizedIndustry = industry ? sanitizeHtml(industry) : undefined;
    const sanitizedBudget = budget ? sanitizeHtml(budget) : undefined;
    const sanitizedDifficultyLevel = difficultyLevel
      ? sanitizeHtml(difficultyLevel)
      : undefined;

    // Check user limits
    const userLimits = await checkUserLimits(email, supabase);

    if (!userLimits.canGenerate) {
      let message = "";
      if (userLimits.limitType === "hourly") {
        message =
          "You have reached your hourly limit of 12 ideas. Free users can generate up to 12 ideas per hour and 24 ideas per day. Upgrade to Pro for unlimited generations!";
      } else if (userLimits.limitType === "daily") {
        message =
          "You have reached your daily limit of 24 ideas. Free users can generate up to 12 ideas per hour and 24 ideas per day. Upgrade to Pro for unlimited generations!";
      } else {
        message =
          "You have reached your generation limit. Upgrade to Pro for unlimited idea generations!";
      }

      return NextResponse.json(
        {
          error: "Generation limit reached",
          message,
          remainingIdeas: userLimits.remainingIdeas,
          limitType: userLimits.limitType,
        },
        { status: 429 },
      );
    }

    // Step 1: Call EXA API for market research with sanitized inputs
    const marketQuery = `startup opportunities ${sanitizedIndustry || ""} ${sanitizedPreferences || ""} market trends business ideas 2024`;

    console.log("Calling EXA API for market research...");
    const marketData = await callExaAPI(marketQuery);

    // Step 2: Pass market data to Claude for idea generation with sanitized inputs
    console.log("Processing market data with Claude AI...");
    const ideaResponse = await callClaudeAPI(
      marketData,
      sanitizedPreferences,
      sanitizedConstraints,
      sanitizedIndustry,
    );

    // Step 3: Validate and structure the response
    const validatedIdea = ideaResponseSchema.parse(ideaResponse);

    // Step 4: Save to database
    const { data: savedIdea, error: saveError } = await supabase
      .from("generated_ideas")
      .insert({
        email,
        title: validatedIdea.title,
        description: validatedIdea.solution,
        market_size: validatedIdea.market_size,
        target_audience: validatedIdea.target_audience,
        revenue_streams: validatedIdea.revenue_streams,
        validation_data: validatedIdea.validation_data,
        preferences: sanitizedPreferences || null,
        constraints: sanitizedConstraints || null,
        industry: sanitizedIndustry || null,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Database save error:", saveError);
      return NextResponse.json(
        { error: "Failed to save idea to database" },
        { status: 500 },
      );
    }

    // Step 5: Automatically save to library
    const { error: librarySaveError } = await supabase
      .from("saved_ideas")
      .insert({
        user_email: email,
        idea_id: savedIdea.id,
        title: validatedIdea.title,
        description: validatedIdea.solution,
        is_liked: false,
      });

    if (librarySaveError) {
      console.error("Library save error:", librarySaveError);
      // Don't fail the request if library save fails, just log it
    }

    // Return structured response
    return NextResponse.json({
      success: true,
      idea: {
        id: savedIdea.id,
        title: validatedIdea.title,
        problem: validatedIdea.problem,
        solution: validatedIdea.solution,
        market_size: validatedIdea.market_size,
        target_audience: validatedIdea.target_audience,
        revenue_streams: validatedIdea.revenue_streams,
        validation_data: validatedIdea.validation_data,
      },
      remainingIdeas: userLimits.hasActiveSubscription
        ? Infinity
        : userLimits.remainingIdeas - 1,
    });
  } catch (error) {
    console.error("API Error:", error);

    // Handle specific error types
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data", details: error.errors },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      // Check for rate limit errors
      if (
        error.message.includes("rate_limit_error") ||
        error.message.includes("rate limit") ||
        error.message.includes("429")
      ) {
        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message:
              "Too many requests. Please wait a moment and try again, or upgrade to Pro for higher limits.",
            requiresUpgrade: true,
          },
          { status: 429 },
        );
      }

      // Check for Anthropic API credit balance error
      if (
        error.message.includes("credit balance is too low") ||
        error.message.includes("Your credit balance is too low")
      ) {
        return NextResponse.json(
          {
            error: "API credits exhausted",
            message:
              "Our AI service is temporarily unavailable due to high demand. Please upgrade to Premium for priority access and unlimited idea generation.",
            requiresUpgrade: true,
          },
          { status: 402 },
        );
      }

      // Check if it's other API-related errors
      if (
        error.message.includes("EXA API") ||
        error.message.includes("Claude")
      ) {
        return NextResponse.json(
          {
            error: "External API error",
            message: "Failed to generate idea. Please try again.",
          },
          { status: 503 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
