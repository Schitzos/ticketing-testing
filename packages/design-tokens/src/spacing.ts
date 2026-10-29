/**
 * Spacing — 4-pt base scale (DESIGN-SYSTEM.md §2).
 * `space.1..10` = 4,8,12,16,20,24,32,40,48,64.
 *
 * The named aliases (xs/sm/md/lg/xl) are preserved for backward compatibility
 * with the original seed in index.ts; they point at the same scale values.
 */
export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
} as const;

export type Spacing = typeof spacing;
