"use client";

import { cn } from "@scoutx/ui";
import { motion } from "framer-motion";

interface HeroMediaProps {
  photoUrl?: string;
  location: string;
  category: string;
  className?: string;
}

const CATEGORY_PLACEHOLDER: Record<string, string> = {
  STREET_CONDITIONS: "road",
  ENVIRONMENT: "nature",
  INFRASTRUCTURE: "building",
  SAFETY: "warning",
  BUSINESS: "shop",
  EVENT: "event",
  OTHER: "pin",
};

function getCategoryEmoji(category: string) {
  return CATEGORY_PLACEHOLDER[category] ?? CATEGORY_PLACEHOLDER.OTHER;
}

export function HeroMedia({ photoUrl, location, category, className }: HeroMediaProps) {
  const mediaUrl = photoUrl ?? "";
  const hasMedia = mediaUrl.length > 0;
  const label = hasMedia
    ? `Photo of ${category} in ${location}`
    : `${category} investigation in ${location}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative overflow-hidden",
        "bg-[var(--scoutx-hero-from)]",
        "aspect-video md:aspect-auto md:h-full md:min-h-[320px]",
        className,
      )}
      role="img"
      aria-label={label}
    >
      {/* ── Ambient market atmosphere overlay ── */}
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_20%_30%,rgba(15,107,76,0.25),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(circle_at_80%_70%,rgba(26,95,138,0.15),transparent_50%)]" />

      {/* ── Scan-line overlay for intel aesthetic ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[3] opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px)",
          backgroundSize: "100% 4px",
        }}
        aria-hidden="true"
      />

      {/* ── Subtle vignette ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[3]"
        style={{
          boxShadow: "inset 0 0 120px rgba(0,0,0,0.4)",
        }}
        aria-hidden="true"
      />

      {/* ── Live indicator badge (top-left) ── */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--scoutx-destructive)] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--scoutx-destructive)]" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/90">
          LIVE
        </span>
      </div>

      {/* ── Location tag (bottom-left) ── */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 backdrop-blur-sm">
        <svg
          className="h-3 w-3 text-white/80"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-[10px] font-medium text-white/90">{location}</span>
      </div>

      {hasMedia ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt={label}
          className="relative z-[1] h-full w-full object-cover"
          loading="eager"
        />
      ) : (
        <div className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-b from-[var(--scoutx-hero-from)] to-[var(--scoutx-hero-via)] p-6 text-center">
          <span className="text-5xl" role="img" aria-hidden="true">
            {getCategoryEmoji(category)}
          </span>
          <span className="max-w-[200px] text-xs font-medium text-white/70">
            {category.replace(/_/g, " ")} investigation
          </span>
          <div className="mt-2 h-20 w-full max-w-[160px] rounded-[var(--scoutx-radius-md)] border border-white/10 bg-white/5" />
        </div>
      )}
    </motion.div>
  );
}
