export const CONFIG_PACKAGE = "@rbt/config" as const;

// RBT-004 — composition root + env toggle (the single DI binding point).
export * from "./env";
export * from "./composition-root";
