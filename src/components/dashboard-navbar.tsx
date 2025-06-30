"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import ProfileModal from "./profile-modal";

interface DashboardNavbarProps {
  user?: User | null;
  isSubscribed?: boolean;
}

export default function DashboardNavbar({
  user: initialUser,
  isSubscribed: initialSubscription,
}: DashboardNavbarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [isSubscribed, setIsSubscribed] = useState(
    initialSubscription || false,
  );
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    if (!initialUser) {
      fetchUserData();
    }
    // Preload dashboard and library pages
    router.prefetch("/dashboard");
    router.prefetch("/library");
  }, [router]);

  const handleDashboardHover = () => {
    router.prefetch("/dashboard");
  };

  const handleLibraryHover = () => {
    router.prefetch("/library");
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;

      setUser(user);

      if (user) {
        // Check subscription status
        const { data: subscription, error: subError } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (!subError && subscription) {
          setIsSubscribed(true);
        }
      }
    } catch (err) {
      setError("Failed to load user data");
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  const handleUpgradeClick = async () => {
    if (!user) {
      router.push("/sign-in?redirect=dashboard");
      return;
    }
    
    console.log("Testing direct checkout...");
    
    try {
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_id: "price_1RfgF5CBtpFxI513jBPiqq2o",
        }),
      });
      
      const data = await response.json();
      console.log("Direct checkout response:", data);
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL:", data);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    }
  };

  const getUserInitials = (user: User | null) => {
    if (!user) return "U";

    const email = user.email || "";
    const name =
      user.user_metadata?.full_name || user.user_metadata?.name || "";

    if (name) {
      const nameParts = name.split(" ");
      return nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : nameParts[0][0].toUpperCase();
    }

    return email[0]?.toUpperCase() || "U";
  };

  const getUserName = (user: User | null) => {
    if (!user) return "User";

    const name = user.user_metadata?.full_name || user.user_metadata?.name;
    if (name) return name;

    const email = user.email || "";
    return email.split("@")[0] || "User";
  };

  if (error) {
    return (
      <nav className="w-full border-b border-red-200 bg-red-50 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            HackerScope AI
          </Link>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 md:py-6 sticky top-0 z-50">
      <div className="container-max flex justify-between items-center px-4 md:px-0">
        <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
          <Link
            href="/dashboard"
            className="text-base md:text-2xl font-semibold text-textColor-DEFAULT hover:text-terracotta-DEFAULT transition-colors duration-200"
          >
            HackerScope AI
          </Link>
        </div>

        <div className="flex gap-1 md:gap-6 items-center ml-4 md:ml-0">
          {loading ? (
            <div className="flex items-center gap-3">
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
            <>
              {pathname === "/library" ? (
                <Link
                  href="/dashboard"
                  onMouseEnter={handleDashboardHover}
                  className="text-sm md:text-base font-medium text-gray-600 hover:text-black transition-colors duration-200 hidden sm:block"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/library"
                  onMouseEnter={handleLibraryHover}
                  className="text-sm md:text-base font-medium text-gray-600 hover:text-black transition-colors duration-200 hidden sm:block"
                >
                  Library
                </Link>
              )}

              {/* Right side grouped elements */}
              <div className="flex items-center gap-1 md:gap-4">
                {/* User Profile with Dropdown */}
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="p-0 h-auto">
                        <Avatar className="h-7 w-7 md:h-8 md:w-8">
                          <AvatarFallback className="bg-[#FF6B35] text-white font-medium text-xs md:text-sm hover:bg-[#e55a2b] transition-colors">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {pathname === "/library" ? (
                        <DropdownMenuItem asChild>
                          <Link
                            href="/dashboard"
                            onMouseEnter={handleDashboardHover}
                          >
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem asChild>
                          <Link
                            href="/library"
                            onMouseEnter={handleLibraryHover}
                          >
                            Library
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsProfileModalOpen(true)}
                      >
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSignOut}>
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Upgrade Button for Free Users */}
                {!isSubscribed && (
                  <button
                    onClick={handleUpgradeClick}
                    className="text-white bg-black rounded-xl px-2 py-1.5 md:px-6 md:py-3 font-normal transition-none hover:bg-gray-800 text-xs md:text-sm whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Upgrade to Premium</span>
                    <span className="sm:hidden">Upgrade</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {user && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={user}
          isSubscribed={isSubscribed}
        />
      )}
    </nav>
  );
}