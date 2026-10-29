import { useLocalSearchParams } from "expo-router";
import { PlaceholderScreen } from "../../components/screens/PlaceholderScreen";

/**
 * `/events/[eventId]` — Event detail (categories, availability, queue CTA).
 * PUBLIC / SEO-indexable per AGENTS.md. Real UI lands in RBT-032 (E4).
 */
export default function EventDetailRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return (
    <PlaceholderScreen
      title="Event detail"
      route="/events/[eventId]"
      params={{ eventId }}
    />
  );
}
