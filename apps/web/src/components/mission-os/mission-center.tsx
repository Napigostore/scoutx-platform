"use client";

import { motion } from "framer-motion";
import { cn, Badge } from "@scoutx/ui";

/* ─── Types ─── */

export interface MissionCenterData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  urgency: "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
  location: string;
  /** Coordinates for map display */
  coordinates: {
    latitude: number;
    longitude: number;
  };
  /** Assigned scout names */
  assignedScouts: string[];
  requesterName: string;
  createdAt: string;
  expiresAt: string;
}

interface MissionCenterProps {
  data: MissionCenterData;
  className?: string;
}

const URGENCY_CONFIG = {
  LOW: {
    label: "Low",
    dotColor: "bg-[var(--scoutx-muted-foreground)]",
    badgeVariant: "outline" as const,
  },
  NORMAL: {
    label: "Normal",
    dotColor: "bg-[var(--scoutx-primary)]",
    badgeVariant: "secondary" as const,
  },
  HIGH: { label: "High", dotColor: "bg-[var(--scoutx-warning)]", badgeVariant: "outline" as const },
  CRITICAL: {
    label: "Critical",
    dotColor: "bg-[var(--scoutx-destructive)]",
    badgeVariant: "outline" as const,
  },
} as const;

/**
 * MissionCenter is the primary content area showing the active mission's
 * briefing, status, assigned team, map area placeholder, and key metadata.
 * Designed to feel like a command center dashboard — not a CRUD form.
 */
export function MissionCenter({ data, className }: MissionCenterProps) {
  const urgency = URGENCY_CONFIG[data.urgency];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("space-y-4", className)}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
              {data.title}
            </h2>
            <Badge
              variant={urgency.badgeVariant}
              className="flex items-center gap-1 text-[9px] uppercase tracking-wider"
            >
              <span
                className={cn("inline-block h-1.5 w-1.5 rounded-full", urgency.dotColor)}
                aria-hidden="true"
              />
              {urgency.label}
            </Badge>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--scoutx-muted-foreground)]">
            <span className="inline-flex items-center gap-1">
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
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
              {data.location}
            </span>
            <span aria-hidden="true">·</span>
            <span>{data.category}</span>
            <span aria-hidden="true">·</span>
            <Badge variant="outline" className="text-[8px] uppercase tracking-wider">
              {data.status}
            </Badge>
          </p>
        </div>

        {/* Coordinates display */}
        <div className="shrink-0 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-2.5 py-1.5 text-[9px] text-[var(--scoutx-muted-foreground)]">
          <span className="font-mono">
            {data.coordinates.latitude.toFixed(4)}°, {data.coordinates.longitude.toFixed(4)}°
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-[var(--scoutx-muted-foreground)]">
        {data.description}
      </p>

      {/* Map placeholder */}
      <div className="relative overflow-hidden rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)]">
        <div className="bg-[var(--scoutx-muted)]/20 flex h-44 items-center justify-center md:h-56">
          <svg
            className="h-full w-full"
            viewBox="0 0 600 220"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="var(--scoutx-border)"
                  strokeWidth="0.5"
                  opacity="0.2"
                />
              </pattern>
              <radialGradient id="map-glow" cx="45%" cy="50%" r="20%">
                <stop offset="0%" stopColor="var(--scoutx-primary)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Grid background */}
            <rect width="600" height="220" fill="url(#map-grid)" />

            {/* Glow around mission location */}
            <rect width="600" height="220" fill="url(#map-glow)" />

            {/* Mission location marker */}
            <motion.circle
              cx="270"
              cy="110"
              r="6"
              fill="var(--scoutx-primary)"
              stroke="var(--scoutx-card)"
              strokeWidth="2"
              initial={{ r: 4, opacity: 0.6 }}
              animate={{ r: 6, opacity: 1 }}
              transition={{ duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
            />
            <circle cx="270" cy="110" r="14" fill="var(--scoutx-primary)" opacity="0.15" />

            {/* Nearby scout markers */}
            <circle cx="210" cy="80" r="3.5" fill="var(--scoutx-success)" opacity="0.6" />
            <circle cx="320" cy="140" r="3.5" fill="var(--scoutx-success)" opacity="0.6" />
            <circle cx="350" cy="70" r="3" fill="var(--scoutx-warning)" opacity="0.5" />
            {/* Scout labels */}
            <text
              x="218"
              y="75"
              fill="var(--scoutx-muted-foreground)"
              fontSize="7"
              fontFamily="var(--font-mono)"
              opacity="0.7"
            >
              @scout_kato
            </text>
            <text
              x="328"
              y="135"
              fill="var(--scoutx-muted-foreground)"
              fontSize="7"
              fontFamily="var(--font-mono)"
              opacity="0.7"
            >
              @scout_amina
            </text>

            {/* Radius indicator */}
            <circle
              cx="270"
              cy="110"
              r="45"
              fill="none"
              stroke="var(--scoutx-primary)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Map overlay info */}
        <div className="border-[var(--scoutx-border)]/50 bg-[var(--scoutx-card)]/80 absolute left-2 top-2 rounded-[var(--scoutx-radius-sm)] border px-2 py-1 text-[9px] text-[var(--scoutx-muted-foreground)] backdrop-blur-sm">
          {data.assignedScouts.length} scout{data.assignedScouts.length !== 1 ? "s" : ""} active
        </div>
      </div>

      {/* Mission meta bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
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
              d="M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Created <time dateTime={data.createdAt}>{data.createdAt}</time>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
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
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>
            Expires <time dateTime={data.expiresAt}>{data.expiresAt}</time>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--scoutx-muted-foreground)]">
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
              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
            />
          </svg>
          <span>Requester: {data.requesterName}</span>
        </div>
      </div>
    </motion.div>
  );
}
