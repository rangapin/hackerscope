import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { z } from "zod";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

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

    // Ensure the price_id is from our allowed list
    const allowedPriceIds =
      process.env.ALLOWED_STRIPE_PRICE_IDS?.split(",")
        .map((id) => id.trim())
        .filter(Boolean) || [];

    if (allowedPriceIds.length > 0 && !allowedPriceIds.includes(price_id)) {
      return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
    }

    // Create the Stripe Checkout session directly
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: price_id, quantity: 1 }],
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      metadata: { user_id: user.id, email: user.email || "" },
      subscription_data: {
        metadata: { user_id: user.id, email: user.email || "" },
      },
      success_url: `${request.nextUrl.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/dashboard?canceled=true`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "No checkout URL received" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error in create-checkout route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
