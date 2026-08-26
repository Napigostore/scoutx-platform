/**
 * ScoutX Border Radius System
 *
 * Rounded corners follow a modular scale based on 4 px unit.
 * Use shape terminology for semantic meaning:
 *
 * ── Shape tokens ──
 * none      –  0 px – hard edge (data tables, charts)
 * sharp     –  2 px – subtle (progress bars, tabs)
 * sm        –  4 px – compact (form inputs, badges)
 * md        –  6 px – default (buttons, cards)
 * lg        –  8 px – generous (modals, dropdowns)
 * xl        – 12 px – soft (dialogs, sheets)
 * 2xl       – 16 px – pill-like (profile pics)
 * 3xl       – 24 px – very soft (hero sections)
 * full      – 9999px – fully round (pills, avatars, toggles)
 */

export const radius = {
  none: "0px",
  sharp: "2px",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  "3xl": "24px",
  full: "9999px",
} as const;

/* ─── Component-Specific Presets ─── */

export const shape = {
  /** Inline elements – badges, tags, chips */
  pill: radius.full,
  /** Form controls – inputs, selects, textareas */
  input: radius.md,
  /** Buttons (all sizes) */
  button: radius.md,
  /** Cards & containers */
  card: radius.xl,
  /** Modals, dialogs, sheets */
  dialog: radius["2xl"],
  /** Toast notifications */
  toast: radius.lg,
  /** Avatar, profile image */
  avatar: radius.full,
  /** Hero section containers */
  hero: radius["3xl"],
} as const;
