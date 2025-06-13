"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";

interface BrowserCompatibilityBannerProps {
  className?: string;
}

export default function BrowserCompatibilityBanner({
  className = "",
}: BrowserCompatibilityBannerProps = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isBrave, setIsBrave] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the banner
    const dismissed = localStorage.getItem("browser-compatibility-dismissed");
    if (dismissed) return;

    // Detect Brave browser
    const detectBrave = async () => {
      try {
        // Check for Brave-specific API
        if (
          (navigator as any).brave &&
          (await (navigator as any).brave.isBrave())
        ) {
          setIsBrave(true);
          setIsVisible(true);
        }
      } catch (error) {
        // Fallback detection methods
        const userAgent = navigator.userAgent;
        const isBraveUA =
          userAgent.includes("Brave") || userAgent.includes("brave");

        // Check for Brave-specific features
        const hasBraveFeatures =
          typeof (window as any).chrome !== "undefined" &&
          typeof (window as any).chrome.runtime === "undefined" &&
          userAgent.includes("Chrome");

        if (isBraveUA || hasBraveFeatures) {
          setIsBrave(true);
          setIsVisible(true);
        }
      }
    };

    detectBrave();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("browser-compatibility-dismissed", "true");
  };

  if (!isVisible || !isBrave) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 ${className}`}
    >
      <div className="container-max py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <span className="font-medium">Browser Compatibility Notice:</span>
              <span className="ml-1">
                For the best experience, we recommend using Chrome, Firefox, or
                Safari. Some features may not work properly in Brave due to its
                privacy settings.
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
