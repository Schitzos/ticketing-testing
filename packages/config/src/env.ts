/**
 * RBT-004 — Environment config (composition-root input).
 *
 * Reads the `EXPO_PUBLIC_*` toggles that decide which adapter set the composition root binds.
 * Only `EXPO_PUBLIC_*` vars are exposed to the client bundle (AGENTS.md / RULES.md D7.5) —
 * NEVER read a secret here. `process.env` is the one framework-ish touch allowed in the
 * config package (the composition root is the outermost layer); the domain never reads env.
 */

export type AppEnv = 'development' | 'production';

export interface AppConfig {
  /** Backend base URL (real adapters use it; mock adapters ignore it). */
  apiBaseUrl: string;
  /** When true, the root binds the MOCK adapter set; when false, the real BE set. */
  useMocks: boolean;
  env: AppEnv;
}

function readBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') return fallback;
  return value === 'true' || value === '1';
}

/**
 * Resolve the app config from an env source (defaults to `process.env`). Injectable so the
 * composition root and its tests can pass an explicit env without mutating the global.
 */
export function resolveConfig(
  source: Record<string, string | undefined> = typeof process !== 'undefined'
    ? process.env
    : {},
): AppConfig {
  const env = source.EXPO_PUBLIC_ENV === 'production' ? 'production' : 'development';
  return {
    apiBaseUrl: source.EXPO_PUBLIC_API_BASE_URL ?? '',
    // Default: mocks ON in development, OFF in production (safe default per D10.5).
    useMocks: readBool(source.EXPO_PUBLIC_USE_MOCKS, env === 'development'),
    env,
  };
}
