"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import { User } from "@supabase/supabase-js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  isSubscribed: boolean;
}

export default function ProfileModal({
  isOpen,
  onClose,
  user,
  isSubscribed,
}: ProfileModalProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [ideasCount, setIdeasCount] = useState(0);
  const [savedIdeasCount, setSavedIdeasCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (isOpen && user) {
      fetchProfileData();
    }
  }, [isOpen, user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Get subscription details
      const { data: subscriptionData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      setSubscription(subscriptionData);

      // Get user's generated ideas count
      const { count: generatedCount } = await supabase
        .from("generated_ideas")
        .select("*", { count: "exact", head: true })
        .eq("email", user.email || "");

      setIdeasCount(generatedCount || 0);

      // Get user's saved ideas count
      const { count: savedCount } = await supabase
        .from("saved_ideas")
        .select("*", { count: "exact", head: true })
        .eq("user_email", user.email || "");

      setSavedIdeasCount(savedCount || 0);
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      setSuccess(data.message);
      // Refresh subscription data
      setTimeout(() => {
        fetchProfileData();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/billing/manage-billing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      // Redirect to Stripe customer portal
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl md:max-w-5xl max-w-[95vw] w-full h-[95vh] md:h-auto bg-white md:max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-4 md:pb-6 border-b border-gray-100">
          <DialogTitle
            className="font-bold text-textColor-DEFAULT tracking-tight md:text-3xl"
            style={{ fontFamily: "Crimson Pro, serif", fontSize: "24px" }}
          >
            <span className="md:text-3xl" style={{ fontSize: "24px" }}>
              Account Settings
            </span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div
              className="w-4 h-4 bg-[#D4714B] rounded-full"
              style={{
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            <style jsx>{`
              @keyframes pulse {
                0%,
                100% {
                  transform: scale(0.8);
                  opacity: 0.6;
                }
                50% {
                  transform: scale(1.2);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6 overflow-y-auto flex-1">
            <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
              {/* Top Left: Account Information */}
              <Card className="card-clean flex flex-col h-auto md:h-64 border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 flex-shrink-0 border-b border-gray-50">
                  <CardTitle className="text-textColor-DEFAULT text-base md:text-base font-semibold tracking-tight">
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 md:pt-6 px-4 md:px-6 pb-4 md:pb-6 flex-grow flex flex-col justify-center">
                  <div className="space-y-3 md:space-y-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-1 md:space-y-0">
                      <span className="text-base md:text-sm font-medium text-muted-foreground">
                        Name
                      </span>
                      <span className="text-base md:text-sm text-textColor-DEFAULT md:text-right">
                        {user.user_metadata?.full_name ||
                          user.email?.split("@")[0] ||
                          "User"}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-1 md:space-y-0">
                      <span className="text-base md:text-sm font-medium text-muted-foreground">
                        Email
                      </span>
                      <span className="text-base md:text-sm text-textColor-DEFAULT md:text-right break-all">
                        {user.email}
                      </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-1 md:space-y-0">
                      <span className="text-base md:text-sm font-medium text-muted-foreground">
                        Member Since
                      </span>
                      <span className="text-base md:text-sm text-textColor-DEFAULT md:text-right">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Right: Usage Statistics */}
              <Card className="card-clean flex flex-col h-auto md:h-64 border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 flex-shrink-0 border-b border-gray-50">
                  <CardTitle className="text-textColor-DEFAULT text-base md:text-base font-semibold tracking-tight">
                    Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 md:pt-6 px-4 md:px-6 pb-4 md:pb-6 flex-grow flex items-center justify-center">
                  <div className="text-center w-full">
                    <div className="space-y-2 md:space-y-2 flex flex-col items-center">
                      <p className="text-base md:text-sm font-medium text-muted-foreground">
                        Ideas Generated
                      </p>
                      <p className="text-4xl md:text-3xl font-bold text-terracotta-DEFAULT">
                        {ideasCount}
                      </p>
                      <p className="text-sm md:text-xs text-muted-foreground">
                        Total created
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Left: Subscription Details */}
              <Card className="card-clean flex flex-col h-auto md:h-64 border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 flex-shrink-0 border-b border-gray-50">
                  <CardTitle className="text-textColor-DEFAULT text-base md:text-base font-semibold tracking-tight flex items-center space-x-2">
                    <span>Subscription Plan</span>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        subscription?.cancel_at_period_end
                          ? "bg-yellow-500"
                          : isSubscribed
                            ? "bg-terracotta-DEFAULT"
                            : "bg-gray-400"
                      }`}
                    />
                    <span className="text-sm font-normal text-muted-foreground">
                      {subscription?.cancel_at_period_end
                        ? "Canceling"
                        : isSubscribed
                          ? "Premium"
                          : "Free"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 md:pt-6 px-4 md:px-6 pb-4 md:pb-6 flex-grow flex flex-col justify-center">
                  <div className="space-y-3 md:space-y-4">
                    {subscription?.amount && subscription?.currency ? (
                      <>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-1 md:space-y-0">
                          <span className="text-base md:text-sm font-medium text-muted-foreground">
                            Plan Cost
                          </span>
                          <span className="text-base md:text-sm text-textColor-DEFAULT md:text-right">
                            ${(subscription.amount / 100).toFixed(2)}/
                            {subscription.interval}
                          </span>
                        </div>
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-1 md:space-y-0">
                          <span className="text-base md:text-sm font-medium text-muted-foreground">
                            {subscription?.cancel_at_period_end
                              ? "Ends On"
                              : "Next Billing"}
                          </span>
                          <span className="text-base md:text-sm text-textColor-DEFAULT">
                            {formatDate(subscription.current_period_end)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-base md:text-sm text-muted-foreground text-center">
                          1 idea generation
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Right: Account Actions */}
              <Card className="card-clean flex flex-col h-auto md:h-64 border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 md:pb-4 px-4 md:px-6 pt-4 md:pt-6 flex-shrink-0 border-b border-gray-50">
                  <CardTitle className="text-textColor-DEFAULT text-base md:text-base font-semibold tracking-tight">
                    Account Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 md:pt-6 px-4 md:px-6 pb-4 md:pb-6 flex-grow flex flex-col justify-start">
                  <div className="space-y-3 w-full mt-4 md:mt-12">
                    {isSubscribed && (
                      <>
                        {subscription && !subscription.cancel_at_period_end && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 md:py-3 px-4 text-base md:text-sm transition-colors duration-200 rounded-lg"
                                disabled={isLoading}
                              >
                                {isLoading
                                  ? "Processing..."
                                  : "Cancel Subscription"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-gray-200">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-textColor-DEFAULT text-xl font-medium">
                                  Cancel Subscription
                                </AlertDialogTitle>
                                <AlertDialogDescription className="body-text text-muted-foreground mt-2">
                                  Are you sure you want to cancel your
                                  subscription? You'll continue to have access
                                  until{" "}
                                  {formatDate(subscription?.current_period_end)}
                                  .
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex justify-center items-center mt-6">
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mx-auto">
                                  <AlertDialogCancel className="bg-white hover:bg-gray-50 text-orange-700 border-2 border-orange-700 hover:border-orange-800 font-medium py-3 px-6 rounded-md transition-colors duration-200 min-w-[140px]">
                                    Keep Plan
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleCancelSubscription}
                                    className="bg-orange-700 hover:bg-orange-800 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200 border-0 min-w-[140px]"
                                    disabled={isLoading}
                                  >
                                    {isLoading ? "Canceling..." : "Yes, Cancel"}
                                  </AlertDialogAction>
                                </div>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </>
                    )}
                    {!isSubscribed && (
                      <div className="flex items-center justify-center h-full">
                        <button
                          onClick={() => {
                            // Use the same upgrade logic as dashboard navbar
                            if (!user) return;

                            const handleUpgrade = async () => {
                              try {
                                // Get the first available plan (premium plan)
                                const { data: plans, error: plansError } =
                                  await supabase.functions.invoke(
                                    "supabase-functions-get-plans",
                                  );

                                if (
                                  plansError ||
                                  !plans ||
                                  plans.length === 0
                                ) {
                                  console.error(
                                    "Error fetching plans:",
                                    plansError,
                                  );
                                  window.location.href = "/pricing";
                                  return;
                                }

                                // Find the premium plan (assuming it's not the free one)
                                const premiumPlan =
                                  plans.find((plan: any) => plan.amount > 0) ||
                                  plans[0];

                                const response = await fetch(
                                  "/api/billing/create-checkout",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      price_id: premiumPlan.id,
                                    }),
                                  },
                                );

                                const data = await response.json();

                                if (!response.ok) {
                                  throw new Error(
                                    data.error ||
                                      "Failed to create checkout session",
                                  );
                                }

                                // Redirect to Stripe checkout
                                if (data?.url) {
                                  window.location.href = data.url;
                                } else {
                                  throw new Error("No checkout URL returned");
                                }
                              } catch (error) {
                                console.error(
                                  "Error creating checkout session:",
                                  error,
                                );
                                window.location.href = "/pricing";
                              }
                            };

                            handleUpgrade();
                          }}
                          className="text-white bg-black rounded-xl px-6 py-4 md:py-3 text-base md:text-sm font-normal transition-none hover:bg-gray-800"
                        >
                          Upgrade to Premium
                        </button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="p-4 md:p-4 bg-green-50 border-2 border-green-200 rounded-xl max-w-4xl mx-auto">
                <p className="text-green-800 text-center font-medium text-base md:text-sm">
                  {success}
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 md:p-4 bg-red-50 border-2 border-red-200 rounded-xl max-w-4xl mx-auto">
                <p className="text-red-800 text-center font-medium text-base md:text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-center items-center pt-4 md:pt-6 border-t border-gray-100 mt-auto">
              <Button
                onClick={onClose}
                className="bg-terracotta-DEFAULT text-white hover:bg-terracotta-DEFAULT/90 px-8 py-4 md:py-3 text-base md:text-sm font-semibold rounded-lg transition-colors duration-200 w-full md:w-auto"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
