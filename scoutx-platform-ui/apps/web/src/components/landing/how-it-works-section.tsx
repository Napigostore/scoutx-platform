"use client";

import { motion } from "framer-motion";

import type { HowItWorksStep } from "@scoutx/mock-data";

export function HowItWorksSection({ steps }: { steps: HowItWorksStep[] }) {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-8">
      <div className="section-shell space-y-10 py-12">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--scoutx-primary)]">
            How it works
          </p>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            From question to verified ground truth
          </h2>
          <p className="text-[var(--scoutx-muted-foreground)]">
            ScoutX turns a location-bound question into a ranked scout match and a structured
            evidence package.
          </p>
        </div>

        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.li
              key={step.step}
              className="relative rounded-2xl border border-[var(--scoutx-border)] bg-white/70 p-6"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
            >
              <span className="font-display text-4xl text-[var(--scoutx-primary)]/25">
                {String(step.step).padStart(2, "0")}
              </span>
              <h3 className="mt-4 text-xl font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--scoutx-muted-foreground)]">
                {step.description}
              </p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
