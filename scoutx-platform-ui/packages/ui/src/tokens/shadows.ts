/**
 * ScoutX Shadow System
 *
 * Shadows use the brand green-black for depth (rgba base).
 * Elevation is conveyed through y-offset and blur radius.
 *
 * Layer hierarchy:
 * ──────────────────────
 * none    – 0      – flat surfaces (background)
 * sm      – 1      – cards, small containers
 * md      – 2      – elevated cards, dropdowns
 * lg      – 3      – modals, sheets
 * xl      – 4      – dialogs, toasts
 * 2xl     – 5      – overlays, drawers
 * inner   – inset  – inset depth (input focus)
 * glow    – primary – brand glow for active states
 */

const shadowColor = "rgba(18, 32, 26, var(--scoutx-shadow-alpha, 0.08))";

export const shadows = {
  none: "none",
  sm: `0 1px 2px ${shadowColor}`,
  md: `0 2px 8px ${shadowColor}, 0 1px 3px ${shadowColor}`,
  lg: `0 4px 16px ${shadowColor}, 0 2px 6px rgba(18, 32, 26, 0.06)`,
  xl: `0 8px 32px ${shadowColor}, 0 4px 12px rgba(18, 32, 26, 0.06)`,
  "2xl": `0 16px 48px ${shadowColor}, 0 8px 20px rgba(18, 32, 26, 0.08)`,
  inner: `inset 0 1px 3px rgba(18, 32, 26, 0.06)`,
  glow: `0 0 0 2px var(--scoutx-ring), 0 0 12px var(--scoutx-ring)`,
} as const;

/* ─── Named Elevation Tokens ─── */

export const elevation = {
  /** Base layer – background content */
  base: shadows.none,
  /** Surface layer – cards, panels */
  surface: shadows.sm,
  /** Raised layer – elevated cards, hover states */
  raised: shadows.md,
  /** Overlay layer – dropdowns, popovers, datepickers */
  overlay: shadows.lg,
  /** Modal layer – dialogs, sheets, drawers */
  modal: shadows.xl,
  /** Toast layer – notifications, alerts */
  toast: shadows["2xl"],
  /** Focus indicator */
  focus: shadows.glow,
} as const;
