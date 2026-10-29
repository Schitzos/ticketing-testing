/**
 * Motion tokens (DESIGN-SYSTEM.md §2, §5).
 * Durations fast/base/slow (ms) + the V5 standard easing curve.
 * ALL motion respects reduced-motion: consumers read `theme.reducedMotion`
 * (wired by the ThemeProvider from the OS setting) and use `durationFor()` /
 * zero duration when it is true. Timers/state updates MUST keep running even
 * when motion is disabled (DESIGN-SYSTEM.md §5).
 */
export const motion = {
  duration: {
    fast: 150,
    base: 250,
    slow: 400,
  },
  /** cubic-bezier control points from V5 `--ease` */
  easing: {
    standard: [0.32, 0.72, 0, 1] as const,
    /** CSS string form for RN Web transitions */
    standardCss: "cubic-bezier(0.32, 0.72, 0, 1)",
  },
} as const;

export type Motion = typeof motion;

/**
 * Resolve an animation duration honoring reduced-motion.
 * Returns 0 when reduced motion is requested, so non-essential motion
 * collapses to an instant state change without blocking logic.
 */
export function durationFor(
  base: number,
  reducedMotion: boolean,
): number {
  return reducedMotion ? 0 : base;
}
