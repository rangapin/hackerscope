import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
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

    // Get user's subscription to find stripe_customer_id with proper authorization
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id) // Ensure user can only access their own subscription
      .single();

    if (subscriptionError || !subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing information found. Please contact support." },
        { status: 404 },
      );
    }

    // Create Stripe customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${request.nextUrl.origin}/profile`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 },
    );
  }
}
