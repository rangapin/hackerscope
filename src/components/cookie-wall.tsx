"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CookieWall() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Check if user has already seen the cookie wall
    const cookieConsent = localStorage.getItem("cookieConsent");
    const cookieWallSeen = localStorage.getItem("cookieWallSeen");

    if (!cookieConsent && !cookieWallSeen) {
      // Show banner after a short delay
      setTimeout(() => {
        setIsVisible(true);
        setIsAnimating(true);
        // Mark that the cookie wall has been seen
        localStorage.setItem("cookieWallSeen", "true");
      }, 1000);
    }
  }, [isMounted]);

  const handleAcceptAll = () => {
    localStorage.setItem("cookieConsent", "accepted");
    handleClose();
  };

  const handleManage = () => {
    localStorage.setItem("cookieConsent", "managed");
    handleClose();
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isMounted || !isVisible) return null;

  return (
    <div className="cookie-wall-overlay">
      <div
        className={`cookie-wall ${isAnimating ? "cookie-wall-visible" : ""}`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-orange-500/20 transition-colors group"
          aria-label="Close cookie banner"
        >
          <X className="w-3 h-3 text-gray-400 group-hover:text-orange-500 transition-colors" />
        </button>

        {/* Content */}
        <div className="pr-6">
          <h3 className="text-white text-sm font-semibold mb-2">
            We use cookies
          </h3>

          <p className="text-gray-300 text-xs leading-relaxed mb-3">
            We use cookies to enhance your experience and analyze site usage. By
            continuing, you accept our cookie policy.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-2 mb-2">
            <Button
              onClick={handleAcceptAll}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 text-xs h-7 px-3"
            >
              Accept All
            </Button>

            <Button
              onClick={handleManage}
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-colors text-xs h-7 px-3"
            >
              Manage
            </Button>
          </div>

          {/* Privacy policy link */}
          <a
            href="/privacy"
            className="text-orange-500 hover:text-orange-400 text-xs underline transition-colors"
          >
            Learn more
          </a>
        </div>
      </div>
    </div>
  );
}
