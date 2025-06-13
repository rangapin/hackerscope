import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Webhook received without signature");
      return NextResponse.json(
        { error: "No signature found" },
        { status: 400 },
      );
    }

    const body = await request.text();

    // Validate webhook signature before processing
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe webhook secret not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 },
      );
    }

    // Forward the webhook to the Supabase function
    const supabase = await createClient();
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-payments-webhook",
      {
        body,
        headers: {
          "stripe-signature": signature,
          "content-type": "application/json",
        },
      },
    );

    if (error) {
      console.error("Error processing webhook:", error);
      return NextResponse.json(
        { error: "Failed to process webhook" },
        { status: 500 },
      );
    }

    return NextResponse.json(data || { received: true });
  } catch (error) {
    console.error("Error in webhook route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
