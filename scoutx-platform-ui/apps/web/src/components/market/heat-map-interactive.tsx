"use client";

import { useState } from "react";
import { Card, CardContent, cn } from "@scoutx/ui";
import { useRealtimeEvent } from "../../providers/realtime-event-provider";

export interface HeatMapPoint {
  id: string;
  title: string;
  category: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  bounty: number;
  density: number; // 1-5
  active: boolean;
}

const INITIAL_HEATMAP_POINTS: HeatMapPoint[] = [
  {
    id: "h1",
    title: "Asset Inspection",
    category: "OSINT",
    x: 28,
    y: 35,
    bounty: 500,
    density: 4,
    active: true,
  },
  {
    id: "h2",
    title: "Physical Verification",
    category: "Field",
    x: 45,
    y: 52,
    bounty: 1200,
    density: 5,
    active: true,
  },
  {
    id: "h3",
    title: "Security Audit",
    category: "Security",
    x: 68,
    y: 40,
    bounty: 750,
    density: 3,
    active: false,
  },
  {
    id: "h4",
    title: "Supply Chain Audit",
    category: "Field",
    x: 80,
    y: 65,
    bounty: 900,
    density: 4,
    active: true,
  },
  {
    id: "h5",
    title: "Facility Inspection",
    category: "OSINT",
    x: 35,
    y: 70,
    bounty: 400,
    density: 2,
    active: true,
  },
];

export function HeatMapInteractive({ className }: { className?: string }) {
  const [points, setPoints] = useState<HeatMapPoint[]>(INITIAL_HEATMAP_POINTS);
  const [selectedPoint, setSelectedPoint] = useState<HeatMapPoint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Realtime updates on heatmap activity
  useRealtimeEvent("*", (event) => {
    if (event.type === "evidence.created" || event.type === "mission.updated") {
      setPoints((prev) => {
        const randomX = Math.floor(Math.random() * 80) + 10;
        const randomY = Math.floor(Math.random() * 70) + 15;
        const newPoint: HeatMapPoint = {
          id: `h_${Date.now()}`,
          title: `Live Activity: ${event.investigationId || "Investigation"}`,
          category: "OSINT",
          x: randomX,
          y: randomY,
          bounty: 300,
          density: 5,
          active: true,
        };
        return [newPoint, ...prev.slice(0, 10)];
      });
    }
  });

  const filteredPoints = points.filter(
    (p) => activeCategory === "All" || p.category === activeCategory,
  );

  return (
    <Card
      className={cn("bg-card text-card-foreground shadow-xs overflow-hidden border", className)}
    >
      <CardContent className="p-6">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold tracking-tight">Interactive Mission Heat Map</h3>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Live mission density, active operations, and regional intelligence hubs
            </p>
          </div>

          <div className="bg-muted/40 flex items-center gap-1.5 rounded-lg border p-1 text-xs">
            {["All", "OSINT", "Field", "Security"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition-colors",
                  activeCategory === cat
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Heat Map Canvas Viewport */}
        <div className="relative h-80 w-full overflow-hidden rounded-xl border bg-gradient-to-b from-slate-950 via-slate-900 to-zinc-950">
          {/* Map Grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30" />

          {/* Interactive Density Hotspots */}
          {filteredPoints.map((pt) => (
            <button
              key={pt.id}
              type="button"
              onClick={() => setSelectedPoint(pt)}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
              aria-label={`Mission node ${pt.title}`}
            >
              <span className="relative flex items-center justify-center">
                <span className="bg-primary/40 absolute inline-flex h-8 w-8 animate-ping rounded-full opacity-75" />
                <span className="bg-primary ring-primary/20 relative inline-flex h-4 w-4 rounded-full shadow-md ring-4 transition-transform group-hover:scale-125" />
              </span>
            </button>
          ))}

          {/* Selected Point Popover */}
          {selectedPoint && (
            <div
              style={{
                left: `${Math.min(75, selectedPoint.x)}%`,
                top: `${Math.min(70, selectedPoint.y)}%`,
              }}
              className="bg-popover/95 text-popover-foreground absolute z-10 w-56 rounded-lg border p-3 text-xs shadow-xl backdrop-blur-md transition-all"
            >
              <div className="flex items-start justify-between gap-1">
                <p className="text-foreground truncate font-bold">{selectedPoint.title}</p>
                <button
                  type="button"
                  onClick={() => setSelectedPoint(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
              <div className="text-muted-foreground mt-2 space-y-1 text-[11px]">
                <p>
                  Category:{" "}
                  <span className="text-foreground font-semibold">{selectedPoint.category}</span>
                </p>
                <p>
                  Bounty:{" "}
                  <span className="font-bold text-amber-500">{selectedPoint.bounty} 🪙</span>
                </p>
                <p>
                  Density:{" "}
                  <span className="font-semibold text-emerald-500">
                    Level {selectedPoint.density}/5
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
