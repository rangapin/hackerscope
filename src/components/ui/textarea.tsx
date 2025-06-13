"use client";

import * as React from "react";

import { cn } from "../../lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  sanitize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, sanitize = true, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
        onChange(sanitizedEvent as React.ChangeEvent<HTMLTextAreaElement>);
      } else if (onChange) {
        onChange(e);
      }
    };

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hotpink-DEFAULT focus-visible:ring-offset-2 focus-visible:border-hotpink-DEFAULT disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:shadow-md resize-none",
          className,
        )}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
