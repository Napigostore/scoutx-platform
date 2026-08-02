/**
 * ScoutX Component Guidelines
 *
 * Architectural rules for building UI components.
 *
 * Principles:
 * ─────────────────────────────────
 *
 * 1. Single Responsibility – Each component does one thing well.
 * 2. Composition over Configuration – Prefer children/slots over
 *    boolean props that toggle internal structures.
 * 3. Accessible by Default – All interactive elements must be
 *    keyboard-navigable and screen-reader friendly.
 * 4. Theme-Agnostic – Components reference CSS custom properties
 *    (var(--scoutx-*)) and never hardcode color values.
 * 5. Polymorphic – Support asChild (Slot) pattern for render
 *    flexibility when appropriate.
 * 6. Ref Forwarding – All primitives expose ref via forwardRef.
 */

/* ─── Component API Conventions ─── */

export const componentApi = {
  /** Naming: PascalCase for component, camelCase for props */
  naming: {
    component: "PascalCase",
    props: "camelCase", // except HTML-native like `aria-*`
    files: "kebab-case",
  },

  /** Standard props every component receives */
  standardProps: ["className", "style", "id", "data-*", "aria-*"] as readonly string[],

  /** Required optionality ordering */
  requiredOrder: [
    "children / required content",
    "variant / size / visual modifiers",
    "event handlers (onClick, onChange, etc.)",
    "className (last for override)",
  ] as readonly string[],
} as const;

/* ─── Accessibility Requirements ─── */

export const a11yRules = {
  /** All interactive elements need focus-visible styles */
  focusVisible: "Use outline or ring via focus-visible: selector",

  /** Labels for form controls */
  formLabels: "Every input/select/textarea must have a visible Label",

  /** Icon-only buttons need aria-label */
  iconButtonAriaLabel: "aria-label describing the action",

  /** Loading states must preserve layout */
  loadingPreservation: "Use opacity + pointer-events, not display:none",

  /** Color is not the only way to convey meaning */
  colorIndependent: "Combine icons/text with color for status indicators",

  /** Touch targets minimum */
  touchTarget: "Minimum 44×44 px for interactive elements on mobile",
} as const;

/* ─── Component Checklist ─── */

export const componentChecklist = {
  required: [
    "Uses CSS custom properties (var(--scoutx-*))",
    "Supports className prop for overrides",
    "Forwards ref via forwardRef",
    "Has proper displayName",
    "Handles disabled state",
    "Has focus-visible styles",
    "Supports reduced-motion",
    "Has TypeScript strict types",
  ] as readonly string[],

  recommended: [
    "Supports asChild (Slot) polymorphism",
    "Exports VariantProps type",
    "Has hover + active visual states",
    "Includes transition on state changes",
    "Has loading/skeleton placeholder",
    "Error/empty states if data-driven",
  ] as readonly string[],
} as const;

/* ─── Reusable Pattern: Form Field ─── */

export const formFieldPattern = {
  structure: [
    "<div> // field wrapper with gap",
    "  <Label htmlFor={id} />",
    "  <Input/Select/Textarea id={id} />",
    "  {error && <p role='alert' />}",
    "  {hint && <p className='text-muted' />}",
    "</div>",
  ] as readonly string[],
  /** Error message pattern */
  errorMessage: {
    role: "alert",
    font: "text-sm",
    color: "var(--scoutx-destructive)",
    margin: "mt-1.5",
  },
} as const;

/* ─── Reusable Pattern: Card ─── */

export const cardPattern = {
  structure: [
    "<div> // Card wrapper (border, rounded, shadow)",
    "  <CardHeader>",
    "    <CardTitle />",
    "    <CardDescription />",
    "  </CardHeader>",
    "  <CardContent />",
    "  <CardFooter />",
    "</div>",
  ] as readonly string[],
  padding: "24px (p-6)",
  borderRadius: "var(--scoutx-radius-xl)",
} as const;

/* ─── Reusable Pattern: Data Table Row ─── */

export const dataRowPattern = {
  height: {
    compact: "40px",
    standard: "48px",
    relaxed: "56px",
  },
  hoverHighlight: "background: var(--scoutx-muted)",
  borderSeparator: "1px solid var(--scoutx-border)",
} as const;
