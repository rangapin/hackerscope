"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { submitEmailAction } from "@/app/actions";

export default function EmailCapture() {
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
        setMessage("Thanks! We'll notify you when we launch.");
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
    <div className="bg-white p-8 rounded-xl shadow-sm max-w-md mx-auto text-center">
      <p className="text-sm text-gray-600 mb-6">
        Get your first validated idea in 30 seconds
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-12 text-center"
            disabled={isSubmitting}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Getting Your Idea..." : "Get Your Free Idea"}
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
  );
}
