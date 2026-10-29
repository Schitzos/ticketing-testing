/**
 * Raw palette — exact hex ported from the V5 prototype SCSS (`.genesis/prototype/Final/*`),
 * NOT invented. These are platform-neutral primitives; semantic/themed tokens map onto them.
 *
 * Sources:
 *  - index.html   :root --red/--red-deep/--ember/--ink/--ink-2/--paper/--card/--muted/--line/--ok/--warn
 *  - waiting.html :root --ok(#4ade80 guaranteed) --amber(#f5b301 possible)
 *  - index.html   badges: info/soon #3b82f6, danger/live #ff3b4e
 */
export const palette = {
  // Brand (ember/red)
  red: "#EC1C24",
  redDeep: "#a8111b",
  ember: "#FF5A2D",
  emberDark: "#FF5A2D",

  // Neutrals — light surfaces & ink
  ink: "#0A0A0C",
  ink2: "#121217",
  paper: "#FBFBFD",
  card: "#FFFFFF",
  muted: "#6B6B76",
  white: "#FFFFFF",

  // Status
  ok: "#17A34A",
  okBright: "#4ADE80",
  warn: "#E8830C",
  amber: "#F5B301",
  info: "#3B82F6",
  danger: "#FF3B4E",
} as const;

export type Palette = typeof palette;
