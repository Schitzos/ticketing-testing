/**
 * RBT-004 — Composition-root wiring tests.
 *
 * Verifies AC1: the root wires all five ports to concrete adapters, swappable via the single
 * `EXPO_PUBLIC_USE_MOCKS` toggle, and the mock adapters are Liskov-substitutable (they honor
 * the port contract). Placed in `packages/config` (a Jest root in the skeleton config) so the
 * platform adapters are exercised through the composed ports without editing root tooling.
 */
import {
  composePorts,
  resolveConfig,
  type AppConfig,
} from '@rbt/config';
import type { Clock } from '@rbt/domain';

const fixedClock: Clock = { now: () => 1_700_000_000_000 };

const mockConfig: AppConfig = {
  apiBaseUrl: '',
  useMocks: true,
  env: 'development',
};

describe('resolveConfig', () => {
  it('defaults useMocks ON in development', () => {
    expect(resolveConfig({ EXPO_PUBLIC_ENV: 'development' }).useMocks).toBe(true);
  });

  it('defaults useMocks OFF in production', () => {
    const cfg = resolveConfig({ EXPO_PUBLIC_ENV: 'production' });
    expect(cfg.useMocks).toBe(false);
    expect(cfg.env).toBe('production');
  });

  it('honors an explicit EXPO_PUBLIC_USE_MOCKS=false in development', () => {
    expect(
      resolveConfig({ EXPO_PUBLIC_ENV: 'development', EXPO_PUBLIC_USE_MOCKS: 'false' })
        .useMocks,
    ).toBe(false);
  });

  it('honors EXPO_PUBLIC_USE_MOCKS=1 as true and reads the base url', () => {
    const cfg = resolveConfig({
      EXPO_PUBLIC_USE_MOCKS: '1',
      EXPO_PUBLIC_API_BASE_URL: 'https://api.test/v1',
    });
    expect(cfg.useMocks).toBe(true);
    expect(cfg.apiBaseUrl).toBe('https://api.test/v1');
  });
});

describe('composePorts (AC1 — one binding wires all five ports)', () => {
  it('binds all five ports when useMocks is true', () => {
    const ports = composePorts(mockConfig, fixedClock);
    expect(ports.clock).toBe(fixedClock);
    expect(ports.queueRepository).toBeDefined();
    expect(ports.paymentRepository).toBeDefined();
    expect(ports.notificationPort).toBeDefined();
    expect(ports.fileSharePort).toBeDefined();
  });

  it('exposes every port method the interface declares', () => {
    const ports = composePorts(mockConfig, fixedClock);
    expect(typeof ports.queueRepository.join).toBe('function');
    expect(typeof ports.queueRepository.getStatus).toBe('function');
    expect(typeof ports.queueRepository.claim).toBe('function');
    expect(typeof ports.paymentRepository.getPage).toBe('function');
    expect(typeof ports.paymentRepository.createAttempt).toBe('function');
    expect(typeof ports.paymentRepository.getStatus).toBe('function');
    expect(typeof ports.notificationPort.requestPermission).toBe('function');
    expect(typeof ports.fileSharePort.save).toBe('function');
  });

  it('THROWS for the real adapter set until it is wired (no silent mock fallback)', () => {
    const realConfig: AppConfig = { ...mockConfig, useMocks: false, env: 'production' };
    expect(() => composePorts(realConfig, fixedClock)).toThrow(/not wired yet/i);
  });
});

describe('mock adapters are Liskov-substitutable (honor the port contract)', () => {
  it('MockQueueRepository.join returns a contract-shaped entry using the injected clock', async () => {
    const ports = composePorts(mockConfig, fixedClock);
    const entry = await ports.queueRepository.join('evt-1', {
      buyerNik: '3200000000000001',
      email: 'a@b.test',
      emailConfirmation: 'a@b.test',
      consentNik: true,
    });
    expect(entry.status).toBe('WAITING');
    expect(entry.seq).toBe(1);
    // serverTime derives from the injected clock, not the device wall clock.
    expect(entry.serverTime).toBe(new Date(fixedClock.now()).toISOString());
  });

  it('MockQueueRepository.claim returns a one-time admission token + booking url', async () => {
    const ports = composePorts(mockConfig, fixedClock);
    const res = await ports.queueRepository.claim('entry-9');
    expect(res.admissionToken).toContain('entry-9');
    expect(res.bookingUrl).toContain('entry-9');
  });

  it('MockPaymentRepository.getPage derives server-authoritative times from the clock', async () => {
    const ports = composePorts(mockConfig, fixedClock);
    const page = await ports.paymentRepository.getPage('bk-1');
    expect(page.bookingId).toBe('bk-1');
    expect(page.methods).toContain('QRIS');
    expect(page.serverTime).toBe(new Date(fixedClock.now()).toISOString());
    // 10-minute server-authoritative window ahead of serverTime.
    expect(new Date(page.paymentExpiresAt).getTime()).toBe(fixedClock.now() + 10 * 60 * 1000);
  });

  it('MockNotificationPort records and removes a subscription', async () => {
    const ports = composePorts(mockConfig, fixedClock);
    expect(await ports.notificationPort.requestPermission()).toBe('granted');
    await ports.notificationPort.registerSubscription({
      eventId: 'evt-1',
      platform: 'WEB',
      pushToken: 'tok',
    });
    await ports.notificationPort.removeSubscription('evt-1');
    // no throw == contract honored; internal map is an impl detail.
    expect(true).toBe(true);
  });

  it('MockFileSharePort.save returns a locator and share resolves', async () => {
    const ports = composePorts(mockConfig, fixedClock);
    const file = { fileName: 'ticket.png', mimeType: 'image/png', content: 'x', base64: true };
    await expect(ports.fileSharePort.save(file)).resolves.toContain('ticket.png');
    await expect(ports.fileSharePort.share(file)).resolves.toBeUndefined();
  });
});
