"use client";

import { motion } from "framer-motion";

import type { TrendingMissionCard } from "@scoutx/mock-data";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@scoutx/ui";

function urgencyVariant(
  urgency: TrendingMissionCard["urgency"],
): "default" | "secondary" | "warning" | "success" {
  switch (urgency) {
    case "CRITICAL":
    case "HIGH":
      return "warning";
    case "NORMAL":
      return "default";
    case "LOW":
      return "secondary";
    default: {
      const _exhaustive: never = urgency;
      return _exhaustive;
    }
  }
}

function formatCategory(category: TrendingMissionCard["category"]): string {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TrendingSection({ missions }: { missions: TrendingMissionCard[] }) {
  return (
    <section id="trending" className="scroll-mt-24 py-8 pb-20">
      <div className="section-shell space-y-10">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--scoutx-primary)]">
            Trending
          </p>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Missions drawing scouts right now
          </h2>
          <p className="text-[var(--scoutx-muted-foreground)]">
            Open missions across major corridors — ranked by urgency, budget, and local scout
            density.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {missions.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Card className="h-full bg-white/80 transition-transform duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{formatCategory(mission.category)}</Badge>
                    <Badge variant={urgencyVariant(mission.urgency)}>{mission.urgency}</Badge>
                  </div>
                  <CardTitle className="text-lg leading-snug">{mission.title}</CardTitle>
                  <CardDescription>
                    {mission.city}, {mission.country}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[var(--scoutx-primary)]">
                    {mission.budgetLabel}
                  </span>
                  <span className="text-[var(--scoutx-muted-foreground)]">{mission.status}</span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
