"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@scoutx/ui";

export interface TrendingMissionItem {
  id: string;
  title: string;
  category: string;
  urgency: string;
  city: string;
  country: string;
  budgetLabel: string;
  status: string;
}

function urgencyVariant(urgency: string): "default" | "secondary" | "warning" | "success" {
  switch (urgency) {
    case "CRITICAL":
    case "HIGH":
    case "URGENT":
      return "warning";
    case "MEDIUM":
    case "NORMAL":
      return "default";
    case "LOW":
      return "secondary";
    default:
      return "default";
  }
}

function formatCategory(category: string): string {
  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TrendingSection({ missions }: { missions: TrendingMissionItem[] }) {
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

        {missions.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--scoutx-border)] p-6 text-center">
            <h3 className="font-display text-base font-semibold text-[var(--scoutx-foreground)]">
              No live open missions right now
            </h3>
            <p className="mt-1 text-sm text-[var(--scoutx-muted-foreground)]">
              Check back soon or create a new discovery mission above.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {missions.map((mission, index) => (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link
                  href={`/scout/missions/${mission.id}`}
                  className="block h-full cursor-pointer"
                >
                  <Card className="h-full bg-white/80 transition-transform duration-300 hover:-translate-y-1 hover:border-[var(--scoutx-primary)]">
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
                      <span className="text-[var(--scoutx-muted-foreground)]">
                        {mission.status}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
