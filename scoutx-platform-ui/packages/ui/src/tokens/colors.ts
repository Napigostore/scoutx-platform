/**
 * ScoutX Color System
 *
 * Architectural roles (light mode defaults):
 * ─────────────────────────────────
 * background  – page/surface background
 * foreground  – high-emphasis text
 * card         – container surface (white)
 * muted       – subtle backgrounds, disabled fills
 * muted-foreground – low-emphasis text, labels
 * border      – dividers, outlines, strokes
 * primary     – CTA background, active state
 * primary-foreground – text atop primary
 * secondary   – alternative surface
 * secondary-foreground – text atop secondary
 * ring        – focus / active indicator
 * destructive – error, danger actions
 * destructive-foreground – text atop destructive
 * accent      – complementary highlight
 *
 * Semantic tokens (should be consumed via CSS custom props):
 *   var(--scoutx-{name})
 *
 * HEX & OKLCH equivalents are documented for reference.
 */

/* ─── Brand Palette (ScoutX Green) ─── */

export const brand = {
  50: "#e9f5ef",
  100: "#c8e6d6",
  200: "#a3d4bb",
  300: "#7ac29e",
  400: "#57b387",
  500: "#31a36f",
  600: "#1f8f5c",
  700: "#0f6b4c", // primary
  800: "#0c563d", // primary-hover
  900: "#083b29",
  950: "#042117",
} as const;

/* ─── Neutral Palette – Cool Grey-Green ─── */

export const neutral = {
  50: "#f4f7f5", // background
  100: "#e4ece7", // muted
  200: "#cfdad3", // border
  300: "#b0bfb6",
  400: "#8da093",
  500: "#6f8274",
  600: "#5b6d64", // muted-foreground
  700: "#4a594f",
  800: "#3a473e",
  900: "#26322b",
  950: "#12201a", // foreground
} as const;

/* ─── Semantic Roles (light mode values) ─── */

export const light = {
  background: neutral[50],
  foreground: neutral[950],
  card: "#ffffff",
  "card-foreground": neutral[950],
  muted: neutral[100],
  "muted-foreground": neutral[600],
  border: neutral[200],
  primary: brand[700],
  "primary-hover": brand[800],
  "primary-foreground": "#f4fbf7",
  secondary: "#d8ebe2",
  "secondary-hover": "#c5ddd2",
  "secondary-foreground": "#143528",
  ring: brand[600],
  success: "#1f7a4d",
  "success-foreground": "#f3fbf6",
  warning: "#b7791f",
  "warning-foreground": "#fffaf0",
  destructive: "#b91c1c",
  "destructive-foreground": "#fef2f2",
  accent: "#1a5f8a",
  "hero-from": brand[900],
  "hero-via": "#145c45",
  "hero-to": brand[600],
} as const satisfies Record<string, string>;

/* ─── Semantic Roles (dark mode values) ─── */

export const dark = {
  background: "#0f1a14",
  foreground: "#e6ede8",
  card: "#1a2a21",
  "card-foreground": "#e6ede8",
  muted: "#1f3027",
  "muted-foreground": "#809388",
  border: "#2a3f33",
  primary: brand[500],
  "primary-hover": brand[400],
  "primary-foreground": neutral[950],
  secondary: "#1f3d30",
  "secondary-hover": "#295240",
  "secondary-foreground": "#d8ebe2",
  ring: brand[400],
  success: "#2ea86a",
  "success-foreground": neutral[950],
  warning: "#d4a043",
  "warning-foreground": neutral[950],
  destructive: "#ef4444",
  "destructive-foreground": neutral[950],
  accent: "#4a9fcf",
  "hero-from": brand[500],
  "hero-via": brand[400],
  "hero-to": brand[300],
} as const satisfies Record<string, string>;
