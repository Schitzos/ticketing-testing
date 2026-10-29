/**
 * RBT-004 — Mock NotificationPort adapter.
 *
 * Implements the SAME `NotificationPort` the native (`expo-notifications`) and web
 * (service-worker push) adapters will (Liskov). Records registrations in memory so wiring
 * and flow tests can assert against it without a real platform permission prompt.
 */
import type {
  NotificationPermission,
  NotificationPort,
  PushSubscription,
} from '@rbt/domain';

export class MockNotificationPort implements NotificationPort {
  readonly subscriptions = new Map<string, PushSubscription>();

  requestPermission(): Promise<NotificationPermission> {
    return Promise.resolve('granted');
  }

  registerSubscription(sub: PushSubscription): Promise<void> {
    this.subscriptions.set(sub.eventId, sub);
    return Promise.resolve();
  }

  removeSubscription(eventId: string): Promise<void> {
    this.subscriptions.delete(eventId);
    return Promise.resolve();
  }
}
