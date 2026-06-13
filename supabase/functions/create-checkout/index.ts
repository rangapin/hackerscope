import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { priceId, customerEmail, successUrl, cancelUrl } = await req.json();

    if (!priceId || !customerEmail) {
      return new Response(
        JSON.stringify({ error: "priceId and customerEmail are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const response = await fetch(
      "https://api.picaos.com/v1/passthrough/checkout/sessions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-pica-secret": Deno.env.get("PICA_SECRET_KEY")!,
          "x-pica-connection-key": Deno.env.get("PICA_STRIPE_CONNECTION_KEY")!,
          "x-pica-action-id":
            "conn_mod_def::GCmLNSLWawg::Pj6pgAmnQhuqMPzB8fquRg",
        },
        body: JSON.stringify({
          priceId,
          customerEmail,
          successUrl:
            successUrl ||
            "https://ecstatic-goldwasser9-pep8a.view-3.tempo-dev.app/dashboard",
          cancelUrl:
            cancelUrl ||
            "https://ecstatic-goldwasser9-pep8a.view-3.tempo-dev.app/dashboard",
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("PICA API Error:", errorText);
      return new Response(
        JSON.stringify({
          error: `Failed to create checkout session: ${response.statusText}`,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
