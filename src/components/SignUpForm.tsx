"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface SignUpFormProps {
  className?: string;
}

export default function SignUpForm({ className = "" }: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
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

    if (!fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect_to=/dashboard`,
        },
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        // Show success toast
        toast({
          title: "Account created successfully!",
          description: "Please check your email for a verification link.",
        });

        // Clear form
        setEmail("");
        setPassword("");
        setFullName("");

        // Redirect to sign-in page after a short delay
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      }
    } catch (err) {
      console.error("Unexpected error during sign up:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect_to=/dashboard`,
        },
      });

      if (error) {
        console.error("Google sign up error:", error);
        setError(error.message);
      }
    } catch (err) {
      console.error("Unexpected error during Google sign up:", err);
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
    <div
      className={`w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm ${className}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Sign up</h1>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              className="text-primary font-medium hover:underline transition-all"
              href="/sign-in"
            >
              Sign in
            </Link>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
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
              <p className="text-sm text-destructive">
                {validationErrors.fullName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
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
              <p className="text-sm text-destructive">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
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
              <p className="text-sm text-destructive">
                {validationErrors.password}
              </p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full hover:bg-gray-800 transition-colors"
          disabled={isLoading || isGoogleLoading}
        >
          Get Started
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={isLoading || isGoogleLoading}
        >
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
          Get Started with Google
        </Button>
      </form>
    </div>
  );
}
