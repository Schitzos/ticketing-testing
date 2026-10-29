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

  async requestPermission(): Promise<NotificationPermission> {
    return 'granted';
  }

  async registerSubscription(sub: PushSubscription): Promise<void> {
    this.subscriptions.set(sub.eventId, sub);
  }

  async removeSubscription(eventId: string): Promise<void> {
    this.subscriptions.delete(eventId);
  }
}
