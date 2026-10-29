/**
 * Elevation tokens (DESIGN-SYSTEM.md §2): elevation.0..3.
 * Cross-platform shadow descriptors — web consumers map to box-shadow,
 * native consumers to the RN shadow* props / Android `elevation`.
 * Values approximate the V5 card/overlay shadows.
 */
export interface ElevationToken {
  /** Android */
  elevation: number;
  /** iOS / RN shadow */
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: { width: number; height: number };
}

export const elevation = {
  0: {
    elevation: 0,
    shadowColor: "#0A0A0C",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  1: {
    elevation: 2,
    shadowColor: "#0A0A0C",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  2: {
    elevation: 6,
    shadowColor: "#0A0A0C",
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  3: {
    elevation: 12,
    shadowColor: "#0A0A0C",
    shadowOpacity: 0.3,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 30 },
  },
} as const satisfies Record<number, ElevationToken>;

export type Elevation = typeof elevation;

/** Z-index tokens (DESIGN-SYSTEM.md §2): base/sticky/overlay/modal/toast. */
export const zIndex = {
  base: 0,
  sticky: 60,
  overlay: 90,
  modal: 100,
  toast: 120,
} as const;

export type ZIndex = typeof zIndex;
