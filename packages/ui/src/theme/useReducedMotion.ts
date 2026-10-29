import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Reads the OS "reduce motion" accessibility setting and keeps it live.
 *
 * Works on native (iOS/Android) and RN Web (maps to `prefers-reduced-motion`).
 * The ThemeProvider calls this once and exposes the value through the theme
 * context so every surface can honor it (DESIGN-SYSTEM.md §5). Motion is the
 * only thing disabled — timers and state updates keep running.
 *
 * @param initial optional seed (used by tests / SSR); defaults to false.
 */
export function useReducedMotion(initial = false): boolean {
  const [reduced, setReduced] = useState<boolean>(initial);

  useEffect(() => {
    let mounted = true;

    // Initial read — async on every platform.
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(value);
      })
      .catch(() => {
        /* setting unavailable → keep default (motion enabled) */
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (value: boolean) => {
        if (mounted) setReduced(value);
      },
    );

    return () => {
      mounted = false;
      // RN >= 0.65 returns an EmitterSubscription with .remove()
      subscription?.remove?.();
    };
  }, []);

  return reduced;
}
