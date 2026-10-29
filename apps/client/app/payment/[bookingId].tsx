import { useLocalSearchParams } from "expo-router";
import { PlaceholderScreen } from "../../components/screens/PlaceholderScreen";

/**
 * `/payment/[bookingId]` — Payment page → Midtrans SNAP handoff.
 * NOINDEX per AGENTS.md (transactional / payment state). Real UI lands in E7.
 */
export default function PaymentRoute() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  return (
    <PlaceholderScreen
      title="Payment"
      route="/payment/[bookingId]"
      params={{ bookingId }}
      noindex
    />
  );
}
