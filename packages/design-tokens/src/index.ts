/**
 * @rbt/design-tokens — platform-neutral design tokens for RN + RN Web.
 *
 * Two surfaces are exported:
 *  1. The ORIGINAL seed `tokens` object (back-compat — existing keys kept working).
 *  2. The full token system (DESIGN-SYSTEM.md §2): colors(light+dark), typography,
 *     spacing, radius, motion, elevation, z-index, and resolved `lightTheme`/`darkTheme`.
 *
 * All color hex is PORTED from the V5 prototype (`.genesis/prototype/Final/*`), not invented.
 */

import { lightColors, darkColors } from "./colors";
import { spacing } from "./spacing";
import { radius } from "./radius";

// ── Full token system (new) ────────────────────────────────────────────────
export { palette } from "./palette";
export type { Palette } from "./palette";

export { lightColors, darkColors } from "./colors";
export type { ColorTokens } from "./colors";

export { spacing } from "./spacing";
export type { Spacing } from "./spacing";

export { radius } from "./radius";
export type { Radius } from "./radius";

export { typography, fontFamily, fontWeight } from "./typography";
export type { Typography, TypeStyle } from "./typography";

export { motion, durationFor } from "./motion";
export type { Motion } from "./motion";

export { elevation, zIndex } from "./elevation";
export type { Elevation, ElevationToken, ZIndex } from "./elevation";

export { lightTheme, darkTheme, themes, getTheme } from "./theme";
export type { Theme, ThemeMode } from "./theme";

// ── Back-compat seed (unchanged keys) ────────────────────────────────────────
// Original shape kept so existing imports (`tokens.color.light.bg`, `tokens.space.md`,
// `tokens.radius.sm`) continue to resolve. Values are the same primitives the full
// system uses, re-expressed in the seed's flat form.
export const tokens = {
  color: {
    light: {
      bg: lightColors.surface.base,
      text: lightColors.text.primary,
      brand: lightColors.brand.primary,
    },
    dark: {
      bg: darkColors.surface.base,
      text: darkColors.text.primary,
      brand: darkColors.brand.primary,
    },
  },
  // seed scale: xs/sm/md/lg/xl -> 4,8,16,24,32 (unchanged values)
  space: {
    xs: spacing[1],
    sm: spacing[2],
    md: spacing[4],
    lg: spacing[6],
    xl: spacing[7],
  },
  radius: {
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    pill: radius.pill,
  },
} as const;

export type Tokens = typeof tokens;
