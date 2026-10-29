import { View, Text, Platform, useColorScheme } from "react-native";
import { tokens } from "@rbt/design-tokens";
import { DOMAIN_PACKAGE } from "@rbt/domain";

export default function Home() {
  const scheme = useColorScheme() ?? "light";
  const c = tokens.color[scheme];

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.bg,
        padding: tokens.space.xl,
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "800", color: c.text }}>
        Rusuh Booking 👋
      </Text>
      <Text style={{ marginTop: tokens.space.sm, fontSize: 16, color: c.brand, fontWeight: "700" }}>
        Hello World — Expo Universal skeleton
      </Text>
      <Text style={{ marginTop: tokens.space.lg, fontSize: 13, color: c.text, opacity: 0.6 }}>
        Running on {Platform.OS} · domain pkg: {DOMAIN_PACKAGE}
      </Text>
    </View>
  );
}
