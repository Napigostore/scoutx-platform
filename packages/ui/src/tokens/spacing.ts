/**
 * ScoutX Spacing & Sizing System
 *
 * Uses a 4 px base unit (quad-grid) for consistency.
 * All spacing values derive from this atomic unit.
 *
 * Scale reference:
 * ─────────────────
 * 0.5  –  2 px  – micro (icon inset, tight stack)
 * 1    –  4 px  – base unit
 * 1.5  –  6 px  – tight inner padding
 * 2    –  8 px  – compact gap, icon padding
 * 2.5  – 10 px  – tight button padding
 * 3    – 12 px  – standard inner padding
 * 3.5  – 14 px  – form element padding
 * 4    – 16 px  – card padding, standard gap
 * 5    – 20 px  – section gap
 * 6    – 24 px  – card header padding, list gap
 * 7    – 28 px  – section heading margin
 * 8    – 32 px  – modal/panel padding
 * 9    – 36 px  – generous gap
 * 10   – 40 px  – section padding
 * 11   – 44 px  – hero spacing
 * 12   – 48 px  – large section padding
 * 14   – 56 px  – page main padding
 * 16   – 64 px  – wide gutter
 * 20   – 80 px  – section vertical margin
 * 24   – 96 px  – page section isolation
 * 28   – 112px  – hero vertical padding
 * 32   – 128px  – generous page gutter
 * 36   – 144px  – wide isolation
 * 40   – 160px  – max section padding
 * 44   – 176px  – page max gutter
 * 48   – 192px  – hero max padding
 * 52   – 208px  – full bleed sections
 * 56   – 224px  – landing page heroes
 * 60   – 240px  – maximum spacing
 * 64   – 256px  – outer page isolation
 */

export const spacing = {
  0: "0px",
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  3.5: "14px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  9: "36px",
  10: "40px",
  11: "44px",
  12: "48px",
  14: "56px",
  16: "64px",
  20: "80px",
  24: "96px",
  28: "112px",
  32: "128px",
  36: "144px",
  40: "160px",
  44: "176px",
  48: "192px",
  52: "208px",
  56: "224px",
  60: "240px",
  64: "256px",
} as const;

/* ─── Named Spacing Aliases ─── */

export const space = {
  /** Tightest spacing – micro gaps, icon inset */
  micro: spacing[0.5],
  /** Minimum unit – 4 px base */
  unit: spacing[1],
  /** Compact inner padding – buttons, badges */
  compact: spacing[1.5],
  /** Standard inner padding – form inputs */
  inner: spacing[3],
  /** Standard gap between elements */
  gap: spacing[4],
  /** Card / panel inner padding */
  panel: spacing[6],
  /** Section vertical spacing */
  section: spacing[10],
  /** Page main content padding */
  page: spacing[14],
  /** Hero section vertical padding */
  hero: spacing[28],
} as const;
