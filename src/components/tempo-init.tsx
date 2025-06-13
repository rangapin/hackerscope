"use client";

import { useEffect } from "react";

export function TempoInit() {
  useEffect(() => {
    const init = async () => {
      if (process.env.NEXT_PUBLIC_TEMPO) {
        try {
          const { TempoDevtools } = await import("tempo-devtools");
          TempoDevtools.init();
        } catch (error) {
          // Silently ignore TempoDevtools errors in production
          console.warn("TempoDevtools initialization failed:", error);
        }
      }
    };

    init();
  }, []);

  return null;
}
