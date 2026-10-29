import {
  tokens,
  lightTheme,
  darkTheme,
  getTheme,
  lightColors,
  darkColors,
  durationFor,
  spacing,
  radius,
  palette,
} from "../index";

describe("@rbt/design-tokens", () => {
  describe("back-compat seed (existing keys must keep working)", () => {
    it("keeps tokens.color.light/dark bg+text+brand", () => {
      expect(tokens.color.light.bg).toBe("#FBFBFD");
      expect(tokens.color.light.text).toBe("#0A0A0C");
      expect(tokens.color.light.brand).toBe("#EC1C24");
      expect(tokens.color.dark.bg).toBe("#0A0A0C");
      expect(tokens.color.dark.text).toBe("#FBFBFD");
    });

    it("keeps the seed space scale values (xs..xl = 4,8,16,24,32)", () => {
      expect(tokens.space).toEqual({ xs: 4, sm: 8, md: 16, lg: 24, xl: 32 });
    });

    it("keeps the seed radius scale (sm:8 md:14 lg:22 pill:999)", () => {
      expect(tokens.radius).toEqual({ sm: 8, md: 14, lg: 22, pill: 999 });
    });
  });

  describe("brand palette (V5, ported not invented)", () => {
    it("uses brand red #EC1C24 as the light primary", () => {
      expect(palette.red).toBe("#EC1C24");
      expect(lightColors.brand.primary).toBe("#EC1C24");
    });
  });

  describe("theme resolution", () => {
    it("exposes a full set of token groups on each theme", () => {
      for (const theme of [lightTheme, darkTheme]) {
        expect(theme.color).toBeDefined();
        expect(theme.spacing).toBe(spacing);
        expect(theme.radius).toBe(radius);
        expect(theme.typography).toBeDefined();
        expect(theme.motion).toBeDefined();
        expect(theme.elevation).toBeDefined();
        expect(theme.zIndex).toBeDefined();
      }
    });

    it("getTheme returns the matching theme by mode", () => {
      expect(getTheme("light")).toBe(lightTheme);
      expect(getTheme("dark")).toBe(darkTheme);
      expect(getTheme("light").mode).toBe("light");
      expect(getTheme("dark").mode).toBe("dark");
    });
  });

  describe("every surface provides a bg+text PAIR (no half-set dark mode)", () => {
    for (const [name, colors] of [
      ["light", lightColors],
      ["dark", darkColors],
    ] as const) {
      it(`${name}: surface base/raised + text primary/onBrand are all set`, () => {
        expect(colors.surface.base).toBeTruthy();
        expect(colors.surface.raised).toBeTruthy();
        expect(colors.text.primary).toBeTruthy();
        expect(colors.text.onBrand).toBeTruthy();
        expect(colors.brand.onPrimary).toBeTruthy();
      });

      it(`${name}: light and dark text.primary differ (mode actually swaps)`, () => {
        // sanity: the two modes must not resolve to the same ink
        expect(lightColors.text.primary).not.toBe(darkColors.text.primary);
        expect(lightColors.surface.base).not.toBe(darkColors.surface.base);
      });
    }
  });

  describe("motion respects reduced-motion", () => {
    it("durationFor returns the base duration when motion is enabled", () => {
      expect(durationFor(250, false)).toBe(250);
    });

    it("durationFor collapses to 0 when reduced motion is requested", () => {
      expect(durationFor(250, true)).toBe(0);
      expect(durationFor(400, true)).toBe(0);
    });
  });
});
