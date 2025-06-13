"use client";

import Link from "next/link";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../supabase/client";
import { User } from "@supabase/supabase-js";

export default function Hero() {
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
  }, []);

  const handleGenerateIdeas = () => {
    router.push("/sign-up");
  };

  return (
    <div className="relative overflow-hidden bg-white min-h-[80vh] flex items-center">
      {/* Minimal background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream-DEFAULT via-cream-DEFAULT/30 to-cream-DEFAULT" />

      <div className="relative w-full py-16">
        <div className="container-max">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative mb-3">
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-terracotta-DEFAULT rounded-full opacity-20"></div>
              <h1 className="hero-title text-5xl sm:text-7xl relative z-10">
                <span className="font-light text-[#1F1F1F]">Build the </span>
                <span className="hero-title-accent">Next Big Thing</span>
              </h1>
            </div>

            <p className="hero-subtitle text-sm sm:text-xl mb-8 sm:mb-16 text-center">
              Ideate in seconds. Validate instantly. Execute faster.
            </p>

            <div className="flex justify-center mb-12 sm:mb-20 max-w-4xl mx-auto">
              <button
                onClick={handleGenerateIdeas}
                className="inline-flex items-center px-8 py-4 text-white bg-black rounded-lg text-lg font-medium shadow-lg hover:bg-gray-800 transition-colors duration-200"
              >
                Generate My Free Idea
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-12 text-base text-gray-500 max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-terracotta-DEFAULT" />
                <span>1 free idea generation</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-terracotta-DEFAULT" />
                <span>AI market research included</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-terracotta-DEFAULT" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
