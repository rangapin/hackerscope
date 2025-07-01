import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { revalidatePath } from "next/cache";
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

// EXA API call with optimized timeout and retry logic
async function callExaAPI(query: string) {
  // Skip EXA API if no API key is provided
  if (!process.env.EXA_API_KEY) {
    console.log("EXA API key not provided, skipping market research");
    return {
      results: [
        {
          title: "Market Research Data",
          summary:
            "General market trends and opportunities in the specified industry",
        },
      ],
    };
  }

  return pRetry(
    async () => {
      const apiKey = process.env.EXA_API_KEY;
      if (!apiKey) {
        throw new Error("EXA API key is not configured");
      }

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      try {
        const response = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            query: query.trim(),
            type: "neural",
            useAutoprompt: true,
            numResults: 3, // Reduced from 5 to 3 for faster response
            contents: {
              text: false, // Disable text content to reduce response size
              summary: true,
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `EXA API error: ${response.status} ${response.statusText}`,
            errorText,
          );
          throw new Error(
            `EXA API error: ${response.status} ${response.statusText}`,
          );
        }

        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    },
    {
      retries: 1, // Reduced from 2 to 1
      factor: 2,
      minTimeout: 500, // Reduced from 1000
      maxTimeout: 2000, // Reduced from 5000
      onFailedAttempt: (error) => {
        console.log(
          `EXA API attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
        );
      },
    },
  );
}

// Claude API call with optimized timeout and retry logic
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
        marketData?.results?.slice(0, 2)?.map((result: any) => ({
          title: result.title?.substring(0, 80),
          summary: result.summary?.substring(0, 150),
        })) || [];

      // Simplified prompt to reduce processing time
      const prompt = `Generate a startup idea based on these market insights:
${JSON.stringify(marketInsights)}

Preferences: ${preferences?.substring(0, 80) || "None"}
Constraints: ${constraints?.substring(0, 80) || "None"}
Industry: ${industry?.substring(0, 40) || "Any"}

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
        model: "claude-3-5-haiku-20241022", // Switched to faster Haiku model
        max_tokens: 1200, // Reduced from 1500
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
              .replace(/,\s*([}\]])/g, "$1") // Remove trailing commas
              .replace(/([{\[])\s+/g, "$1") // Remove spaces after opening brackets
              .replace(/\s+([}\]])/g, "$1") // Remove spaces before closing brackets
              .replace(/"\s*:\s*/g, '":') // Normalize key-value separators
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
      retries: 1, // Reduced from 2
      factor: 2, // Reduced from 3
      minTimeout: 1000, // Reduced from 2000
      maxTimeout: 8000, // Reduced from 30000
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
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("subscription, user_id")
    .eq("email", email)
    .single();

  if (userError) {
    console.error("Error fetching user:", userError);
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", user?.user_id)
    .eq("status", "active")
    .single();

  if (subscriptionError) {
    console.error("Error fetching subscription:", subscriptionError);
  }

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

  const { count: hourlyCount, error: hourlyError } = await supabase
    .from("generated_ideas")
    .select("*", { count: "exact" })
    .eq("email", email)
    .gte("created_at", oneHourAgo.toISOString());

  if (hourlyError) {
    console.error("Error fetching hourly count:", hourlyError);
  }

  const hourlyLimit = 12;
  const remainingHourlyIdeas = Math.max(0, hourlyLimit - (hourlyCount || 0));

  // Check daily limit (24 per day for free users)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: dailyCount, error: dailyError } = await supabase
    .from("generated_ideas")
    .select("*", { count: "exact" })
    .eq("email", email)
    .gte("created_at", today.toISOString());

  if (dailyError) {
    console.error("Error fetching daily count:", dailyError);
  }

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

    // Debug: Check if the Supabase client was created with proper API key
    console.log("🔍 [API KEY DEBUG] Supabase client in generate route:", {
      clientExists: !!supabase,
      timestamp: new Date().toISOString(),
    });

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
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

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

    // Step 1 & 2: Run EXA API and Claude API in parallel to reduce total execution time
    const marketQuery =
      `startup opportunities ${sanitizedIndustry || "technology"} ${sanitizedPreferences || ""} market trends business ideas 2024`.trim();

    console.log("Starting parallel API calls...");

    // Create fallback market data immediately
    const fallbackMarketData = {
      results: [
        {
          title: "Market Research Insights",
          summary: `Current market trends in ${sanitizedIndustry || "technology"} sector showing growth opportunities`,
        },
        {
          title: "Industry Analysis",
          summary:
            "Emerging technologies and consumer behavior patterns indicate strong demand",
        },
      ],
    };

    // Start EXA API call with timeout
    const exaPromise = Promise.race([
      callExaAPI(marketQuery),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("EXA API timeout")), 10000),
      ),
    ]).catch((error) => {
      console.error("EXA API failed, using fallback data:", error);
      return fallbackMarketData;
    });

    // Get market data with timeout protection
    const marketData = await exaPromise;

    // Step 2: Pass market data to Claude for idea generation with sanitized inputs
    console.log("Processing market data with Claude AI...");
    let ideaResponse;
    try {
      ideaResponse = await callClaudeAPI(
        marketData,
        sanitizedPreferences,
        sanitizedConstraints,
        sanitizedIndustry,
      );
    } catch (claudeError) {
      console.error("Claude API error:", claudeError);
      return NextResponse.json(
        {
          error: "AI service temporarily unavailable",
          message: "Failed to generate idea. Please try again in a moment.",
        },
        { status: 503 },
      );
    }

    // Step 3: Validate and structure the response
    let validatedIdea;
    try {
      validatedIdea = ideaResponseSchema.parse(ideaResponse);
    } catch (validationError) {
      console.error("Idea validation error:", validationError);
      return NextResponse.json(
        {
          error: "Invalid response format",
          message: "Failed to process generated idea. Please try again.",
        },
        { status: 500 },
      );
    }

    // Step 4: Save to database with enhanced error handling
    let savedIdea;
    try {
      // Verify user authentication before database operation
      const { data: authUser, error: authCheckError } =
        await supabase.auth.getUser();

      console.log("🔍 [406 DEBUG] Auth verification result:", {
        hasUser: !!authUser.user,
        userId: authUser.user?.id,
        userEmail: authUser.user?.email,
        authError: authCheckError,
        requestEmail: email,
        timestamp: new Date().toISOString(),
      });

      if (authCheckError || !authUser.user) {
        console.error("❌ [406 DEBUG] Authentication verification failed:", {
          authCheckError,
          errorCode: authCheckError?.code,
          errorMessage: authCheckError?.message,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { error: "Authentication required for database operation" },
          { status: 401 },
        );
      }

      // Ensure the authenticated user's email matches the request email
      if (authUser.user.email !== email) {
        console.error("❌ [406 DEBUG] Email mismatch in database operation", {
          authEmail: authUser.user.email,
          requestEmail: email,
          userId: authUser.user.id,
          timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
          { error: "Email verification failed" },
          { status: 403 },
        );
      }

      // Log JWT token information for debugging
      const session = await supabase.auth.getSession();
      console.log("🔍 [406 DEBUG] JWT Session info:", {
        hasSession: !!session.data.session,
        accessToken: session.data.session?.access_token
          ? "[PRESENT]"
          : "[MISSING]",
        refreshToken: session.data.session?.refresh_token
          ? "[PRESENT]"
          : "[MISSING]",
        expiresAt: session.data.session?.expires_at,
        tokenType: session.data.session?.token_type,
        sessionError: session.error,
        timestamp: new Date().toISOString(),
      });

      console.log("🔄 [DEBUG] Attempting to save idea for user:", {
        userId: authUser.user.id,
        email: authUser.user.email,
        timestamp: new Date().toISOString(),
      });

      // CRITICAL DEBUG: Compare client configurations
      console.log(
        "🔍 [CLIENT CONFIG DEBUG] API Route - Saving operation client config:",
        {
          clientType: "server-side",
          context: "API route",
          authMethod: "server-side auth.getUser()",
          hasAccessToken: session.data.session?.access_token
            ? "[PRESENT]"
            : "[MISSING]",
          tokenType: session.data.session?.token_type,
          userFromAuth: {
            id: authUser.user.id,
            email: authUser.user.email,
            role: authUser.user.role,
          },
          timestamp: new Date().toISOString(),
        },
      );

      // Test a simple SELECT query first to check RLS policies
      console.log(
        "🔍 [406 DEBUG] Testing SELECT access to generated_ideas table:",
      );
      const { data: testData, error: testError } = await supabase
        .from("generated_ideas")
        .select("id")
        .eq("email", email)
        .limit(1);

      console.log("🔍 [406 DEBUG] SELECT test result:", {
        testData: testData ? `Found ${testData.length} records` : "No data",
        testError: testError
          ? {
              code: testError.code,
              message: testError.message,
              details: testError.details,
              hint: testError.hint,
            }
          : "No error",
        timestamp: new Date().toISOString(),
      });

      // CRITICAL DEBUG: Test SELECT before INSERT to compare permissions
      console.log("🔍 [RLS DEBUG] Testing SELECT permissions before INSERT:");
      const { data: preInsertTest, error: preInsertError } = await supabase
        .from("generated_ideas")
        .select("id")
        .eq("email", email)
        .limit(1);

      console.log("🔍 [RLS DEBUG] Pre-INSERT SELECT test result:", {
        canSelect: !preInsertError,
        selectError: preInsertError
          ? {
              code: preInsertError.code,
              message: preInsertError.message,
              hint: preInsertError.hint,
            }
          : null,
        foundRecords: preInsertTest?.length || 0,
        timestamp: new Date().toISOString(),
      });

      const { data, error: saveError } = await supabase
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

      // CRITICAL DEBUG: Test SELECT after INSERT to see if permissions changed
      if (!saveError) {
        console.log(
          "🔍 [RLS DEBUG] Testing SELECT permissions after successful INSERT:",
        );
        const { data: postInsertTest, error: postInsertError } = await supabase
          .from("generated_ideas")
          .select("id, title")
          .eq("email", email)
          .order("created_at", { ascending: false })
          .limit(3);

        console.log("🔍 [RLS DEBUG] Post-INSERT SELECT test result:", {
          canSelect: !postInsertError,
          selectError: postInsertError
            ? {
                code: postInsertError.code,
                message: postInsertError.message,
                hint: postInsertError.hint,
              }
            : null,
          foundRecords: postInsertTest?.length || 0,
          recordTitles: postInsertTest?.map((r) => r.title) || [],
          timestamp: new Date().toISOString(),
        });
      }

      if (saveError) {
        console.error("❌ [406 DEBUG] Database save error:", {
          code: saveError.code,
          message: saveError.message,
          hint: saveError.hint,
          timestamp: new Date().toISOString(),
        });

        // Check if this is a 406 error specifically
        if (saveError.code === "406" || saveError.message?.includes("406")) {
          console.error("❌ [406 DEBUG] Detected 406 error in database save:", {
            fullError: saveError,
            userEmail: email,
            userId: authUser.user.id,
            timestamp: new Date().toISOString(),
          });
        }

        // Handle specific RLS policy errors
        if (
          saveError.code === "42501" ||
          saveError.message?.includes("policy")
        ) {
          return NextResponse.json(
            {
              error: "Permission denied",
              message:
                "Unable to save idea due to security policy. Please try signing out and back in.",
            },
            { status: 403 },
          );
        }

        return NextResponse.json(
          {
            error: "Failed to save idea to database",
            details: saveError.message,
            debugInfo: {
              code: saveError.code,
              hint: saveError.hint,
            },
          },
          { status: 500 },
        );
      }

      savedIdea = data;
      console.log("✅ [DEBUG] Successfully saved idea to generated_ideas:", {
        id: savedIdea.id,
        email,
        title: savedIdea.title,
        timestamp: new Date().toISOString(),
      });
    } catch (dbError) {
      console.error("❌ [406 DEBUG] Database operation error:", {
        error: dbError,
        errorMessage:
          dbError instanceof Error ? dbError.message : "Unknown error",
        errorStack: dbError instanceof Error ? dbError.stack : "No stack trace",
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        {
          error: "Database error",
          message: "Failed to save idea. Please try again.",
        },
        { status: 500 },
      );
    }

    // Step 5: Automatically save to library with enhanced error handling
    try {
      console.log("🔄 [DEBUG] Attempting to save to library for user:", {
        email,
        ideaId: savedIdea.id,
        timestamp: new Date().toISOString(),
      });

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
        console.error("❌ [DEBUG] Library save error:", librarySaveError);
        console.error("Library save error details:", {
          code: librarySaveError.code,
          message: librarySaveError.message,
          hint: librarySaveError.hint,
        });
        // Don't fail the request if library save fails, just log it
      } else {
        console.log("✅ [DEBUG] Successfully saved to saved_ideas library:", {
          ideaId: savedIdea.id,
          email,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (libraryError) {
      console.error("❌ [DEBUG] Library operation error:", libraryError);
      // Don't fail the request if library save fails, just log it
    }

    // Comprehensive cache invalidation across all layers
    try {
      console.log(
        "🔄 [CACHE DEBUG] Starting comprehensive cache invalidation:",
        {
          timestamp: new Date().toISOString(),
          paths: ["/library", "/dashboard", "/"],
          cacheInvalidationStrategy: "multi-layer",
        },
      );

      // Next.js cache invalidation
      revalidatePath("/library", "page");
      console.log("✅ [CACHE DEBUG] Revalidated /library page");

      revalidatePath("/dashboard", "page");
      console.log("✅ [CACHE DEBUG] Revalidated /dashboard page");

      revalidatePath("/", "layout");
      console.log("✅ [CACHE DEBUG] Revalidated / layout");

      // Force revalidation of all related paths
      revalidatePath("/library", "layout");
      console.log("✅ [CACHE DEBUG] Revalidated /library layout");

      revalidatePath("/dashboard", "layout");
      console.log("✅ [CACHE DEBUG] Revalidated /dashboard layout");

      console.log(
        "✅ [CACHE DEBUG] Successfully completed all cache invalidation calls",
        {
          timestamp: new Date().toISOString(),
          invalidatedPaths: ["/library", "/dashboard", "/"],
          invalidatedLayouts: ["/library", "/dashboard", "/"],
        },
      );
    } catch (revalidateError) {
      console.error(
        "❌ [CACHE DEBUG] Error in cache invalidation:",
        revalidateError,
      );
      // Don't fail the request if revalidation fails
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

    // Ensure we always return a JSON response
    try {
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
        {
          error: "Internal server error",
          message: "An unexpected error occurred. Please try again.",
        },
        { status: 500 },
      );
    } catch (responseError) {
      // Fallback if even the error response fails
      console.error("Failed to create error response:", responseError);
      return new Response(
        JSON.stringify({
          error: "Critical server error",
          message: "Unable to process request. Please try again.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
