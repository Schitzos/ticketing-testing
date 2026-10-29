/**
 * Typography tokens (DESIGN-SYSTEM.md §2).
 * Family: Plus Jakarta Sans (with a platform-neutral system fallback stack).
 * Scale: display/h1/h2/h3/body/caption/mono. Weights: 400/500/600/700.
 *
 * Values are unitless numbers (RN `fontSize`/`lineHeight` are density-independent
 * points). `fontWeight` is the RN-accepted string form.
 */
export const fontFamily = {
  base: "Plus Jakarta Sans",
  /** RN Web fallback chain; native resolves the loaded font or system default */
  fallback: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const;

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export interface TypeStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: (typeof fontWeight)[keyof typeof fontWeight];
  letterSpacing?: number;
}

export const typography = {
  display: { fontSize: 44, lineHeight: 48, fontWeight: fontWeight.bold, letterSpacing: -1 },
  h1: { fontSize: 32, lineHeight: 38, fontWeight: fontWeight.bold, letterSpacing: -0.5 },
  h2: { fontSize: 24, lineHeight: 30, fontWeight: fontWeight.semibold, letterSpacing: -0.3 },
  h3: { fontSize: 20, lineHeight: 26, fontWeight: fontWeight.semibold },
  body: { fontSize: 15, lineHeight: 22, fontWeight: fontWeight.regular },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: fontWeight.medium, letterSpacing: 0.2 },
  mono: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.medium },
} as const satisfies Record<string, TypeStyle>;

export type Typography = typeof typography;
