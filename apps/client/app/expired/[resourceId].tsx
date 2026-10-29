import { useLocalSearchParams } from "expo-router";
import { PlaceholderScreen } from "../../components/screens/PlaceholderScreen";

/**
 * `/expired/[resourceId]` — Expired / failed (reason + recovery path).
 * NOINDEX per AGENTS.md (transactional recovery state). Real UI lands in E7 (RBT-064).
 */
export default function ExpiredRoute() {
  const { resourceId } = useLocalSearchParams<{ resourceId: string }>();
  return (
    <PlaceholderScreen
      title="Expired"
      route="/expired/[resourceId]"
      params={{ resourceId }}
      noindex
    />
  );
}
