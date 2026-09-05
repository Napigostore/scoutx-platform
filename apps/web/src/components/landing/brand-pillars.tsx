"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const PILLARS = [
  {
    icon: "/feature-global-search.png",
    title: "Global Search",
    tagline: "Worldwide Scout Reach",
    description:
      "Coordinate verified scouts instantly across target coordinates, cities, or continents worldwide.",
  },
  {
    icon: "/feature-ground-intel.png",
    title: "On-The-Ground Intelligence",
    tagline: "Real Human Eyes",
    description:
      "Deploy local eyes for rapid physical verification, on-site audits, and real-time ground truth.",
  },
  {
    icon: "/feature-verify-evidence.png",
    title: "Verify Evidence",
    tagline: "Tamper-Proof Proof",
    description:
      "Cryptographically anchored evidence with timestamp, geo-coordinates, and multi-scout consensus.",
  },
  {
    icon: "/feature-satellite-reach.png",
    title: "Satellite Reach",
    tagline: "Orbital to Ground",
    description:
      "Bridge orbital macro-sensing with immediate micro-validation from real people on the ground.",
  },
] as const;

export function BrandPillarsSection() {
  return (
    <section className="relative z-10 -mt-6 py-6 sm:py-10">
      <div className="section-shell">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {PILLARS.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-[var(--scoutx-card)]/90 group relative flex flex-col items-center rounded-2xl border border-[var(--scoutx-border)] p-6 text-center shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/50 hover:shadow-lg"
            >
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--scoutx-background)_80%,white)] p-2 shadow-inner transition-transform group-hover:scale-105">
                <Image
                  src={pillar.icon}
                  alt={pillar.title}
                  width={72}
                  height={72}
                  className="h-16 w-16 object-contain"
                />
              </div>
              <h3 className="font-display text-base font-bold tracking-tight text-[var(--scoutx-foreground)]">
                {pillar.title}
              </h3>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {pillar.tagline}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--scoutx-muted-foreground)]">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
