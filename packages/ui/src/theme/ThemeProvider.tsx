import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import { getTheme, type ThemeMode } from "@rbt/design-tokens";
import { ThemeContext, type ThemeContextValue } from "./ThemeContext";
import { useReducedMotion } from "./useReducedMotion";

export interface ThemeProviderProps {
  children: ReactNode;
  /**
   * Force a mode. When omitted, the provider follows the OS color scheme
   * (`useColorScheme`) and updates live as it changes.
   */
  mode?: ThemeMode;
  /** Test/SSR seed for the reduced-motion flag. */
  initialReducedMotion?: boolean;
}

/**
 * ThemeProvider — exposes the active theme + live reduced-motion flag to the tree.
 *
 * Mode resolution:
 *  - explicit `mode` prop wins (controlled);
 *  - otherwise follows the OS color scheme, defaulting to light when unknown.
 *
 * Every surface reads bg+text PAIRS off `theme.color.*` (DESIGN-SYSTEM.md §2) —
 * no component hard-codes a literal, so dark mode can never be half-applied.
 */
export function ThemeProvider({
  children,
  mode: controlledMode,
  initialReducedMotion = false,
}: ThemeProviderProps): React.JSX.Element {
  const osScheme = useColorScheme();
  const [internalMode, setInternalMode] = useState<ThemeMode>(
    controlledMode ?? (osScheme === "dark" ? "dark" : "light"),
  );

  // Keep internal mode in sync with the OS scheme while uncontrolled.
  useEffect(() => {
    if (controlledMode == null && osScheme != null) {
      setInternalMode(osScheme === "dark" ? "dark" : "light");
    }
  }, [controlledMode, osScheme]);

  const mode: ThemeMode = controlledMode ?? internalMode;
  const reducedMotion = useReducedMotion(initialReducedMotion);

  const setMode = useCallback((next: ThemeMode) => {
    setInternalMode(next);
  }, []);

  const toggleMode = useCallback(() => {
    setInternalMode((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: getTheme(mode),
      mode,
      reducedMotion,
      setMode,
      toggleMode,
    }),
    [mode, reducedMotion, setMode, toggleMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
