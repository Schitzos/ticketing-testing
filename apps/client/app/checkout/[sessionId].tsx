import { useLocalSearchParams } from "expo-router";
import { PlaceholderScreen } from "../../components/screens/PlaceholderScreen";

/**
 * `/checkout/[sessionId]` — Checkout / booking hold (buyer, NIK, attendees, timer).
 * NOINDEX per AGENTS.md (transactional / personal data). Real UI lands in E6.
 */
export default function CheckoutRoute() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  return (
    <PlaceholderScreen
      title="Checkout"
      route="/checkout/[sessionId]"
      params={{ sessionId }}
      noindex
    />
  );
}
