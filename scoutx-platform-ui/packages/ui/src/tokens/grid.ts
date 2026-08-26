/**
 * ScoutX Layout Grid System
 *
 * Responsive grid based on CSS custom properties.
 * Follows mobile-first approach with 4 breakpoints.
 */

/* ─── Breakpoints ─── */

export const breakpoint = {
  /** Mobile – default */
  sm: 640,
  /** Tablet */
  md: 768,
  /** Desktop */
  lg: 1024,
  /** Wide desktop */
  xl: 1280,
  /** Ultra-wide */
  "2xl": 1536,
} as const;

export const breakpointLabels = Object.keys(breakpoint) as Array<keyof typeof breakpoint>;

/* ─── Content Widths ─── */

export const contentWidth = {
  /** Narrow reading width – forms, single column */
  narrow: "480px",
  /** Standard content width – blog, docs */
  standard: "720px",
  /** Wide content – dashboards, listings */
  wide: "960px",
  /** Full content – landing sections, full-bleed */
  full: "1120px",
  /** Max width – outer wrapper constraint */
  max: "1280px",
} as const;

/* ─── Column Grid Presets ─── */

export const gridColumns = {
  /** 2-col grid – tablet up */
  2: {
    template: "repeat(2, 1fr)",
    gap: "24px",
    minWidth: "320px",
  },
  /** 3-col grid – desktop */
  3: {
    template: "repeat(3, 1fr)",
    gap: "24px",
    minWidth: "280px",
  },
  /** 4-col grid – wide screens */
  4: {
    template: "repeat(4, 1fr)",
    gap: "24px",
    minWidth: "240px",
  },
  /** Auto-fill with min column */
  auto: {
    template: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "24px",
  },
} as const;

/* ─── Page Shell ─── */

export const pageShell = {
  /** Inner wrapper for page content sections */
  sectionPadding: "var(--page-section-padding, 80px 0)",
  /** Main content area padding */
  mainPadding: "var(--page-main-padding, 48px 0)",
  /** Outer vertical padding for landing hero */
  heroPadding: "var(--page-hero-padding, 112px 0 80px)",
  /** Max width wrapper class equivalent */
  containerWidth: "min(1120px, calc(100% - 2rem))",
  /** Margin auto for centering */
  containerMargin: "0 auto",
} as const;

/* ─── Z-Index Scale ─── */

export const zIndex = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  nav: 200,
  modal: 300,
  overlay: 400,
  toast: 500,
  tooltip: 600,
} as const;
