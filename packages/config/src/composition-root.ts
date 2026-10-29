/**
 * RBT-004 — Composition root.
 *
 * The ONE place concrete adapters are bound to the five domain ports (RULES.md SOLID-I /
 * D2.1 / ARCHITECTURE §2.1). Use cases depend on the port interfaces; nothing else in the
 * app constructs an adapter. Swapping mock ↔ real BE is a SINGLE decision here, driven by
 * the `EXPO_PUBLIC_USE_MOCKS` toggle (D10.5) — no UI / domain / use-case change.
 *
 * The config package is the outermost layer, so it is allowed to import the platform
 * adapters and read env. The dependency rule still holds: adapters implement domain ports,
 * and the ports point inward.
 */
import type { AppPorts, Clock } from '@rbt/domain';
import {
  MockFileSharePort,
  MockNotificationPort,
  MockPaymentRepository,
  MockQueueRepository,
  SystemClock,
} from '@rbt/platform';

import { resolveConfig, type AppConfig } from './env';

/**
 * Build the mock adapter set. Bound in development / when `EXPO_PUBLIC_USE_MOCKS` is true.
 * Every mock implements the SAME port interface its future BE/native sibling will (Liskov).
 */
function buildMockPorts(clock: Clock): AppPorts {
  return {
    clock,
    queueRepository: new MockQueueRepository(clock),
    paymentRepository: new MockPaymentRepository(clock),
    notificationPort: new MockNotificationPort(),
    fileSharePort: new MockFileSharePort(),
  };
}

/**
 * Build the real BE/native adapter set. The real REST/Expo/web adapters land in later
 * stories (RBT-010 api-client, RBT-065 payment, RBT-072/073 notifications, RBT-071 file
 * share) and are bound HERE when `EXPO_PUBLIC_USE_MOCKS` is false — no caller changes.
 *
 * Until those adapters exist this throws a clear, single-line error rather than silently
 * falling back to mocks in production (which would mask a mis-set toggle).
 */
function buildRealPorts(_config: AppConfig, _clock: Clock): AppPorts {
  throw new Error(
    'Real BE/native adapters are not wired yet (RBT-010/065/071/072/073). ' +
      'Set EXPO_PUBLIC_USE_MOCKS=true until they land, or bind them in buildRealPorts().',
  );
}

/**
 * Compose the application's ports from config. This is the composition root — call it ONCE
 * at app startup (the provider layer passes the result down). The clock is injectable so the
 * root and its tests can substitute a fake clock.
 */
export function composePorts(
  config: AppConfig = resolveConfig(),
  clock: Clock = new SystemClock(),
): AppPorts {
  return config.useMocks ? buildMockPorts(clock) : buildRealPorts(config, clock);
}
