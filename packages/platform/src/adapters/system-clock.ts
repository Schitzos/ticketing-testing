/**
 * RBT-004 — System clock adapter.
 *
 * The real `Clock` binding: device epoch time via `Date.now()`. This is an outer adapter
 * (platform layer); the domain only ever sees the `Clock` interface. `ServerClock`
 * (RBT-011) wraps this with a server-time offset.
 */
import type { Clock } from '@rbt/domain';

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}
