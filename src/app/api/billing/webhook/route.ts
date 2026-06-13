import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Service-role client: bypasses RLS so server-to-server webhook writes succeed.
function adminClient() {
  return createAdminClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

// Map a Stripe subscription onto our subscriptions table and upsert it.
async function upsertSubscription(subscription: Stripe.Subscription) {
  const supabase = adminClient();
  const item = subscription.items.data[0];
  const userId = subscription.metadata?.user_id || null;
  const email = subscription.metadata?.email || null;

  const row = {
    user_id: userId,
    stripe_id: subscription.id,
    customer_id:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id,
    price_id: item?.price?.id ?? null,
    stripe_price_id: item?.price?.id ?? null,
    status: subscription.status,
    amount: item?.price?.unit_amount ?? null,
    currency: item?.price?.currency ?? null,
    interval: item?.price?.recurring?.interval ?? null,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at,
    metadata: subscription.metadata ?? {},
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_id" });

  if (error) {
    console.error("Failed to upsert subscription:", error);
    return;
  }

  // Reflect the plan on the user record.
  if (userId) {
    const active = subscription.status === "active" || subscription.status === "trialing";
    await supabase
      .from("users")
      .update({ subscription_status: active ? "active" : "free" })
      .eq("user_id", userId);
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "No signature found" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook secret not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          // Carry checkout metadata onto the subscription if missing.
          if (!subscription.metadata?.user_id && session.metadata?.user_id) {
            subscription.metadata = {
              ...subscription.metadata,
              ...session.metadata,
            };
          }
          await upsertSubscription(subscription);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("Error handling webhook event:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
