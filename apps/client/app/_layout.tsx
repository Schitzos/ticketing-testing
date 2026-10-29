import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

/**
 * RBT-002 — root layout + routing-layer guard.
 *
 * This file is ROUTING CONFIGURATION ONLY (AC2): it declares the navigation
 * stack and screen options. It performs no data fetching, storage access, or
 * business logic — and it MUST NOT force a login (RULES.md D8.5: browse, queue,
 * checkout, payment, and e-ticket all work for a guest). Auth-aware session
 * wiring (optional sign-in) is introduced by RBT-023; any future access guard
 * added here stays a non-blocking routing concern.
 *
 * `screenOptions` is declared once at the layout level (the guard surface) so
 * individual route files stay thin placeholders. `+not-found` is declared so an
 * unknown deep link resolves to a recoverable screen instead of a dead end.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Public / SEO-indexable catalog */}
        <Stack.Screen name="index" />
        <Stack.Screen name="browse" />
        <Stack.Screen name="events/[eventId]" />
        {/* Transactional / noindex flow */}
        <Stack.Screen name="waiting/[eventId]" />
        <Stack.Screen name="checkout/[sessionId]" />
        <Stack.Screen name="payment/[bookingId]" />
        <Stack.Screen name="success/[bookingId]" />
        <Stack.Screen name="expired/[resourceId]" />
        {/* Catch-all recovery */}
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
