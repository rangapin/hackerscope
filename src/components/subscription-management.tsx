"use client";

import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import {
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface SubscriptionData {
  id: string;
  status: string;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean | null;
}

interface SubscriptionManagementProps {
  subscription: SubscriptionData | null;
}

export default function SubscriptionManagement({
  subscription,
}: SubscriptionManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
      // Refresh the page to show updated subscription status
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setIsBillingLoading(true);
    setError(null);
    setSuccess(null);

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
    } finally {
      setIsBillingLoading(false);
    }
  };

  if (!subscription) {
    return (
      <Card className="card-clean">
        <CardHeader>
          <CardTitle className="text-textColor-DEFAULT text-xl font-medium">
            Subscription Management
          </CardTitle>
          <CardDescription className="body-text text-muted-foreground mt-2">
            No active subscription found
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isActive = subscription.status === "active";
  const willCancel = subscription.cancel_at_period_end;
  const nextBillingDate = formatDate(subscription.current_period_end);

  return (
    <Card className="card-clean">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-textColor-DEFAULT text-xl font-medium">
          <CreditCard className="h-6 w-6 text-terracotta-DEFAULT" />
          Subscription Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Current Plan Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-base font-medium text-textColor-DEFAULT mb-1">
              Current Plan
            </p>
            <p className="body-text text-muted-foreground">Premium Plan</p>
          </div>
          <Badge
            className={`px-4 py-2 text-sm font-medium ${
              willCancel
                ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
                : "bg-terracotta-DEFAULT/20 text-terracotta-DEFAULT border-terracotta-DEFAULT/30"
            }`}
          >
            {willCancel ? "Canceling" : "Active"}
          </Badge>
        </div>

        {/* Billing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscription.amount && subscription.currency && (
            <div className="flex items-start gap-4">
              <div className="p-2 bg-terracotta-DEFAULT/10 rounded-xl">
                <DollarSign className="h-5 w-5 text-terracotta-DEFAULT" />
              </div>
              <div className="flex-1">
                <p className="text-base font-medium text-textColor-DEFAULT mb-1">
                  Billing Amount
                </p>
                <p className="body-text text-muted-foreground">
                  ${(subscription.amount / 100).toFixed(2)}{" "}
                  {subscription.currency.toUpperCase()}
                  {subscription.interval && (
                    <span className="text-muted-foreground">
                      {" "}
                      per {subscription.interval}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="p-2 bg-terracotta-DEFAULT/10 rounded-xl">
              <Calendar className="h-5 w-5 text-terracotta-DEFAULT" />
            </div>
            <div className="flex-1">
              <p className="text-base font-medium text-textColor-DEFAULT mb-1">
                {willCancel ? "Access Until" : "Next Billing Date"}
              </p>
              <p className="body-text text-muted-foreground">
                {nextBillingDate}
              </p>
            </div>
          </div>
        </div>

        {/* Cancellation Notice */}
        {willCancel && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-base font-medium text-yellow-700 mb-1">
              Subscription Canceling
            </p>
            <p className="body-text text-muted-foreground">
              Your subscription will end on {nextBillingDate}. You'll continue
              to have access to premium features until then.
            </p>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <p className="body-text text-green-700">{success}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="body-text text-red-700">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Manage Billing Button */}
            <Button
              onClick={handleManageBilling}
              className="bg-terracotta-DEFAULT text-white hover:opacity-80 px-4 py-2 text-sm font-medium flex-1 sm:flex-none"
              disabled={isBillingLoading}
            >
              {isBillingLoading ? "Opening Portal..." : "Manage Billing"}
            </Button>

            {/* Cancel Subscription Button */}
            {isActive && !willCancel && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    className="bg-orange-700 hover:bg-orange-800 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200 flex-1 sm:flex-none"
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Cancel Subscription"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-gray-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-textColor-DEFAULT text-xl font-medium">
                      Cancel Subscription
                    </AlertDialogTitle>
                    <AlertDialogDescription className="body-text text-muted-foreground mt-2">
                      Are you sure you want to cancel your subscription? You'll
                      continue to have access to premium features until the end
                      of your current billing period ({nextBillingDate}), but
                      you won't be charged again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex justify-center items-center mt-6">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mx-auto">
                      <AlertDialogCancel className="bg-white hover:bg-gray-50 text-orange-700 border-2 border-orange-700 hover:border-orange-800 font-medium py-3 px-6 rounded-md transition-colors duration-200 min-w-[140px]">
                        Keep Subscription
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
