import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const supabase = await createClient();

  // Check if user is already authenticated
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If user is authenticated, redirect to dashboard
  if (user && !error) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Header - Logo and Tagline */}
      <div className="lg:hidden bg-white px-4 pt-8 pb-4 text-center">
        <div className="text-2xl font-bold text-black mb-2">HackerScope AI</div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight text-center">
          Build the next <span className="text-orange-600">big thing</span>
        </h1>
      </div>

      {/* Left Side - Welcome Section (Desktop Only) */}
      <div
        className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center p-4 lg:p-8 min-h-screen relative"
        style={{ backgroundColor: "#FEFDFB" }}
      >
        <div className="w-full max-w-md">
          <div className="flex flex-col space-y-8 text-center">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="text-3xl font-bold text-black">
                HackerScope AI
              </div>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Build the next{" "}
                <span className="text-orange-600">big thing</span>
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-start lg:items-center justify-center bg-white px-4 py-6 lg:px-8 lg:py-6">
        <div className="w-full max-w-md mt-6 lg:mt-0">{children}</div>
      </div>
    </div>
  );
}
