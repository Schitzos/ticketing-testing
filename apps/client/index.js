import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

// Monorepo: expo-router's _ctx auto app-root detection fails under npm workspaces,
// so provide the context explicitly with a literal string path (Hermes-safe).
export function App() {
  const ctx = require.context("./app");
  return <ExpoRoot context={ctx} />;
}
registerRootComponent(App);
