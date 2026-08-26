"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import { Button } from "@scoutx/ui";

import { WorldPreviewMap } from "@/components/landing/world-preview-map";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,var(--scoutx-hero-from),var(--scoutx-hero-via)_48%,var(--scoutx-hero-to))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.16),transparent_36%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.1),transparent_28%)]" />
      <div className="section-shell relative grid min-h-[calc(100vh-4rem)] items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
        <motion.div
          className="space-y-7 text-white"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="font-display text-4xl leading-none tracking-tight sm:text-5xl md:text-6xl">
            ScoutX
          </p>
          <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Real-world answers, verified on the ground.
          </h1>
          <p className="max-w-lg text-base text-white/80 sm:text-lg">
            Compose a mission, match nearby scouts, and receive timestamped evidence from the
            places that matter — streets, venues, events, and conditions you cannot see from a
            screen.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="bg-white text-[var(--scoutx-hero-from)] hover:bg-white/90"
              asChild
            >
              <Link href="#composer">Compose a mission</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10"
              asChild
            >
              <Link href="#how-it-works">See how it works</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/20 shadow-[0_30px_80px_rgba(8,40,28,0.35)] sm:min-h-[420px]"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <WorldPreviewMap />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(8,40,28,0.72)] to-transparent p-5">
            <p className="text-sm font-medium text-white">Live scout coverage across six cities</p>
            <p className="text-xs text-white/70">Tokyo · New York · London · Singapore · Barcelona · HCMC</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
