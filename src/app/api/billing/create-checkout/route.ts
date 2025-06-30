import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { z } from "zod";

// Input validation schema
const createCheckoutSchema = z.object({
  price_id: z.string().min(1).max(100),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const { price_id } = createCheckoutSchema.parse(body);

    // Debug logging
    console.log("Received price_id:", price_id);
    console.log("Environment variable raw:", process.env.ALLOWED_STRIPE_PRICE_IDS);
    
    // Additional validation - ensure price_id is from our allowed list
    const allowedPriceIds = process.env.ALLOWED_STRIPE_PRICE_IDS?.split(",") || [];
    
    console.log("Allowed price IDs array:", allowedPriceIds);
    console.log("Array length:", allowedPriceIds.length);
    console.log("Does array include price_id:", allowedPriceIds.includes(price_id));
    
    if (allowedPriceIds.length > 0 && !allowedPriceIds.includes(price_id)) {
      console.log("VALIDATION FAILED - Invalid price ID");
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    console.log("VALIDATION PASSED - Proceeding to Supabase function");

    // Call the Supabase function to create checkout session
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-checkout",
      {
        body: {
          priceId: price_id,
          customerEmail: user.email || "",
            successUrl: `${request.nextUrl.origin}/dashboard`,
            cancelUrl: `${request.nextUrl.origin}/pricing`,
        },
      },
    );

    console.log("Supabase function response:", { data, error });

    if (error) {
      console.error("Error creating checkout session:", error);
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 },
      );
    }

    // Parse the data if it's a string
    let parsedData = data;
    if (typeof data === 'string') {
      console.log("Data is string, parsing...");
      parsedData = JSON.parse(data);
    }

    // Extract just the URL from the response
    const checkoutUrl = parsedData?.url;
    
    if (!checkoutUrl) {
      console.error("No URL in parsed response:", parsedData);
      return NextResponse.json(
        { error: "No checkout URL received" },
        { status: 500 },
      );
    }

    console.log("Returning URL:", checkoutUrl);
    return NextResponse.json({ url: checkoutUrl });

  } catch (error) {
    console.error("Error in create-checkout route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}