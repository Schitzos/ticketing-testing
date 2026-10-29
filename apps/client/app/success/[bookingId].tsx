import { useLocalSearchParams } from "expo-router";
import { PlaceholderScreen } from "../../components/screens/PlaceholderScreen";

/**
 * `/success/[bookingId]` — Success + e-ticket QR (reads `?orderId=` per ARCHITECTURE §7).
 * NOINDEX per AGENTS.md (personal order / ticket data). Real UI lands in E8.
 */
export default function SuccessRoute() {
  const { bookingId, orderId } = useLocalSearchParams<{
    bookingId: string;
    orderId?: string;
  }>();
  return (
    <PlaceholderScreen
      title="Success"
      route="/success/[bookingId]"
      params={{ bookingId, orderId }}
      noindex
    />
  );
}
