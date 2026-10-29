/**
 * Radius tokens (DESIGN-SYSTEM.md §2): sm/md/lg/pill.
 * Values ported from V5 prototype (card 22px lg, inputs 12px md, pill 999).
 * The seed used sm:8 / md:14 / lg:22 / pill:999 — preserved exactly.
 */
export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export type Radius = typeof radius;
