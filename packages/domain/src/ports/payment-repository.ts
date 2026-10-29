/**
 * RBT-004 — PaymentRepository port.
 *
 * The full Payment backend capability behind one port (D10.5). Every payment story (E7)
 * is production code against THIS interface; v1 binds a mock adapter at the composition
 * root (RBT-065) and integrating the real BE later swaps only that binding — no UI / domain
 * / use-case change (Liskov). Maps the Payment Service contract:
 *   getPage       → GET  /payments/{bookingId}/page
 *   createAttempt → POST /payments/{bookingId}/attempts
 *   getStatus     → GET  /payments/{bookingId}/status
 *   createPageToken → POST /payments/{bookingId}/page-tokens   (mobile WebView handoff)
 *
 * Framework-free: the FE never collects a payment instrument here (SNAP owns it, D10.4).
 */
import type {
  PaymentMethod,
  PaymentPage,
  PaymentPageToken,
  PaymentAttempt,
  PaymentStatus,
} from './dto';

export interface PaymentRepository {
  /** Payment page view model: summary, methods, server-authoritative expiry. */
  getPage(bookingId: string): Promise<PaymentPage>;

  /**
   * Create (or reconcile) a payment attempt for a method.
   * `idempotencyKey` is generated once per action and reused on retry/refresh (D3.3).
   */
  createAttempt(
    bookingId: string,
    method: PaymentMethod,
    idempotencyKey: string,
  ): Promise<PaymentAttempt>;

  /** Authoritative status; a terminal/success UI renders ONLY on PAID here (D10.4). */
  getStatus(bookingId: string): Promise<PaymentStatus>;

  /** One-time page token for the mobile WebView page reuse (RBT-062). */
  createPageToken(bookingId: string): Promise<PaymentPageToken>;
}
