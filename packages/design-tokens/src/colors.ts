import { palette } from "./palette";

/**
 * Color tokens — semantic groups per DESIGN-SYSTEM.md §2, resolved per theme mode.
 *
 * Theming rule (DESIGN-SYSTEM.md §2): a background is ALWAYS paired with its text
 * color — never a fixed literal in a component. Each mode below provides the full
 * bg+text pairs so dark mode cannot be half-set.
 */
export interface ColorTokens {
  brand: {
    primary: string;
    primaryPressed: string;
    onPrimary: string;
  };
  surface: {
    base: string;
    raised: string;
    /** glassmorphism overlay (DESIGN-SYSTEM.md §2) */
    glass: string;
    border: string;
  };
  text: {
    primary: string;
    secondary: string;
    onBrand: string;
    disabled: string;
  };
  status: {
    available: string;
    soldOut: string;
    warning: string;
    danger: string;
    info: string;
  };
  /** waiting-room queue zones (DESIGN-SYSTEM.md §2; ported from waiting.html) */
  zone: {
    guaranteed: string;
    possible: string;
    notEnough: string;
  };
}

export const lightColors: ColorTokens = {
  brand: {
    primary: palette.red,
    primaryPressed: palette.redDeep,
    onPrimary: palette.white,
  },
  surface: {
    base: palette.paper,
    raised: palette.card,
    glass: "rgba(255,255,255,0.72)",
    border: "rgba(10,10,12,0.08)",
  },
  text: {
    primary: palette.ink,
    secondary: palette.muted,
    onBrand: palette.white,
    disabled: "rgba(10,10,12,0.38)",
  },
  status: {
    available: palette.ok,
    soldOut: palette.ink,
    warning: palette.warn,
    danger: palette.danger,
    info: palette.info,
  },
  zone: {
    guaranteed: palette.ok,
    possible: palette.amber,
    notEnough: palette.red,
  },
};

export const darkColors: ColorTokens = {
  brand: {
    primary: palette.ember,
    primaryPressed: palette.red,
    onPrimary: palette.white,
  },
  surface: {
    base: palette.ink,
    raised: palette.ink2,
    glass: "rgba(18,18,23,0.72)",
    border: "rgba(255,255,255,0.10)",
  },
  text: {
    primary: palette.paper,
    secondary: "rgba(255,255,255,0.62)",
    onBrand: palette.white,
    disabled: "rgba(255,255,255,0.38)",
  },
  status: {
    available: palette.okBright,
    soldOut: palette.muted,
    warning: palette.amber,
    danger: palette.danger,
    info: palette.info,
  },
  zone: {
    guaranteed: palette.okBright,
    possible: palette.amber,
    notEnough: palette.red,
  },
};
