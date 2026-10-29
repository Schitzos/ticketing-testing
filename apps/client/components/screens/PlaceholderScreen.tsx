import { View, Text, useColorScheme } from "react-native";
import Head from "expo-router/head";
import { tokens } from "@rbt/design-tokens";

/**
 * RBT-002 — shared placeholder screen for the route tree.
 *
 * Presentation ONLY. It renders a title + a short note so each route is
 * visibly reachable; the real feature UI lands in later stories
 * (events E4, queue E5, checkout E6, payment E7, ticket E8). It takes no
 * data from any repository/store and performs no fetch/storage — the route
 * files that use it stay routing-only (AC2).
 *
 * `noindex` drives an SEO robots meta on the web target: transactional /
 * personal routes (waiting/checkout/payment/success/expired) must NOT be
 * indexed, while the public catalog routes (/, /browse, /events/[id]) may be.
 * Full static/SSR SEO output (web.output:"static" + the single→static switch)
 * is RBT-033; this component only sets the per-route robots directive, which
 * is the routing-layer responsibility.
 */
export type PlaceholderScreenProps = {
  /** Human-readable screen name, e.g. "Waiting room". */
  title: string;
  /** The canonical route pattern this screen serves, e.g. "/waiting/[eventId]". */
  route: string;
  /** Resolved dynamic segment value(s) to echo back, for visual confirmation. */
  params?: Record<string, string | undefined>;
  /** When true, emit `robots: noindex, nofollow` (transactional/personal routes). */
  noindex?: boolean;
};

export function PlaceholderScreen({
  title,
  route,
  params,
  noindex = false,
}: Readonly<PlaceholderScreenProps>) {
  const scheme = useColorScheme() ?? "light";
  const c = tokens.color[scheme];

  const paramEntries = Object.entries(params ?? {}).filter(
    ([, value]) => value != null,
  );

  return (
    <>
      <Head>
        <title>{`${title} · Rusuh Booking`}</title>
        {noindex ? (
          <meta name="robots" content="noindex, nofollow" />
        ) : (
          <meta name="robots" content="index, follow" />
        )}
      </Head>
      <View
        accessibilityRole="summary"
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: c.bg,
          padding: tokens.space.xl,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: "800", color: c.text }}>
          {title}
        </Text>
        <Text
          style={{
            marginTop: tokens.space.sm,
            fontSize: 14,
            color: c.brand,
            fontWeight: "700",
          }}
        >
          {route}
        </Text>
        {paramEntries.length > 0 ? (
          <Text
            style={{
              marginTop: tokens.space.md,
              fontSize: 13,
              color: c.text,
              opacity: 0.7,
            }}
          >
            {paramEntries.map(([k, v]) => `${k}: ${v}`).join(" · ")}
          </Text>
        ) : null}
        <Text
          style={{
            marginTop: tokens.space.lg,
            fontSize: 12,
            color: c.text,
            opacity: 0.5,
          }}
        >
          Placeholder — real UI lands in a later feature story.
        </Text>
      </View>
    </>
  );
}
