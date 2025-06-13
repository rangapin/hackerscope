"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FEFDFB] flex items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center">
        <div
          className="w-4 h-4 bg-[#D4714B] rounded-full"
          style={{
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>

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
