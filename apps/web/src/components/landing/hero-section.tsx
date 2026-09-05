"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm backdrop-blur-md">
            <Image
              src="/logo-icon.png"
              alt="Fiwokan"
              width={18}
              height={18}
              className="h-4 w-4 shrink-0 object-contain"
            />
            Global Eyes · Real Evidence · Trusted Impact
          </div>
          <h1 className="font-display max-w-2xl text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl">
            Real World.
            <br />
            <span className="text-emerald-300">Real Impact.</span>
          </h1>
          <p className="max-w-lg text-base text-white/85 sm:text-lg">
            Turn local presence into verified intelligence. Compose a mission, match nearby scouts,
            and receive timestamped evidence from the places that matter.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="lg"
              className="rounded-full bg-emerald-400 px-8 font-bold text-slate-950 shadow-xl hover:bg-emerald-300"
              asChild
            >
              <Link href="/missions">Explore Missions</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full border-white/40 bg-white/10 px-8 font-semibold text-white backdrop-blur-md hover:bg-white/20"
              asChild
            >
              <Link href="/scout/missions">Become a Scout</Link>
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
            <p className="text-xs text-white/70">
              Tokyo · New York · London · Singapore · Barcelona · HCMC
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
