import { useContext } from "react";
import { durationFor } from "@rbt/design-tokens";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";

/**
 * Access the active theme + live reduced-motion flag.
 * Throws if used outside a <ThemeProvider> so an unthemed surface fails loudly
 * in dev instead of silently rendering with no bg+text pair.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx == null) {
    throw new Error("useTheme must be used within a <ThemeProvider>.");
  }
  return ctx;
}

/**
 * Resolve an animation duration honoring the live reduced-motion setting.
 * Returns 0 when reduced motion is on.
 */
export function useMotionDuration(baseMs: number): number {
  const { reducedMotion } = useTheme();
  return durationFor(baseMs, reducedMotion);
}
