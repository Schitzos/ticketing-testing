import { useLocalSearchParams } from "expo-router";
import { PlaceholderScreen } from "../../components/screens/PlaceholderScreen";

/**
 * `/waiting/[eventId]` — Virtual waiting room (queue position, estimate).
 * NOINDEX per AGENTS.md (transactional / volatile state). Real UI lands in E5.
 */
export default function WaitingRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return (
    <PlaceholderScreen
      title="Waiting room"
      route="/waiting/[eventId]"
      params={{ eventId }}
      noindex
    />
  );
}
