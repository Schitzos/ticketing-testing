/**
 * RBT-004 — Mock PaymentRepository adapter.
 *
 * Implements the SAME `PaymentRepository` port the real BE adapter will (Liskov, D10.5).
 * Because the BE payment service is still in progress, v1 binds THIS at the composition
 * root; integrating real BE later swaps only the binding — no UI / domain / use-case change.
 * The full SNAP simulator + richer fixtures land with RBT-065; this adapter provides the
 * minimum contract-shaped surface so the root can wire and the type contract holds.
 *
 * Server-authoritative timer: `paymentExpiresAt` / `serverTime` are derived from the
 * injected `Clock`, never a hard-coded TTL baked into the UI.
 */
import type {
  Clock,
  PaymentAttempt,
  PaymentMethod,
  PaymentPage,
  PaymentPageToken,
  PaymentRepository,
  PaymentStatus,
} from '@rbt/domain';

const TEN_MINUTES_MS = 10 * 60 * 1000;

export class MockPaymentRepository implements PaymentRepository {
  constructor(private readonly clock: Clock) {}

  private iso(offsetMs = 0): string {
    return new Date(this.clock.now() + offsetMs).toISOString();
  }

  async getPage(bookingId: string): Promise<PaymentPage> {
    return {
      bookingId,
      methods: ['VA_BCA', 'VA_BNI', 'VA_BRI', 'VA_PERMATA', 'QRIS', 'GOPAY'],
      amountMinor: 350_000_00,
      paymentExpiresAt: this.iso(TEN_MINUTES_MS),
      serverTime: this.iso(),
      currentAttempt: null,
      canEdit: true,
      editableUntil: this.iso(TEN_MINUTES_MS),
    };
  }

  async createAttempt(
    _bookingId: string,
    method: PaymentMethod,
    _idempotencyKey: string,
  ): Promise<PaymentAttempt> {
    return {
      attemptNo: 1,
      method,
      status: 'PENDING',
      expiresAt: this.iso(TEN_MINUTES_MS),
      redirectUrl: 'https://mock-snap.local/pay',
      successReturnUrl: '/success/mock-booking',
      failedReturnUrl: '/expired/mock-booking',
    };
  }

  async getStatus(bookingId: string): Promise<PaymentStatus> {
    return {
      bookingId,
      bookingStatus: 'PAYMENT_PENDING',
      paymentExpiresAt: this.iso(TEN_MINUTES_MS),
      attempt: {
        attemptNo: 1,
        method: 'QRIS',
        status: 'PENDING',
        expiresAt: this.iso(TEN_MINUTES_MS),
      },
      serverTime: this.iso(),
    };
  }

  async createPageToken(_bookingId: string): Promise<PaymentPageToken> {
    return {
      pageToken: 'mock-page-token',
      pageUrl: 'https://mock-snap.local/page',
      expiresAt: this.iso(5 * 60 * 1000),
    };
  }
}
