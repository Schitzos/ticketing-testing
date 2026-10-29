/**
 * @rbt/ui — shared RN / RN-Web components and the theme runtime.
 * This is the UI layer: it may import React / React Native (DESIGN-SYSTEM.md,
 * RULES.md dependency rule). It MUST NOT import from apps/client.
 */

export { UI_PACKAGE } from "./package-info";

// Theme runtime
export { ThemeProvider } from "./theme/ThemeProvider";
export type { ThemeProviderProps } from "./theme/ThemeProvider";
export { ThemeContext, defaultThemeContext } from "./theme/ThemeContext";
export type { ThemeContextValue } from "./theme/ThemeContext";
export { useTheme, useMotionDuration } from "./theme/useTheme";
export { useReducedMotion } from "./theme/useReducedMotion";

// Re-export the token theme types so consumers can type props without a
// second import from @rbt/design-tokens.
export type { Theme, ThemeMode } from "@rbt/design-tokens";
