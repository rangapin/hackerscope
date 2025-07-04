"use server";

import { encodedRedirect, sanitizeHtml } from "@/utils/utils";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

// Input validation schemas
const emailSchema = z.string().email().min(1).max(254);
const passwordSchema = z.string().min(6).max(128);

// Rate limiting for sensitive operations
const forgotPasswordLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

const emailSubmissionLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100,
});

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const callbackUrl = formData.get("callbackUrl")?.toString();

  // Input validation
  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  try {
    // Validate email format
    emailSchema.parse(email);
  } catch (error) {
    return encodedRedirect("error", "/forgot-password", "Invalid email format");
  }

  // Rate limiting
  try {
    await forgotPasswordLimiter.check(10, email); // 10 requests per minute per email
  } catch {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Too many requests. Please try again later.",
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {});

  if (error) {
    // Don't reveal whether email exists or not
    console.error("Password reset error:", error);
  }

  // Always return success to prevent email enumeration
  return encodedRedirect(
    "success",
    "/forgot-password",
    "If an account with that email exists, you will receive a password reset link.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  // Authentication check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return encodedRedirect("error", "/sign-in", "Authentication required");
  }

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password and confirm password are required",
    );
  }

  // Validate password strength
  try {
    passwordSchema.parse(password);
  } catch (error) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password must be at least 6 characters long",
    );
  }

  if (password !== confirmPassword) {
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Password update error:", error);
    return encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  return encodedRedirect(
    "success",
    "/dashboard",
    "Password updated successfully",
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/");
};

export const checkUserSubscription = async (userId: string) => {
  const supabase = await createClient();

  // Authentication check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.id !== userId) {
    console.error("Unauthorized subscription check attempt");
    return false;
  }

  // First check the user's subscription_status field
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("subscription_status, subscription")
    .eq("user_id", userId)
    .single();

  if (!userError && userData) {
    if (
      userData.subscription_status === "premium" ||
      userData.subscription === "premium"
    ) {
      return true;
    }
  }

  // Fallback to checking subscriptions table
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (error) {
    return false;
  }

  return !!subscription;
};

export const submitEmailAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const source = formData.get("source")?.toString() || "landing_page";

  if (!email) {
    return { error: "Email is required" };
  }

  // Validate email format with zod
  try {
    emailSchema.parse(email);
  } catch (error) {
    return { error: "Please enter a valid email address" };
  }

  // Sanitize source input
  const sanitizedSource = sanitizeHtml(source).substring(0, 50);

  // Rate limiting
  try {
    await emailSubmissionLimiter.check(5, email); // 5 submissions per minute per email
  } catch {
    return { error: "Too many submissions. Please try again later." };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.from("email_leads").insert({
      email: email,
      source: sanitizedSource,
    });

    if (error) {
      // Check if it's a duplicate email error
      if (error.code === "23505") {
        return { error: "This email is already on our waitlist!" };
      }
      console.error("Email submission error:", error);
      return { error: "Something went wrong. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected email submission error:", error);
    return { error: "Something went wrong. Please try again." };
  }
};
