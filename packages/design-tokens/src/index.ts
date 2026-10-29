export const tokens = {
  color: {
    light: { bg: "#FBFBFD", text: "#0A0A0C", brand: "#EC1C24" },
    dark: { bg: "#0A0A0C", text: "#FBFBFD", brand: "#FF5A2D" },
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 14, lg: 22, pill: 999 },
} as const;
export type Tokens = typeof tokens;
