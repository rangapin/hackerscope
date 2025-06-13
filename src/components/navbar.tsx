"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import UserProfile from "./user-profile";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // Preload authentication pages for instant navigation
    router.prefetch("/sign-in");
    router.prefetch("/sign-up");
    router.prefetch("/dashboard");
  }, [router]);

  const handleSignInHover = () => {
    router.prefetch("/sign-in");
  };

  const handleGetStartedHover = () => {
    router.prefetch("/sign-up");
  };

  const handleDashboardHover = () => {
    router.prefetch("/dashboard");
  };

  const handleLibraryHover = () => {
    router.prefetch("/library");
  };

  return (
    <nav className="w-full border-b border-borderColor-DEFAULT bg-white py-6 sticky top-0 z-50">
      <div className="container-max flex justify-between items-center">
        <Link
          href="/"
          prefetch
          className="text-lg font-semibold text-textColor-DEFAULT hover:text-terracotta-DEFAULT sm:text-2xl"
        >
          HackerScope AI
        </Link>
        <div className="flex gap-12 items-center sm:gap-6 md:gap-12">
          {user ? (
            <>
              {/* Desktop Navigation */}
              <div className="hidden sm:flex items-center gap-6 md:gap-6">
                <Link
                  href="/dashboard"
                  onMouseEnter={handleDashboardHover}
                  className="text-base font-normal text-black hover:text-terracotta-DEFAULT md:text-base"
                >
                  Dashboard
                </Link>
                <Link
                  href="/library"
                  onMouseEnter={handleLibraryHover}
                  className="text-base font-normal text-black hover:text-terracotta-DEFAULT md:text-base"
                >
                  Library
                </Link>
                <UserProfile showDashboard={false} />
              </div>

              {/* Mobile Navigation - Only show UserProfile when logged in */}
              <div className="sm:hidden flex items-center gap-2">
                <UserProfile showDashboard={true} />
              </div>
            </>
          ) : (
            <>
              {/* Desktop Navigation for non-logged in users */}
              <div className="hidden sm:flex flex-row gap-2 sm:gap-3 md:gap-6 items-center">
                <Link
                  href="/sign-in"
                  onMouseEnter={handleSignInHover}
                  className="text-sm font-normal text-black sm:text-base whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onMouseEnter={handleGetStartedHover}
                  className="text-white bg-black rounded-xl px-2 py-1.5 font-normal text-sm sm:px-6 sm:py-3 sm:text-base whitespace-nowrap hover:bg-gray-800 transition-colors duration-200"
                >
                  Get Started
                </Link>
              </div>

              {/* Mobile Navigation for non-logged in users */}
              <div className="sm:hidden flex items-center gap-3">
                <Link
                  href="/sign-in"
                  onMouseEnter={handleSignInHover}
                  className="text-sm font-normal text-black whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onMouseEnter={handleGetStartedHover}
                  className="text-white bg-black rounded-xl px-3 py-2 font-normal text-sm whitespace-nowrap hover:bg-gray-800 transition-colors duration-200"
                >
                  Get Started
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
