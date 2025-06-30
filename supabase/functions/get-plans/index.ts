import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the actual Stripe Price ID from environment variables
    const allowedPriceIds = Deno.env.get("ALLOWED_STRIPE_PRICE_IDS");

    console.log("Environment check:", {
      allowedPriceIds: allowedPriceIds
        ? `${allowedPriceIds.substring(0, 20)}...`
        : "missing",
    });

    if (!allowedPriceIds) {
      console.error("ALLOWED_STRIPE_PRICE_IDS environment variable not set");
      return new Response(
        JSON.stringify({
          error: "Pricing configuration not available",
          details: "ALLOWED_STRIPE_PRICE_IDS environment variable is missing",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 500,
        },
      );
    }

    // Parse the price IDs from the allowed list
    const priceIds = allowedPriceIds
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    console.log("Parsed price IDs:", priceIds);

    if (priceIds.length === 0) {
      console.error("ALLOWED_STRIPE_PRICE_IDS is empty after parsing");
      return new Response(
        JSON.stringify({
          error: "No pricing plans available",
          details: "ALLOWED_STRIPE_PRICE_IDS contains no valid price IDs",
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
          status: 500,
        },
      );
    }

    const stripePriceId = priceIds[0];

    // Return plans with the actual Stripe Price ID
    const plans = [
      {
        id: stripePriceId,
        name: "Premium",
        amount: 900, // €9.00 in cents
        currency: "eur",
        interval: "month",
        features: [
          "Unlimited idea generation",
          "Advanced market analysis",
          "Priority support",
          "Export capabilities",
        ],
      },
    ];

    console.log("Returning plans with Price ID:", stripePriceId);

    return new Response(JSON.stringify(plans), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error in get-plans function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch plans",
        details: error.message,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      },
    );
  }
});
