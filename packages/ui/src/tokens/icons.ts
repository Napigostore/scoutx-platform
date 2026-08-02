/**
 * ScoutX Icon System Rules
 *
 * Guidelines for consistent icon usage across the UI.
 * All icons should use lucide-react unless custom SVG is unavoidable.
 */

/* ─── Icon Size Presets ─── */

export const iconSize = {
  /** Micro – inline with text, badges */
  xs: 12,
  /** Small – compact buttons, tag icons */
  sm: 14,
  /** Default – standard buttons, menu items */
  md: 16,
  /** Large – section headers, empty states */
  lg: 20,
  /** XL – feature icons, illustrations */
  xl: 24,
  /** 2XL – hero icons, page symbols */
  "2xl": 32,
  /** 3XL – brand marks, large illustrations */
  "3xl": 48,
} as const;

/* ─── Icon Stroke Width ─── */

export const iconStrokeWidth = {
  thin: 1.5,
  default: 2,
  bold: 2.5,
} as const;

/* ─── Icon Color Roles ─── */

export const iconColor = {
  /** Inherits current text color (default behavior) */
  inherit: "currentColor",
  /** Subtle, muted icons (meta info, secondary actions) */
  muted: "var(--scoutx-muted-foreground)",
  /** Brand-primary icons */
  primary: "var(--scoutx-primary)",
  /** Success / confirm icons */
  success: "var(--scoutx-success)",
  /** Warning / caution icons */
  warning: "var(--scoutx-warning)",
  /** Destructive / error icons */
  destructive: "var(--scoutx-destructive)",
  /** Accent / info icons */
  accent: "var(--scoutx-accent)",
} as const;

/* ─── Common Icon Usage Rules ─── */

export const iconRules = {
  /** Always use `aria-hidden="true"` for decorative icons */
  decorative: true,
  /** Always provide `aria-label` for standalone interactive icons */
  standaloneAriaLabel: true,
  /** Icons inside buttons should use size matching button size */
  buttonSize: {
    sm: iconSize.sm,
    default: iconSize.md,
    lg: iconSize.lg,
    icon: iconSize.lg,
  } as Record<string, number>,
  /** Default stroke for icons in UI */
  strokeWidth: iconStrokeWidth.default,
  /** Gap between icon and adjacent text */
  textGap: 6, // px
} as const;
