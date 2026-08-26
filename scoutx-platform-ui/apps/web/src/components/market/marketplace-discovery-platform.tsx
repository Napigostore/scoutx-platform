"use client";

import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, Badge, cn } from "@scoutx/ui";
import { useRealtimeEvent } from "../../providers/realtime-event-provider";
import { ScoutRecommendationPanel } from "./scout-recommendation-panel";
import { Leaderboard } from "./leaderboard";
import { HeatMapInteractive } from "./heat-map-interactive";

/* ─── Search & Discovery Types ─── */

export type MarketSortOption =
  "Newest" | "Trending" | "Highest Bounty" | "Nearest" | "Most Verified" | "Recently Updated";

export interface InvestigationMarketItem {
  id: string;
  title: string;
  category: string;
  country: string;
  city: string;
  bounty: number;
  minReputation: number;
  status: "active" | "pending" | "resolved";
  distanceKm: number;
  verificationCount: number;
  createdAt: string;
  updatedAt: string;
  trendingScore: number;
}

const INITIAL_INVESTIGATIONS: InvestigationMarketItem[] = [
  {
    id: "inv_1",
    title: "San Francisco Logistics Facility Verification",
    category: "Field Verification",
    country: "USA",
    city: "San Francisco",
    bounty: 1500,
    minReputation: 80,
    status: "active",
    distanceKm: 2.4,
    verificationCount: 14,
    createdAt: "2026-07-30T18:00:00Z",
    updatedAt: "2026-07-30T21:00:00Z",
    trendingScore: 98,
  },
  {
    id: "inv_2",
    title: "Domain Intelligence & OSINT Audit",
    category: "OSINT",
    country: "USA",
    city: "San Jose",
    bounty: 2200,
    minReputation: 85,
    status: "active",
    distanceKm: 45.0,
    verificationCount: 22,
    createdAt: "2026-07-29T12:00:00Z",
    updatedAt: "2026-07-30T20:30:00Z",
    trendingScore: 94,
  },
  {
    id: "inv_3",
    title: "Warehouse Asset & Inventory Audit",
    category: "Physical Inspection",
    country: "USA",
    city: "Oakland",
    bounty: 800,
    minReputation: 60,
    status: "active",
    distanceKm: 12.1,
    verificationCount: 8,
    createdAt: "2026-07-28T09:00:00Z",
    updatedAt: "2026-07-30T19:00:00Z",
    trendingScore: 78,
  },
  {
    id: "inv_4",
    title: "Port Cargo Security Check",
    category: "Security Audit",
    country: "USA",
    city: "San Francisco",
    bounty: 3000,
    minReputation: 90,
    status: "active",
    distanceKm: 5.8,
    verificationCount: 35,
    createdAt: "2026-07-30T15:00:00Z",
    updatedAt: "2026-07-30T21:30:00Z",
    trendingScore: 99,
  },
];

