import { ColorTokens, lightColors, darkColors } from "./colors";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { typography, fontFamily, fontWeight } from "./typography";
import { motion } from "./motion";
import { elevation, zIndex } from "./elevation";

export type ThemeMode = "light" | "dark";

/**
 * A fully-resolved theme: mode-specific colors + mode-neutral scales.
 * The ThemeProvider (packages/ui) injects the active Theme plus the live
 * `reducedMotion` flag through context; components never read a raw literal.
 */
export interface Theme {
  mode: ThemeMode;
  color: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
  fontWeight: typeof fontWeight;
  motion: typeof motion;
  elevation: typeof elevation;
  zIndex: typeof zIndex;
}

const sharedScales = {
  spacing,
  radius,
  typography,
  fontFamily,
  fontWeight,
  motion,
  elevation,
  zIndex,
} as const;

export const lightTheme: Theme = {
  mode: "light",
  color: lightColors,
  ...sharedScales,
};

export const darkTheme: Theme = {
  mode: "dark",
  color: darkColors,
  ...sharedScales,
};

export const themes: Record<ThemeMode, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};

export function getTheme(mode: ThemeMode): Theme {
  return themes[mode];
}
