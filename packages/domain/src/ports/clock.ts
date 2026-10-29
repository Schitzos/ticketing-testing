/**
 * RBT-004 — Clock port.
 *
 * The one source of "now" injected into the domain. `ServerClock` (RBT-011) wraps this with
 * a server-time offset so every countdown is `max(0, expiresAt − serverNow())` and never
 * trusts the device clock (RULES.md D3.2 / D9.2).
 *
 * Framework-free: the real adapter is `Date.now()`; tests inject a fake clock. Keeping the
 * port here (not `Date.now()` sprinkled through the domain) is what makes timer logic unit-
 * testable and device-clock-independent.
 */
export interface Clock {
  /** Current device epoch time in milliseconds. */
  now(): number;
}