export function MarketplaceDiscoveryPlatform({ className }: { className?: string }) {
  // PART 1: Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(100);
  const [minBounty, setMinBounty] = useState<number>(0);
  const [minReputation, setMinReputation] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [sortBy, setSortBy] = useState<MarketSortOption>("Trending");

  // PART 2: Discovery Feed state
  const [investigations, setInvestigations] =
    useState<InvestigationMarketItem[]>(INITIAL_INVESTIGATIONS);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(searchQuery), 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // PART 7: Realtime Updates
  useRealtimeEvent("*", (event) => {
    if (event.type === "evidence.created" || event.type === "mission.updated") {
      setInvestigations((prev) =>
        prev.map((inv) =>
          inv.id === event.investigationId
            ? {
                ...inv,
                verificationCount: inv.verificationCount + 1,
                updatedAt: new Date().toISOString(),
                trendingScore: Math.min(100, inv.trendingScore + 2),
              }
            : inv,
        ),
      );
    }
  });

  // Filtered & Sorted Investigations
  const filteredInvestigations = useMemo(() => {
    return investigations
      .filter((item) => {
        if (debouncedQuery && !item.title.toLowerCase().includes(debouncedQuery.toLowerCase())) {
          return false;
        }
        if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
        if (selectedCountry !== "All" && item.country !== selectedCountry) return false;
        if (item.distanceKm > maxRadiusKm) return false;
        if (item.bounty < minBounty) return false;
        if (item.minReputation < minReputation) return false;
        if (selectedStatus !== "All" && item.status !== selectedStatus) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "Newest":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case "Trending":
            return b.trendingScore - a.trendingScore;
          case "Highest Bounty":
            return b.bounty - a.bounty;
          case "Nearest":
            return a.distanceKm - b.distanceKm;
          case "Most Verified":
            return b.verificationCount - a.verificationCount;
          case "Recently Updated":
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          default:
            return 0;
        }
      });
  }, [
    investigations,
    debouncedQuery,
    selectedCategory,
    selectedCountry,
    maxRadiusKm,
    minBounty,
    minReputation,
    selectedStatus,
    sortBy,
  ]);

  return (
    <div className={cn("mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 md:p-6", className)}>
      {/* ─── PART 1: Global Search Header & Filters ─── */}
      <Card className="bg-card text-card-foreground shadow-xs border">
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Marketplace & Intelligence Hub</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Explore active operations, scout recommendations, live heatmaps, and top rankers
              </p>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <label htmlFor="sort-select" className="text-muted-foreground font-medium">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as MarketSortOption)}
                className="bg-background text-foreground focus:ring-primary rounded-lg border px-3 py-1.5 font-semibold focus:outline-none focus:ring-2"
              >
                {(
                  [
                    "Trending",
                    "Newest",
                    "Highest Bounty",
                    "Nearest",
                    "Most Verified",
                    "Recently Updated",
                  ] as MarketSortOption[]
                ).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Instant Search by keyword, title, location, or tag..."
              className="bg-background text-foreground placeholder:text-muted-foreground focus:ring-primary shadow-xs w-full rounded-xl border px-4 py-3 pl-10 text-sm focus:outline-none focus:ring-2"
              aria-label="Global marketplace search"
            />
            <svg
              className="text-muted-foreground absolute left-3 top-3.5 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filter Pills Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <label className="text-muted-foreground mb-1 block text-[11px] font-medium">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-background focus:ring-primary w-full rounded-md border p-1.5 font-medium focus:outline-none focus:ring-1"
              >
                <option value="All">All Categories</option>
                <option value="Field Verification">Field Verification</option>
                <option value="OSINT">OSINT</option>
                <option value="Physical Inspection">Physical Inspection</option>
                <option value="Security Audit">Security Audit</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-[11px] font-medium">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-background focus:ring-primary w-full rounded-md border p-1.5 font-medium focus:outline-none focus:ring-1"
              >
                <option value="All">All Countries</option>
                <option value="USA">USA</option>
                <option value="Germany">Germany</option>
                <option value="Singapore">Singapore</option>
              </select>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-[11px] font-medium">
                Max Radius (km)
              </label>
              <input
                type="number"
                value={maxRadiusKm}
                onChange={(e) => setMaxRadiusKm(Number(e.target.value) || 100)}
                className="bg-background focus:ring-primary w-full rounded-md border p-1.5 font-medium focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-[11px] font-medium">
                Min Bounty 🪙
              </label>
              <input
                type="number"
                value={minBounty}
                onChange={(e) => setMinBounty(Number(e.target.value) || 0)}
                className="bg-background focus:ring-primary w-full rounded-md border p-1.5 font-medium focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-[11px] font-medium">
                Min Reputation
              </label>
              <input
                type="number"
                value={minReputation}
                onChange={(e) => setMinReputation(Number(e.target.value) || 0)}
                className="bg-background focus:ring-primary w-full rounded-md border p-1.5 font-medium focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block text-[11px] font-medium">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-background focus:ring-primary w-full rounded-md border p-1.5 font-medium focus:outline-none focus:ring-1"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── PART 2: Discovery Feed & Search Results ─── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight">
            Investigations & Discovery Feed ({filteredInvestigations.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredInvestigations.map((item) => (
            <Card
              key={item.id}
              className="bg-card text-card-foreground shadow-xs hover:border-primary/40 border transition-all"
            >
              <CardContent className="flex h-full flex-col justify-between gap-3 p-5">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-foreground line-clamp-2 text-sm font-bold">{item.title}</h4>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-amber-500/20 bg-amber-500/10 font-bold text-amber-500"
                    >
                      {item.bounty} 🪙
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {item.city}, {item.country} • {item.distanceKm} km away
                  </p>
                </div>

                <div className="flex items-center justify-between border-t pt-3 text-xs">
                  <span className="bg-muted rounded px-2 py-0.5 text-[11px] font-medium">
                    {item.category}
                  </span>
                  <div className="text-muted-foreground text-[11px]">
                    <span className="font-semibold text-emerald-500">
                      {item.verificationCount} verified
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ─── PART 6: Interactive Heat Map ─── */}
      <HeatMapInteractive />

      {/* ─── PART 4: Scout Recommendation Panel ─── */}
      <ScoutRecommendationPanel
        missionCategory={selectedCategory === "All" ? "OSINT" : selectedCategory}
      />

      {/* ─── PART 5: Leaderboard ─── */}
      <Leaderboard />
    </div>
  );
}
