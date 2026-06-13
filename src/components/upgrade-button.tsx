"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "../../supabase/client";
import { useState } from "react";

export function UpgradeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleUpgrade = async () => {
    setIsLoading(true);

    try {
      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        // Redirect to login if not authenticated
        window.location.href = "/sign-in?redirect=dashboard";
        return;
      }

      // Get available plans to find the premium plan
      console.log("UpgradeButton: Fetching plans...");
      const { data: plans, error: plansError } =
        await supabase.functions.invoke("supabase-functions-get-plans");

      console.log("UpgradeButton: Plans response:", { plans, plansError });

      if (plansError || !plans || plans.length === 0) {
        console.error("Error fetching plans:", plansError);
        alert(
          "Unable to load pricing plans. Please try again or contact support.",
        );
        return;
      }

      // Find the premium plan (assuming it's not the free one)
      const premiumPlan =
        plans.find((plan: any) => plan.amount > 0) || plans[0];

      console.log("UpgradeButton: Selected premium plan:", premiumPlan);

      if (!premiumPlan) {
        console.error("No premium plan found");
        alert("No premium plan available. Please contact support.");
        return;
      }

      // Create checkout session
      console.log(
        "UpgradeButton: Creating checkout session with price_id:",
        premiumPlan.id,
      );
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_id: premiumPlan.id,
        }),
      });

      const data = await response.json();
      console.log("UpgradeButton: Checkout API response:", {
        status: response.status,
        data,
      });

      if (!response.ok) {
        console.error("Checkout API error:", data.error);
        alert(
          `Failed to start checkout: ${data.error || "Unknown error"}. Please try again.`,
        );
        return;
      }

      // Ensure we have a checkout URL before redirecting
      if (data?.url) {
        console.log(
          "UpgradeButton: SUCCESS - Redirecting to Stripe checkout:",
          data.url,
        );
        // Use window.location.href for immediate redirect to Stripe
        window.location.href = data.url;
      } else {
        console.error("No checkout URL in response:", data);
        alert(
          "Failed to get checkout URL. Please try again or contact support.",
        );
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert(
        "An unexpected error occurred. Please try again or contact support.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="text-white bg-black rounded-xl px-6 py-3 font-normal transition-none disabled:opacity-50"
      onClick={handleUpgrade}
      disabled={isLoading}
    >
      {isLoading ? "Loading..." : "Upgrade to Premium"}
    </Button>
  );
}
