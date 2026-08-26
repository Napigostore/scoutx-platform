/**
 * ScoutX Motion & Animation System
 *
 * Duration & easing tokens for consistent animation language.
 *
 * Principles:
 * ─────────────────
 * 1. Fast – UI feedback (hover, press, focus) completes within 150 ms
 * 2. Responsive – Navigation, reveal, collapse within 200–300 ms
 * 3. Expressive – Hero, welcome, showcase within 400–800 ms
 * 4. Accessibility – Respects prefers-reduced-motion via CSS
 */

/* ─── Duration Tokens ─── */

export const duration = {
  /** Instant – micro-interactions, ripple, button press */
  instant: 100,
  /** Fast – hover, focus, active states */
  fast: 150,
  /** Normal – standard transitions, color changes */
  normal: 200,
  /** Slow – panel open/close, accordion */
  slow: 300,
  /** Expressive – entrance animations, hero reveals */
  expressive: 400,
  /** Deliberate – page transitions, modal curtains */
  deliberate: 600,
} as const;

/* ─── Easing Curves ─── */

export const easing = {
  /** Default – standard deceleration */
  default: "cubic-bezier(0.25, 0.1, 0.25, 1)",
  /** In – accelerate into view */
  in: "cubic-bezier(0.4, 0, 1, 1)",
  /** Out – decelerate out of view */
  out: "cubic-bezier(0, 0, 0.2, 1)",
  /** In-Out – smooth both directions */
  "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
  /** Spring-like – subtle bounce for emphasis */
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  /** Bouncy – pronounced overshoot for playful UI */
  bounce: "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
} as const;

/* ─── Named Animation Presets ─── */

export const animation = {
  /** Fade in a layer (modal backdrop, overlay) */
  "fade-in": {
    duration: duration.normal,
    easing: easing.out,
    fill: "forwards" as const,
    keyframes: [{ opacity: 0 }, { opacity: 1 }],
  },
  /** Fade out */
  "fade-out": {
    duration: duration.fast,
    easing: easing.in,
    fill: "forwards" as const,
    keyframes: [{ opacity: 1 }, { opacity: 0 }],
  },
  /** Slide up + fade in (sheet, drawer) */
  "slide-up": {
    duration: duration.slow,
    easing: easing["in-out"],
    fill: "forwards" as const,
    keyframes: [
      { opacity: 0, transform: "translateY(12px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
  },
  /** Slide down (dropdown, menu) */
  "slide-down": {
    duration: duration.slow,
    easing: easing["in-out"],
    fill: "forwards" as const,
    keyframes: [
      { opacity: 0, transform: "translateY(-8px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
  },
  /** Scale in (modal, dialog) */
  "scale-in": {
    duration: duration.normal,
    easing: easing.out,
    fill: "forwards" as const,
    keyframes: [
      { opacity: 0, transform: "scale(0.95)" },
      { opacity: 1, transform: "scale(1)" },
    ],
  },
  /** Shake (error state, validation) */
  shake: {
    duration: duration.normal,
    easing: easing.default,
    keyframes: [
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(-2px)" },
      { transform: "translateX(2px)" },
      { transform: "translateX(0)" },
    ],
  },
  /** Skeleton pulse (loading) */
  pulse: {
    duration: duration.deliberate,
    easing: easing["in-out"],
    iteration: "infinite" as const,
    keyframes: [{ opacity: 0.5 }, { opacity: 1 }, { opacity: 0.5 }],
  },
  /** Spinner rotation */
  spin: {
    duration: duration.expressive,
    easing: easing.default,
    iteration: "infinite" as const,
    keyframes: [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }],
  },
} as const;

/* ─── Transition Presets for tailwind/emotion ─── */

export const transition = {
  default: `${duration.fast}ms ${easing.default}`,
  smooth: `${duration.normal}ms ${easing["in-out"]}`,
  spring: `${duration.slow}ms ${easing.spring}`,
  slow: `${duration.slow}ms ${easing.default}`,
} as const;
