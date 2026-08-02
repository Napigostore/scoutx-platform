"use client";

import { Card, CardContent, cn } from "@scoutx/ui";
import { motion } from "framer-motion";

interface TrustCardProps {
  /** Average star rating (0–5) */
  rating: number;
  /** Number of ratings */
  count: number;
  /** Requester display name */
  requesterName: string;
  /** Additional class names */
  className?: string;
}

/**
 * TrustCard displays the requester's credibility signal.
 * Shows star rating, number of reviews, and requester name.
 * Uses confidence-oriented language to reinforce marketplace trust.
 */
export function TrustCard({ rating, count, requesterName, className }: TrustCardProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const trustLabel =
    rating >= 4.5
      ? "Highly Trusted"
      : rating >= 4.0
        ? "Verified Requester"
        : rating >= 3.5
          ? "Established"
          : "Emerging";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn("", className)}>
        <CardContent className="flex flex-col gap-1.5 p-4">
          <div className="flex items-center justify-between">
            <span className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--scoutx-muted-foreground)]">
              Requester Credibility
            </span>
            <span className="bg-[var(--scoutx-primary)]/10 rounded-[var(--scoutx-radius-sm)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--scoutx-primary)]">
              {trustLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="flex items-center"
              role="img"
              aria-label={`${rating.toFixed(1)} out of 5 stars`}
            >
              {Array.from({ length: fullStars }, (_, i) => (
                <svg
                  key={`full-${i}`}
                  className="h-4 w-4 text-[var(--scoutx-warning)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              {hasHalfStar && (
                <svg
                  className="h-4 w-4 text-[var(--scoutx-warning)]"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="halfStar">
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <path
                    fill="url(#halfStar)"
                    stroke="currentColor"
                    strokeWidth="1"
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              )}
              {Array.from({ length: emptyStars }, (_, i) => (
                <svg
                  key={`empty-${i}`}
                  className="h-4 w-4 text-[var(--scoutx-border)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="font-display text-base font-bold leading-none text-[var(--scoutx-foreground)]">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-[var(--scoutx-muted-foreground)]">
              ({count.toLocaleString()} reviews)
            </span>
          </div>

          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Requester:{" "}
            <span className="font-medium text-[var(--scoutx-foreground)]">{requesterName}</span>
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[var(--scoutx-success)]">
              <svg
                className="h-2.5 w-2.5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75z"
                  clipRule="evenodd"
                />
              </svg>
              Verified
            </span>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
