/**
 * RBT-004 — Ports barrel.
 *
 * The inward-facing abstractions the domain/application layers depend on. Outer adapters
 * (platform, api-client) implement these; the composition root (@rbt/config) binds the
 * concretes. Nothing here imports React / RN / Expo / browser / native (RULES.md D2.1).
 */
import type { Clock } from './clock';
import type { FileSharePort } from './file-share-port';
import type { NotificationPort } from './notification-port';
import type { PaymentRepository } from './payment-repository';
import type { QueueRepository } from './queue-repository';

export * from './dto';
export * from './clock';
export * from './queue-repository';
export * from './payment-repository';
export * from './notification-port';
export * from './file-share-port';

/**
 * The complete set of ports the composition root binds. Use cases receive the individual
 * ports they need (Interface Segregation) — this aggregate exists only so the root has one
 * typed container to assemble and hand to the provider layer.
 */
export interface AppPorts {
  clock: Clock;
  queueRepository: QueueRepository;
  paymentRepository: PaymentRepository;
  notificationPort: NotificationPort;
  fileSharePort: FileSharePort;
}
