/**
 * ScoutX Typography System
 *
 * Font architecture:
 * ─────────────────
 * font-sans    – Sora (UI text, body copy, labels)
 * font-display – Fraunces (headings, hero, emphasis)
 * font-mono    – JetBrains Mono / system (code, data)
 *
 * Type scale uses a 1.25 ratio (major third) for harmony.
 */

/* ─── Font Families ─── */

export const fontFamily = {
  sans: "var(--font-sora), 'Segoe UI', system-ui, sans-serif",
  display: "var(--font-fraunces), Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'SF Mono', Consolas, monospace",
} as const;

/* ─── Type Scale ─── */

export const fontSize = {
  "2xs": ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.02em" }], // 10px – caption / badge
  xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em" }], // 12px – label / meta
  sm: ["0.825rem", { lineHeight: "1.25rem", letterSpacing: "0.005em" }], // 13.2px – body small
  base: ["0.9375rem", { lineHeight: "1.5rem", letterSpacing: "0" }], // 15px – body
  lg: ["1.0625rem", { lineHeight: "1.625rem", letterSpacing: "0" }], // 17px – large body
  xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }], // 20px – h5 / lead
  "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }], // 24px – h4
  "3xl": ["1.875rem", { lineHeight: "2.375rem", letterSpacing: "-0.02em" }], // 30px – h3
  "4xl": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.025em" }], // 36px – h2
  "5xl": ["3rem", { lineHeight: "3.5rem", letterSpacing: "-0.03em" }], // 48px – h1
  "6xl": ["3.75rem", { lineHeight: "4.25rem", letterSpacing: "-0.035em" }], // 60px – hero
  "7xl": ["4.5rem", { lineHeight: "5rem", letterSpacing: "-0.04em" }], // 72px – display
} as const;

/* ─── Font Weight Tokens ─── */

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/* ─── Heading Presets ─── */

export const heading = {
  h1: {
    fontFamily: fontFamily.display,
    fontSize: fontSize["5xl"],
    fontWeight: fontWeight.bold,
  },
  h2: {
    fontFamily: fontFamily.display,
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.bold,
  },
  h3: {
    fontFamily: fontFamily.display,
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.semibold,
  },
  h4: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.semibold,
  },
  h5: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize["xl"],
    fontWeight: fontWeight.semibold,
  },
  h6: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize["lg"],
    fontWeight: fontWeight.semibold,
  },
} as const;

/* ─── Utility Presets ─── */

export const textPreset = {
  "hero-title": {
    fontFamily: fontFamily.display,
    fontSize: fontSize["6xl"],
    fontWeight: fontWeight.bold,
    lineHeight: "1.1",
  },
  "hero-subtitle": {
    fontFamily: fontFamily.sans,
    fontSize: fontSize["lg"],
    fontWeight: fontWeight.normal,
    lineHeight: "1.6",
  },
  "section-title": {
    fontFamily: fontFamily.display,
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.semibold,
  },
  "card-title": {
    fontFamily: fontFamily.sans,
    fontSize: fontSize["base"],
    fontWeight: fontWeight.semibold,
  },
  "label-sm": {
    fontFamily: fontFamily.sans,
    fontSize: fontSize["xs"],
    fontWeight: fontWeight.medium,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  "stat-value": {
    fontFamily: fontFamily.display,
    fontSize: fontSize["4xl"],
    fontWeight: fontWeight.bold,
    fontVariantNumeric: "tabular-nums" as const,
  },
  "stat-label": {
    fontFamily: fontFamily.sans,
    fontSize: fontSize["sm"],
    fontWeight: fontWeight.medium,
  },
  "code-inline": {
    fontFamily: fontFamily.mono,
    fontSize: fontSize["xs"],
  },
} as const;
