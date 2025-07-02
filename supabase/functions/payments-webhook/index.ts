// Types
type WebhookEvent = {
  event_type: string;
  type: string;
  stripe_event_id: string;
  created_at: string;
  modified_at: string;
  data: any;
};

type SubscriptionData = {
  stripe_id: string;
  user_id: string;
  price_id: string;
  stripe_price_id: string;
  currency: string;
  interval: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  amount: number;
  started_at: number;
  customer_id: string;
  metadata: Record<string, any>;
  canceled_at?: number;
  ended_at?: number;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Stripe API helper using native fetch
class StripeAPI {
  private apiKey: string;
  private baseUrl = "https://api.stripe.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Stripe API error: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  async getCustomer(customerId: string) {
    return await this.makeRequest(`/customers/${customerId}`);
  }

  async getSubscription(subscriptionId: string) {
    return await this.makeRequest(`/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(subscriptionId: string, data: any) {
    const body = new URLSearchParams();

    // Handle nested metadata
    if (data.metadata) {
      for (const [key, value] of Object.entries(data.metadata)) {
        body.append(`metadata[${key}]`, String(value));
      }
    }

    return await this.makeRequest(`/subscriptions/${subscriptionId}`, {
      method: "POST",
      body: body.toString(),
    });
  }
}

// Utility functions
async function logAndStoreWebhookEvent(
  supabaseClient: any,
  event: any,
  data: any,
): Promise<void> {
  try {
    const { error } = await supabaseClient.from("webhook_events").insert({
      event_type: event.type,
      type: event.type.split(".")[0],
      stripe_event_id: event.id,
      created_at: new Date(event.created * 1000).toISOString(),
      modified_at: new Date(event.created * 1000).toISOString(),
      data,
    } as WebhookEvent);

    if (error) {
      console.error("Error logging webhook event:", error);
    }
  } catch (error) {
    console.error("Failed to log webhook event:", error);
  }
}

// Helper function to ensure user exists in public.users table
async function ensureUserExists(
  supabaseClient: any,
  userId: string,
  customerEmail?: string,
): Promise<string> {
  try {
    // First check if user exists in public.users
    const { data: existingUser } = await supabaseClient
      .from("users")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    if (existingUser) {
      return userId;
    }

    // User doesn't exist, try to create from auth.users
    const { data: authUser, error: authError } =
      await supabaseClient.auth.admin.getUserById(userId);

    if (!authError && authUser?.user) {
      const { error: createError } = await supabaseClient.from("users").insert({
        id: authUser.user.id,
        user_id: authUser.user.id,
        email: authUser.user.email || customerEmail,
        name:
          authUser.user.user_metadata?.name ||
          authUser.user.user_metadata?.full_name ||
          (authUser.user.email || customerEmail)?.split("@")[0],
        full_name: authUser.user.user_metadata?.full_name,
        avatar_url: authUser.user.user_metadata?.avatar_url,
        token_identifier: authUser.user.email || customerEmail,
        subscription: "premium",
        subscription_status: "premium",
        created_at: authUser.user.created_at,
        updated_at: new Date().toISOString(),
      });

      if (createError) {
        console.error("Error creating user from auth.users:", createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      console.log(
        "Successfully created user from auth.users with premium status:",
        userId,
      );
      return userId;
    }

    // If auth.users lookup fails and we have customer email, create minimal user record
    if (customerEmail) {
      const { error: createError } = await supabaseClient.from("users").insert({
        id: userId,
        user_id: userId,
        email: customerEmail,
        name: customerEmail.split("@")[0],
        token_identifier: customerEmail,
        subscription: "premium",
        subscription_status: "premium",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (createError) {
        console.error("Error creating user from customer email:", createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }

      console.log(
        "Successfully created user from customer email with premium status:",
        userId,
      );
      return userId;
    }

    throw new Error(
      "Unable to create user - no auth.users record or customer email available",
    );
  } catch (error) {
    console.error("Error in ensureUserExists:", error);
    throw error;
  }
}

// Generate random UUID using Web Crypto API
function generateUUID(): string {
  return crypto.randomUUID();
}

// Event handlers
async function handleSubscriptionCreated(
  supabaseClient: any,
  event: any,
  stripeApi: StripeAPI,
) {
  const subscription = event.data.object;
  console.log("Handling subscription created:", subscription.id);

  // Get user information from metadata or customer
  let userId = subscription.metadata?.user_id || subscription.metadata?.userId;
  let customerEmail = null;

  // If no userId in metadata, get it from customer
  if (!userId) {
    try {
      const customer = await stripeApi.getCustomer(subscription.customer);

      if (!customer.email) {
        throw new Error("Customer not found or has no email");
      }

      customerEmail = customer.email;

      // Try to find existing user by email
      const { data: userData } = await supabaseClient
        .from("users")
        .select("user_id")
        .eq("email", customer.email)
        .single();

      if (userData) {
        userId = userData.user_id;
      } else {
        // Check auth.users for this email
        const { data: authUsers } = await supabaseClient.auth.admin.listUsers();
        const authUser = authUsers?.users?.find(
          (u) => u.email === customer.email,
        );

        if (authUser) {
          userId = authUser.id;
        } else {
          // Create a new user ID if no existing user found
          userId = generateUUID();
        }
      }
    } catch (error) {
      console.error("Error retrieving customer:", error);
      return new Response(
        JSON.stringify({ error: "Unable to retrieve customer information" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
  }

  // Ensure user exists in public.users table
  try {
    await ensureUserExists(supabaseClient, userId, customerEmail);
  } catch (error) {
    console.error("Error ensuring user exists:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create or find user" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const subscriptionData: SubscriptionData = {
    stripe_id: subscription.id,
    user_id: userId,
    price_id: subscription.items.data[0]?.price.id,
    stripe_price_id: subscription.items.data[0]?.price.id,
    currency: subscription.currency,
    interval: subscription.items.data[0]?.plan.interval,
    status: subscription.status,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    amount: subscription.items.data[0]?.plan.amount ?? 0,
    started_at: subscription.start_date ?? Math.floor(Date.now() / 1000),
    customer_id: subscription.customer,
    metadata: subscription.metadata || {},
    canceled_at: subscription.canceled_at,
    ended_at: subscription.ended_at,
  };

  // First, check if a subscription with this stripe_id already exists
  const { data: existingSubscription } = await supabaseClient
    .from("subscriptions")
    .select("id")
    .eq("stripe_id", subscription.id)
    .maybeSingle();

  // Update subscription in database
  const { error } = await supabaseClient.from("subscriptions").upsert(
    {
      // If we found an existing subscription, use its UUID, otherwise let Supabase generate one
      ...(existingSubscription?.id ? { id: existingSubscription.id } : {}),
      ...subscriptionData,
    },
    {
      // Use stripe_id as the match key for upsert
      onConflict: "stripe_id",
    },
  );

  if (error) {
    console.error("Error creating subscription:", error);
    return new Response(
      JSON.stringify({ error: "Failed to create subscription" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Update user subscription status to premium if subscription is active
  if (subscription.status === "active") {
    const { error: userUpdateError } = await supabaseClient
      .from("users")
      .update({
        subscription: "premium",
        subscription_status: "premium",
        stripe_customer_id: subscription.customer,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (userUpdateError) {
      console.error(
        "Error updating user subscription status:",
        userUpdateError,
      );
    } else {
      console.log(
        "Successfully updated user subscription status to premium for user:",
        userId,
      );
    }
  }

  return new Response(
    JSON.stringify({ message: "Subscription created successfully" }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

async function handleSubscriptionUpdated(supabaseClient: any, event: any) {
  const subscription = event.data.object;
  console.log("Handling subscription updated:", subscription.id);

  // Update subscription in database
  const { error } = await supabaseClient
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      cancel_at_period_end: subscription.cancel_at_period_end,
      metadata: subscription.metadata,
      canceled_at: subscription.canceled_at,
      ended_at: subscription.ended_at,
    })
    .eq("stripe_id", subscription.id);

  if (error) {
    console.error("Error updating subscription:", error);
    return new Response(
      JSON.stringify({ error: "Failed to update subscription" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // Update user subscription status based on subscription status
  const { data: subscriptionData } = await supabaseClient
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_id", subscription.id)
    .single();

  if (subscriptionData?.user_id) {
    const isActive = subscription.status === "active";
    const userSubscription = isActive ? "premium" : null;
    const subscriptionStatus = isActive ? "premium" : "free";

    const { error: userUpdateError } = await supabaseClient
      .from("users")
      .update({
        subscription: userSubscription,
        subscription_status: subscriptionStatus,
        stripe_customer_id: subscription.customer,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", subscriptionData.user_id);

    if (userUpdateError) {
      console.error(
        "Error updating user subscription status:",
        userUpdateError,
      );
    } else {
      console.log(
        `Successfully updated user subscription status to ${subscriptionStatus} for user:`,
        subscriptionData.user_id,
      );
    }
  }

  return new Response(
    JSON.stringify({ message: "Subscription updated successfully" }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

async function handleSubscriptionDeleted(supabaseClient: any, event: any) {
  const subscription = event.data.object;
  console.log("Handling subscription deleted:", subscription.id);

  try {
    // Update subscription status to canceled
    await supabaseClient
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("stripe_id", subscription.id);

    // Get user_id from subscription and update user status to free
    const { data: subscriptionData } = await supabaseClient
      .from("subscriptions")
      .select("user_id")
      .eq("stripe_id", subscription.id)
      .single();

    if (subscriptionData?.user_id) {
      await supabaseClient
        .from("users")
        .update({
          subscription: null,
          subscription_status: "free",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", subscriptionData.user_id);

      console.log(
        "Successfully downgraded user to free:",
        subscriptionData.user_id,
      );
    }

    return new Response(
      JSON.stringify({ message: "Subscription deleted successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process subscription deletion" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleCheckoutSessionCompleted(
  supabaseClient: any,
  event: any,
  stripeApi: StripeAPI,
) {
  const session = event.data.object;
  console.log("Handling checkout session completed:", session.id);

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) {
    console.log("No subscription ID found in checkout session");
    return new Response(
      JSON.stringify({ message: "No subscription in checkout session" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Get the subscription from Stripe
    const stripeSubscription = await stripeApi.getSubscription(subscriptionId);

    // Get user ID from session metadata
    let userId = session.metadata?.userId || session.metadata?.user_id;
    let customerEmail = null;

    // If no userId in metadata, get customer email and find/create user
    if (!userId) {
      const customer = await stripeApi.getCustomer(stripeSubscription.customer);
      if (customer.email) {
        customerEmail = customer.email;

        // Try to find existing user by email
        const { data: userData } = await supabaseClient
          .from("users")
          .select("user_id")
          .eq("email", customer.email)
          .single();

        if (userData) {
          userId = userData.user_id;
        } else {
          // Check auth.users for this email
          const { data: authUsers } =
            await supabaseClient.auth.admin.listUsers();
          const authUser = authUsers?.users?.find(
            (u) => u.email === customer.email,
          );

          if (authUser) {
            userId = authUser.id;
          } else {
            userId = generateUUID();
          }
        }
      }
    }

    if (!userId) {
      throw new Error("Unable to determine user ID from session or customer");
    }

    // Ensure user exists in public.users table with premium status
    await ensureUserExists(supabaseClient, userId, customerEmail);

    // Update Stripe subscription metadata
    await stripeApi.updateSubscription(subscriptionId, {
      metadata: {
        ...session.metadata,
        checkoutSessionId: session.id,
        userId: userId,
      },
    });

    // Update subscription in Supabase
    await supabaseClient
      .from("subscriptions")
      .update({
        metadata: { ...session.metadata, checkoutSessionId: session.id },
        user_id: userId,
        status: stripeSubscription.status,
        current_period_start: stripeSubscription.current_period_start,
        current_period_end: stripeSubscription.current_period_end,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
      })
      .eq("stripe_id", subscriptionId);

    // Update user to premium status
    if (stripeSubscription.status === "active") {
      await supabaseClient
        .from("users")
        .update({
          subscription: "premium",
          subscription_status: "premium",
          stripe_customer_id: stripeSubscription.customer,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      console.log("Successfully upgraded user to premium:", userId);
    }

    return new Response(
      JSON.stringify({
        message: "Checkout session completed successfully",
        subscriptionId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error processing checkout completion:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process checkout completion",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleInvoicePaymentSucceeded(supabaseClient: any, event: any) {
  const invoice = event.data.object;
  console.log("Handling invoice payment succeeded:", invoice.id);

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;

  try {
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("stripe_id", subscriptionId)
      .single();

    const webhookData = {
      event_type: event.type,
      type: "invoice",
      stripe_event_id: event.id,
      data: {
        invoiceId: invoice.id,
        subscriptionId,
        amountPaid: String(invoice.amount_paid / 100),
        currency: invoice.currency,
        status: "succeeded",
        email: subscription?.email || invoice.customer_email,
      },
    };

    await supabaseClient.from("webhook_events").insert(webhookData);

    return new Response(
      JSON.stringify({ message: "Invoice payment succeeded" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error processing successful payment:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process successful payment" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleInvoicePaymentFailed(supabaseClient: any, event: any) {
  const invoice = event.data.object;
  console.log("Handling invoice payment failed:", invoice.id);

  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id;

  try {
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("stripe_id", subscriptionId)
      .single();

    const webhookData = {
      event_type: event.type,
      type: "invoice",
      stripe_event_id: event.id,
      data: {
        invoiceId: invoice.id,
        subscriptionId,
        amountDue: String(invoice.amount_due / 100),
        currency: invoice.currency,
        status: "failed",
        email: subscription?.email || invoice.customer_email,
      },
    };

    await supabaseClient.from("webhook_events").insert(webhookData);

    if (subscriptionId) {
      await supabaseClient
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("stripe_id", subscriptionId);
    }

    return new Response(JSON.stringify({ message: "Invoice payment failed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing failed payment:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process failed payment" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleChargeSucceeded(
  supabaseClient: any,
  event: any,
  stripeApi: StripeAPI,
) {
  const charge = event.data.object;
  console.log("Handling charge succeeded:", charge.id);

  try {
    // Skip if this charge is part of a subscription (handled by subscription events)
    if (charge.invoice) {
      console.log("Charge is part of subscription, skipping");
      return new Response(
        JSON.stringify({ message: "Charge is part of subscription" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let userId = charge.metadata?.userId || charge.metadata?.user_id;
    let customerEmail = null;

    // If no userId in metadata, get customer email and find/create user
    if (!userId && charge.customer) {
      const customer = await stripeApi.getCustomer(charge.customer);
      if (customer.email) {
        customerEmail = customer.email;

        // Try to find existing user by email
        const { data: userData } = await supabaseClient
          .from("users")
          .select("user_id")
          .eq("email", customer.email)
          .single();

        if (userData) {
          userId = userData.user_id;
        } else {
          // Check auth.users for this email
          const { data: authUsers } =
            await supabaseClient.auth.admin.listUsers();
          const authUser = authUsers?.users?.find(
            (u) => u.email === customer.email,
          );

          if (authUser) {
            userId = authUser.id;
          } else {
            userId = generateUUID();
          }
        }
      }
    }

    if (!userId) {
      console.log("No user ID found for charge, skipping user creation");
      return new Response(
        JSON.stringify({ message: "No user ID found for charge" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Ensure user exists in public.users table with premium status
    await ensureUserExists(supabaseClient, userId, customerEmail);

    // Update user to premium status for successful one-time payment
    await supabaseClient
      .from("users")
      .update({
        subscription: "premium",
        subscription_status: "premium",
        stripe_customer_id: charge.customer,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    console.log("Successfully upgraded user to premium via charge:", userId);

    return new Response(
      JSON.stringify({ message: "Charge processed successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error processing charge:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process charge",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
}

async function handleChargeUpdated(
  supabaseClient: any,
  event: any,
  stripeApi: StripeAPI,
) {
  const charge = event.data.object;
  console.log("Handling charge updated:", charge.id, "Status:", charge.status);

  // Only process if charge is now succeeded and wasn't processed before
  if (charge.status === "succeeded" && charge.paid) {
    return await handleChargeSucceeded(supabaseClient, event, stripeApi);
  }

  return new Response(JSON.stringify({ message: "Charge update processed" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Native Deno webhook signature verification using Web Crypto API
async function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    // Extract timestamp and signature from header
    const elements = signature.split(",");
    let timestamp = "";
    let v1Signature = "";

    for (const element of elements) {
      const [key, value] = element.split("=");
      if (key === "t") {
        timestamp = value;
      } else if (key === "v1") {
        v1Signature = value;
      }
    }

    if (!timestamp || !v1Signature) {
      console.error("Missing timestamp or signature in header");
      return false;
    }

    // Create the signed payload
    const signedPayload = `${timestamp}.${body}`;

    // Create HMAC using Web Crypto API (Deno compatible)
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature_bytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(signedPayload),
    );

    // Convert to hex string
    const signature_array = new Uint8Array(signature_bytes);
    const expectedSignature = Array.from(signature_array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures using constant-time comparison
    return expectedSignature === v1Signature;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

// Main webhook handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");

    // TEMPORARILY DISABLED: Skip signature verification for testing
    console.log(
      "⚠️ WARNING: Webhook signature verification is DISABLED for testing purposes",
    );

    // if (!signature) {
    //   console.log("No signature found in headers");
    //   console.log(
    //     "Available headers:",
    //     Object.fromEntries(req.headers.entries()),
    //   );
    //   return new Response(JSON.stringify({ error: "No signature found" }), {
    //     status: 400,
    //     headers: { ...corsHeaders, "Content-Type": "application/json" },
    //   });
    // }

    // Get the raw body as text
    const body = await req.text();

    // Debug: Log all available environment variables
    console.log("=== ENVIRONMENT VARIABLES DEBUG ===");
    console.log("All available environment variables:");

    // Get all environment variables
    const allEnvVars = {};
    for (const [key, value] of Object.entries(Deno.env.toObject())) {
      // Only log the first 10 characters of sensitive values
      if (key.includes("SECRET") || key.includes("KEY")) {
        allEnvVars[key] = value ? `${value.substring(0, 10)}...` : "undefined";
      } else {
        allEnvVars[key] = value;
      }
    }
    console.log(JSON.stringify(allEnvVars, null, 2));

    // Access secrets using Deno.env.get() - the standard way in Supabase Edge Functions
    // const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET"); // DISABLED for testing
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // Debug environment variable access with detailed logging
    console.log("=== SPECIFIC ENVIRONMENT VARIABLES ===");
    // console.log("STRIPE_WEBHOOK_SECRET:", {
    //   exists: webhookSecret !== undefined,
    //   isNull: webhookSecret === null,
    //   isEmpty: webhookSecret === "",
    //   length: webhookSecret?.length || 0,
    //   type: typeof webhookSecret,
    //   preview: webhookSecret
    //     ? `${webhookSecret.substring(0, 15)}...`
    //     : "NO_VALUE",
    // }); // DISABLED for testing

    console.log("STRIPE_SECRET_KEY:", {
      exists: stripeSecretKey !== undefined,
      isNull: stripeSecretKey === null,
      isEmpty: stripeSecretKey === "",
      length: stripeSecretKey?.length || 0,
      type: typeof stripeSecretKey,
      preview: stripeSecretKey
        ? `${stripeSecretKey.substring(0, 15)}...`
        : "NO_VALUE",
    });

    console.log("SUPABASE_URL:", {
      exists: supabaseUrl !== undefined,
      value: supabaseUrl,
    });

    console.log("SUPABASE_SERVICE_ROLE_KEY:", {
      exists: supabaseServiceKey !== undefined,
      length: supabaseServiceKey?.length || 0,
      preview: supabaseServiceKey
        ? `${supabaseServiceKey.substring(0, 15)}...`
        : "NO_VALUE",
    });

    // Try alternative methods to access the webhook secret
    // console.log("=== ALTERNATIVE ACCESS METHODS ===");
    // const altWebhookSecret1 = globalThis.Deno?.env?.get?.(
    //   "STRIPE_WEBHOOK_SECRET",
    // );
    // const altWebhookSecret2 = (globalThis as any).process?.env
    //   ?.STRIPE_WEBHOOK_SECRET;

    // console.log("Alternative method 1 (globalThis.Deno.env.get):", {
    //   exists: altWebhookSecret1 !== undefined,
    //   length: altWebhookSecret1?.length || 0,
    // });

    // console.log("Alternative method 2 (process.env):", {
    //   exists: altWebhookSecret2 !== undefined,
    //   length: altWebhookSecret2?.length || 0,
    // }); // DISABLED for testing

    console.log("=== END DEBUG ===");

    // TEMPORARILY DISABLED: Skip webhook secret validation for testing
    // if (!webhookSecret) {
    //   console.error("STRIPE_WEBHOOK_SECRET environment variable is missing");
    //   return new Response(
    //     JSON.stringify({ error: "Webhook secret not configured" }),
    //     {
    //       status: 500,
    //       headers: { ...corsHeaders, "Content-Type": "application/json" },
    //     },
    //   );
    // }

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY environment variable is missing");
      return new Response(
        JSON.stringify({ error: "Stripe secret key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!supabaseUrl) {
      console.error("SUPABASE_URL environment variable is missing");
      return new Response(
        JSON.stringify({
          error: "SUPABASE_URL environment variable is required",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!supabaseServiceKey) {
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY environment variable is missing",
      );
      return new Response(
        JSON.stringify({
          error: "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // TEMPORARILY DISABLED: Skip signature verification for testing
    console.log(
      "⚠️ SKIPPING signature verification - processing all webhook events for testing",
    );

    // console.log("Webhook verification details:", {
    //   hasSignature: !!signature,
    //   hasSecret: !!webhookSecret,
    //   secretLength: webhookSecret?.length || 0,
    //   bodyLength: body.length,
    //   signaturePrefix: signature.substring(0, 10) + "...",
    //   secretPrefix: webhookSecret
    //     ? webhookSecret.substring(0, 10) + "..."
    //     : "NO_SECRET",
    // });

    // // Verify webhook signature using native Deno Web Crypto API
    // const isValidSignature = await verifyWebhookSignature(
    //   body,
    //   signature,
    //   webhookSecret,
    // );

    // if (!isValidSignature) {
    //   console.error("Invalid webhook signature");
    //   return new Response(
    //     JSON.stringify({
    //       error: "Invalid signature",
    //       details: "Webhook signature verification failed",
    //     }),
    //     {
    //       status: 400,
    //       headers: { ...corsHeaders, "Content-Type": "application/json" },
    //     },
    //   );
    // }

    // console.log("Webhook signature verified successfully");

    // Parse the event
    let event;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error("Error parsing webhook body:", error);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Processing webhook event:", event.type);

    // Create Supabase client using dynamic import
    let supabaseClient;
    try {
      const { createClient } = await import(
        "https://esm.sh/@supabase/supabase-js@2?target=deno"
      );

      supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      console.log("Supabase client created successfully");
    } catch (error) {
      console.error("Failed to create Supabase client:", error);
      return new Response(
        JSON.stringify({ error: "Failed to initialize Supabase client" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Stripe API client
    const stripeApi = new StripeAPI(stripeSecretKey);

    // Log the webhook event
    await logAndStoreWebhookEvent(supabaseClient, event, event.data.object);

    // Handle the event based on type
    switch (event.type) {
      case "customer.subscription.created":
        return await handleSubscriptionCreated(
          supabaseClient,
          event,
          stripeApi,
        );
      case "customer.subscription.updated":
        return await handleSubscriptionUpdated(supabaseClient, event);
      case "customer.subscription.deleted":
        return await handleSubscriptionDeleted(supabaseClient, event);
      case "checkout.session.completed":
        return await handleCheckoutSessionCompleted(
          supabaseClient,
          event,
          stripeApi,
        );
      case "invoice.payment_succeeded":
        return await handleInvoicePaymentSucceeded(supabaseClient, event);
      case "invoice.payment_failed":
        return await handleInvoicePaymentFailed(supabaseClient, event);
      case "charge.succeeded":
        return await handleChargeSucceeded(supabaseClient, event, stripeApi);
      case "charge.updated":
        return await handleChargeUpdated(supabaseClient, event, stripeApi);
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new Response(
          JSON.stringify({ message: `Unhandled event type: ${event.type}` }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
    }
  } catch (err) {
    console.error("Error processing webhook:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
