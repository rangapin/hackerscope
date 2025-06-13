"use client";

import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

export function SuccessToast() {
  const { toast } = useToast();

  useEffect(() => {
    // Show success toast after a brief delay to ensure the page has loaded
    const timer = setTimeout(() => {
      toast({
        title: "Payment Successful!",
        description:
          "Welcome to HackerScope AI Premium! You now have unlimited access to AI-powered startup ideas.",
        duration: 5000,
        className: "bg-orange-100 border-orange-300 text-orange-900",
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [toast]);

  return null;
}
