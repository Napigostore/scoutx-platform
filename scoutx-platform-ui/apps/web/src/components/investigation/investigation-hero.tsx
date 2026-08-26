"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button, Badge, cn } from "@scoutx/ui";
import { HeroMedia } from "./hero-media";
import { BountyCard } from "./bounty-card";
import { TrustCard } from "./trust-card";
import { SocialProofBar } from "./social-proof-bar";
import { WatchButton } from "./watch-button";

/* ─── Data Types ─── */

export interface InvestigationHeroData {
  id: string;
  title: string;
  brief: string;
  category: string;
  location: string;
  photoUrl?: string;
  bounty: {
    amount: number;
    escalationAmount?: number;
    escalationInterval?: string;
    maxCap?: number;
  };
  trust: {
    rating: number;
    count: number;
    requesterName: string;
  };
  market: {
    status: "hot" | "warm" | "cold";
    watcherCount: number;
    nearbyScoutCount: number;
  };
}

interface InvestigationHeroProps {
  investigation: InvestigationHeroData;
  className?: string;
}

/* ─── Live Ticker ─── */

function LiveTicker() {
  return (
    <div className="border-[var(--scoutx-border)]/50 bg-[var(--scoutx-muted)]/30 flex items-center gap-3 overflow-hidden border-b px-4 py-1.5 md:px-6">
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--scoutx-destructive)] opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--scoutx-destructive)]" />
        </span>
        <span className="font-display text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--scoutx-muted-foreground)]">
          Intel Feed
        </span>
      </div>
      <div className="flex items-center gap-6 overflow-hidden">
        <p
          className="animate-marquee shrink-0 text-[10px] text-[var(--scoutx-muted-foreground)]"
          aria-label="Live intelligence feed"
        >
          <span className="bg-[var(--scoutx-primary)]/40 mx-2 inline-block h-1 w-1 rounded-full" />
          <span className="font-medium text-[var(--scoutx-foreground)]">3</span> scouts en route ·{" "}
          <span className="font-medium text-[var(--scoutx-foreground)]">2</span> reports filed ·{" "}
          <span className="font-medium text-[var(--scoutx-foreground)]">50 ⛭</span> avg. payout ·{" "}
          <span className="font-medium text-[var(--scoutx-foreground)]">87%</span> completion rate
          <span className="bg-[var(--scoutx-primary)]/40 mx-2 inline-block h-1 w-1 rounded-full" />
          <span className="font-medium text-[var(--scoutx-foreground)]">3</span> scouts en route ·{" "}
          <span className="font-medium text-[var(--scoutx-foreground)]">2</span> reports filed ·{" "}
          <span className="font-medium text-[var(--scoutx-foreground)]">50 ⛭</span> avg. payout ·{" "}
          <span className="font-medium text-[var(--scoutx-foreground)]">87%</span> completion rate
        </p>
      </div>
    </div>
  );
}

/* ─── Component ─── */

/**
 * InvestigationHero is the above-the-fold section of an investigation page.
 * Transformed from a simple SaaS hero into a global intelligence marketplace
 * with premium typography, motion, live ticker, and market atmosphere.
 *
 * Layout:
 * - Desktop: Two-column (media left ~45%, info right ~55%)
 * - Mobile: Single column stacked
 */
export function InvestigationHero({ investigation, className }: InvestigationHeroProps) {
  const { id, title, brief, category, location, photoUrl, bounty, trust, market } = investigation;

  return (
    <section className={cn("relative", className)} aria-label={`Investigation: ${title}`}>
      {/* ── Live Ticker ── */}
      <LiveTicker />

      {/* ── Main Hero Grid ── */}
      <div className="grid gap-0 md:min-h-[70vh] md:grid-cols-[45%_55%]">
        {/* ── Navigation Row ── */}
        <motion.div
          className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-4 py-3 md:px-6"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ top: "2rem" }}
        >
          <Link
            href="/investigations"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--scoutx-muted-foreground)] transition-colors hover:text-[var(--scoutx-foreground)]"
            aria-label="Back to investigation list"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Browse
          </Link>

          <div className="flex items-center gap-2">
            <WatchButton />
            <button
              type="button"
              className="inline-flex items-center rounded-[var(--scoutx-radius-md)] px-2 py-1.5 text-xs text-[var(--scoutx-muted-foreground)] transition-colors hover:bg-[var(--scoutx-muted)] hover:text-[var(--scoutx-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scoutx-ring)]"
              aria-label="More options"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* ── Hero Media ── */}
        <div className="relative md:h-full md:min-h-[70vh]">
          <HeroMedia
            photoUrl={photoUrl}
            location={location}
            category={category}
            className="h-full w-full rounded-none md:rounded-none"
          />
        </div>

        {/* ── Info Panel ── */}
        <div className="flex flex-col justify-center gap-5 px-4 py-6 md:px-8 md:py-10 lg:px-12">
          {/* Category badge + metadata */}
          <motion.div
            className="flex flex-wrap items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              {category}
            </Badge>
            <motion.span
              className="flex items-center gap-1 text-xs text-[var(--scoutx-muted-foreground)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <svg
                className="h-3 w-3"
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {location}
            </motion.span>
          </motion.div>

          {/* Title + brief */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-[var(--scoutx-foreground)] md:text-4xl lg:text-[2.75rem]">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-[var(--scoutx-muted-foreground)] md:text-base">
              {brief}
            </p>
          </motion.div>

          {/* Trust */}
          <TrustCard
            rating={trust.rating}
            count={trust.count}
            requesterName={trust.requesterName}
          />

          {/* Bounty */}
          <BountyCard
            amount={bounty.amount}
            escalationAmount={bounty.escalationAmount}
            escalationInterval={bounty.escalationInterval}
            maxCap={bounty.maxCap}
          />

          {/* Social proof */}
          <SocialProofBar
            marketStatus={market.status}
            watcherCount={market.watcherCount}
            nearbyScoutCount={market.nearbyScoutCount}
          />

          {/* Primary CTA */}
          <motion.div
            className="pt-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button size="lg" className="w-full text-sm md:text-base" asChild>
              <Link href={`/investigation/${id}/join`}>
                Join Investigation
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </Button>
            <p className="mt-1.5 text-center text-[10px] text-[var(--scoutx-muted-foreground)]">
              By joining, you agree to the ScoutX terms of service
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
