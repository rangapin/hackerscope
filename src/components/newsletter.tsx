"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { submitEmailAction } from "@/app/actions";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("email", email);

      const result = await submitEmailAction(formData);

      if (result?.success) {
        setIsSuccess(true);
        setMessage("Thanks for subscribing! We'll keep you updated.");
        setEmail("");
      } else {
        setMessage(result?.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
          Stay Updated
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto text-center">
          Get the latest startup ideas, market insights, and product updates
          delivered to your inbox.
        </p>

        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 h-12"
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              className="h-12 px-6 text-white bg-black rounded-xl hover:bg-gray-800 transition-all duration-200 font-normal"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-center text-sm ${
                isSuccess
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message}
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
