import { createContext } from "react";
import { lightTheme, type Theme, type ThemeMode } from "@rbt/design-tokens";

/**
 * The value every consumer reads: the resolved active `theme`, the live
 * `reducedMotion` flag (from the OS setting), and a `setMode` to flip modes.
 *
 * Default is the light theme with motion enabled — but components should always
 * read through `useTheme()` so a missing provider throws loudly in dev rather
 * than silently rendering unthemed surfaces.
 */
export interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  /** OS reduce-motion setting, live (DESIGN-SYSTEM.md §5). */
  reducedMotion: boolean;
  setMode: (mode: ThemeMode) => void;
  /** convenience toggle light <-> dark */
  toggleMode: () => void;
}

export const defaultThemeContext: ThemeContextValue = {
  theme: lightTheme,
  mode: "light",
  reducedMotion: false,
  setMode: () => undefined,
  toggleMode: () => undefined,
};

export const ThemeContext =
  createContext<ThemeContextValue | null>(null);
