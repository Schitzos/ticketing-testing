import { usePathname } from "expo-router";
import { PlaceholderScreen } from "../components/screens/PlaceholderScreen";

/**
 * `+not-found` — catch-all for unmatched routes.
 * NOINDEX (unknown / non-canonical URL). Recovery CTA lands with the real UI later.
 */
export default function NotFoundRoute() {
  const pathname = usePathname();
  return (
    <PlaceholderScreen
      title="Not found"
      route="+not-found"
      params={{ pathname }}
      noindex
    />
  );
}
