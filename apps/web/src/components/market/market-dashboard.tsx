"use client";

import { motion } from "framer-motion";
import { cn } from "@scoutx/ui";
import { LiveFeed, type LiveFeedItem } from "./live-feed";
import { Trending, type TrendingItem } from "./trending";
import { HeatMapPlaceholder } from "./heat-map-placeholder";
import { MarketStats, type MarketStat } from "./market-stats";
import { CoinActivity, type CoinActivityItem } from "./coin-activity";
import { TrustActivity, type TrustActivityItem } from "./trust-activity";
import { GlobalActivity, type GlobalActivityItem } from "./global-activity";
import { BreakingIntelligence, type BreakingIntelItem } from "./breaking-intelligence";
import { TopInvestigations, type TopInvestigationItem } from "./top-investigations";

/* ─── Types ─── */

export interface MarketDashboardData {
  liveFeed: LiveFeedItem[];
  trending: TrendingItem[];
  marketStats: MarketStat[];
  coinActivity: CoinActivityItem[];
  trustActivity: TrustActivityItem[];
  globalActivity: GlobalActivityItem[];
  breakingIntel: BreakingIntelItem[];
  topInvestigations: TopInvestigationItem[];
}

interface MarketDashboardProps {
  data: MarketDashboardData;
  className?: string;
}

/**
 * MarketDashboard is the realtime-ready Live Intelligence Market page.
 * It composits all market sub-panels into a responsive grid layout.
 *
 * Layout:
 * - Desktop: 3-column grid
 *   - Left sidebar: Live Feed, Trending
 *   - Center: Heat Map, Market Stats, Global Activity
 *   - Right sidebar: Breaking Intel, Top Investigations, Coin Activity, Trust Activity
 * - Tablet: 2 columns
 * - Mobile: 1 column, stacked
 */
export function MarketDashboard({ data, className }: MarketDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={cn("mx-auto max-w-screen-2xl px-4 py-6 md:px-6 lg:px-8", className)}
    >
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--scoutx-foreground)] md:text-3xl">
            Live Intelligence Market
          </h1>
          <p className="text-sm text-[var(--scoutx-muted-foreground)]">
            Real-time scouting intelligence from around the world
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--scoutx-muted-foreground)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--scoutx-success)] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--scoutx-success)]" />
          </span>
          <span className="font-medium text-[var(--scoutx-foreground)]">Live</span>
          <span aria-hidden="true">·</span>
          <span>Updates every 30s</span>
        </div>
      </div>

      {/* Responsive grid layout */}
      <div className="grid gap-5 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[300px_1fr_300px]">
        {/* ── Left Sidebar ── */}
        <div className="flex flex-col gap-5">
          <LiveFeed items={data.liveFeed} />
          <Trending items={data.trending} />
        </div>

        {/* ── Center Content ── */}
        <div className="flex flex-col gap-5">
          <HeatMapPlaceholder />
          <MarketStats stats={data.marketStats} />
          <GlobalActivity items={data.globalActivity} />
        </div>

        {/* ── Right Sidebar ── */}
        <div className="flex flex-col gap-5">
          <BreakingIntelligence items={data.breakingIntel} />
          <TopInvestigations items={data.topInvestigations} />
          <CoinActivity items={data.coinActivity} />
          <TrustActivity items={data.trustActivity} />
        </div>
      </div>
    </motion.div>
  );
}
