"use client";

import { BookOpen } from "lucide-react";
import { LibraryClient } from "@/components/library-client";

export default function LibraryPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FEFDFB" }}>
      <main className="w-full">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1
                className="text-3xl md:text-3xl font-bold flex items-center gap-3"
                style={{ fontSize: "24px" }}
              >
                <BookOpen className="w-8 h-8 text-black" />
                <span className="md:text-3xl" style={{ fontSize: "24px" }}>
                  Your Ideas Library
                </span>
              </h1>
              <p className="text-gray-600">
                All your saved startup ideas in one place
              </p>
            </div>

            {/* Ideas Grid */}
            <LibraryClient />
          </div>
        </div>
      </main>
    </div>
  );
}
