import * as React from "react";

import { cn } from "../lib/utils.js";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" &&
          "border-transparent bg-[var(--scoutx-primary)] text-[var(--scoutx-primary-foreground)]",
        variant === "secondary" &&
          "border-transparent bg-[var(--scoutx-secondary)] text-[var(--scoutx-secondary-foreground)]",
        variant === "outline" && "border-[var(--scoutx-border)] text-[var(--scoutx-foreground)]",
        variant === "success" &&
          "border-transparent bg-[var(--scoutx-success)] text-[var(--scoutx-success-foreground)]",
        variant === "warning" &&
          "border-transparent bg-[var(--scoutx-warning)] text-[var(--scoutx-warning-foreground)]",
        className,
      )}
      {...props}
    />
  );
}
