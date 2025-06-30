"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  sanitize?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, sanitize = true, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (sanitize && onChange) {
        // Basic input sanitization for common XSS vectors
        const sanitizedValue = e.target.value
          .replace(/<script[^>]*>.*?<\/script>/gi, "")
          .replace(/<[^>]*>/g, "")
          .replace(/javascript:/gi, "")
          .replace(/on\w+=/gi, "");

        const sanitizedEvent = {
          ...e,
          target: {
            ...e.target,
            value: sanitizedValue,
          },
        };
        onChange(sanitizedEvent as React.ChangeEvent<HTMLInputElement>);
      } else if (onChange) {
        onChange(e);
      }
    };

    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-gray-300 bg-white px-6 py-4 text-sm transition-colors duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-black disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
