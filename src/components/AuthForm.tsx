"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface AuthFormProps {
  initialMode?: "signin" | "signup";
}

export default function AuthForm({ initialMode = "signin" }: AuthFormProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    fullName?: string;
  }>({});

  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (mode === "signup" && !fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (mode === "signup" && password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        if (data.user) {
          toast({
            title: "Account created successfully!",
            description: "Please check your email for a verification link.",
            className: "bg-orange-100 border-orange-300 text-orange-800",
          });

          setEmail("");
          setPassword("");
          setFullName("");

          setTimeout(() => {
            setMode("signin");
          }, 2000);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Google auth error:", error);
        setError(error.message);
      }
    } catch (err) {
      console.error("Unexpected error during Google auth:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Toggle Buttons */}
      <div className="flex mb-6 lg:mb-8 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 py-2.5 lg:py-2 px-3 lg:px-4 text-sm font-medium rounded-md transition-all duration-200 ${
            mode === "signin"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 py-2.5 lg:py-2 px-3 lg:px-4 text-sm font-medium rounded-md transition-all duration-200 ${
            mode === "signup"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-gray-900">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-gray-600">
            {mode === "signin"
              ? "Sign in to your account to continue"
              : "Get started with your free account"}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3 lg:space-y-4">
          {mode === "signup" && (
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-sm font-medium text-gray-700"
              >
                Full Name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full ${validationErrors.fullName ? "border-red-500" : ""}`}
                disabled={isLoading}
              />
              {validationErrors.fullName && (
                <p className="text-sm text-red-600">
                  {validationErrors.fullName}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full ${validationErrors.email ? "border-red-500" : ""}`}
              disabled={isLoading}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              {mode === "signin" && (
                <Link
                  className="text-xs text-terracotta-DEFAULT hover:text-terracotta-600 hover:underline transition-all"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              )}
            </div>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full ${validationErrors.password ? "border-red-500" : ""}`}
              disabled={isLoading}
            />
            {validationErrors.password && (
              <p className="text-sm text-red-600">
                {validationErrors.password}
              </p>
            )}
          </div>

          {mode === "signin" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={isLoading}
                className="h-4 w-4 min-h-[16px] min-w-[16px] max-h-[16px] max-w-[16px] shrink-0"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
              >
                Remember me
              </Label>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-black text-white py-2.5 lg:py-2 text-sm lg:text-base hover:bg-gray-800 transition-colors duration-200"
          disabled={isLoading || isGoogleLoading}
        >
          {isLoading && (
            <div
              className="mr-2 w-4 h-4 bg-white rounded-full"
              style={{
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          )}
          {isLoading
            ? mode === "signin"
              ? "Signing in..."
              : "Creating account..."
            : mode === "signin"
              ? "Sign In"
              : "Create Account"}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full py-2.5 lg:py-2 text-sm lg:text-base border-gray-300 hover:bg-gray-50 transition-colors duration-200"
          onClick={handleGoogleAuth}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading && (
            <div
              className="mr-2 w-4 h-4 bg-current rounded-full"
              style={{
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          )}
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isGoogleLoading
            ? mode === "signin"
              ? "Signing in..."
              : "Signing up..."
            : mode === "signin"
              ? "Sign in with Google"
              : "Sign up with Google"}
        </Button>
      </form>

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
  );
}
