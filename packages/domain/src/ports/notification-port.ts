/**
 * RBT-004 — NotificationPort.
 *
 * The shared notification capability behind one port. Native (`expo-notifications`) and web
 * (service-worker push) adapters implement the SAME interface so the domain notification
 * flow does not change between platforms (ARCHITECTURE §6.1). Remote DELIVERY stays a BE
 * concern — the FE only registers/removes a push subscription and requests permission.
 *
 * Framework-free: permission results and tokens are plain values; no Expo / browser / SW
 * types leak through the port.
 */
import type { PushSubscription } from './dto';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface NotificationPort {
  /** Ask the platform for notification permission. */
  requestPermission(): Promise<NotificationPermission>;

  /** Register this device/browser for push on an event (BE delivers). */
  registerSubscription(sub: PushSubscription): Promise<void>;

  /** Remove the push subscription for an event. */
  removeSubscription(eventId: string): Promise<void>;
}
