"use client";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { createClient } from "../../supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

interface UserProfileProps {
  showDashboard?: boolean;
}

export default function UserProfile({
  showDashboard = false,
}: UserProfileProps) {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    fetchUser();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    // Immediately clear user state for instant UI update
    setUser(null);

    try {
      // Sign out from Supabase
      await supabase.auth.signOut();

      // Force redirect to home page
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, redirect to home
      router.push("/");
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="p-0 h-auto">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-[#FF6B35] text-white font-medium text-sm hover:bg-[#e55a2b] transition-colors">
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showDashboard && (
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            Dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Log Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
