import * as React from "react";

import { cn } from "../lib/utils.js";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[var(--scoutx-border)] bg-[var(--scoutx-background)] px-3 py-2 text-sm text-[var(--scoutx-foreground)] shadow-sm transition-colors placeholder:text-[var(--scoutx-muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scoutx-ring)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
