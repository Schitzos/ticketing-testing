/**
 * RBT-004 — Port DTOs (framework-free).
 *
 * Minimal, contract-shaped data types the repository ports exchange. Grounded in the
 * OpenAPI contracts under `.genesis/docs/api-contract/` (source of truth):
 *   - Queue Service API    → JoinRequest, QueueEntry, EntryStatus, ClaimResponse, StatusDocument
 *   - Payment Service API  → PaymentPage, Attempt, PaymentStatus, PageToken
 *   - Notification Service → PushSubscription
 *
 * These are NOT the full OpenAPI-generated type set — that lands with RBT-010, which will
 * replace/extend these from the generator. RBT-004 defines only the shapes the five ports
 * need so the composition root can wire real + mock adapters against one stable interface.
 *
 * Pure TypeScript: no React / React Native / Expo / browser / native imports (RULES.md D2.1).
 * All timestamps are ISO-8601 strings exactly as the contracts emit them; the domain
 * `ServerClock` (RBT-011) converts them to epoch millis — ports never do clock math.
 */

/** Standard response envelope `{ meta, data }` shared across every service contract. */
export interface Meta {
  code: number;
  message?: string;
}

export interface Envelope<T> {
  meta: Meta;
  data: T;
}

// ---------------------------------------------------------------------------
// Queue Service (contract: "2. Queue Service API")
// ---------------------------------------------------------------------------

export type QueueEntryStatus =
  | 'WAITING'
  | 'ADMITTED'
  | 'CLAIMED'
  | 'MISSED'
  | 'LEFT'
  | 'SOLD_OUT'
  | 'CLOSED'
  | 'COMPLETED'
  | 'ENDED';

export type QueueZone = 'GUARANTEED' | 'POSSIBLE' | 'NOT_ENOUGH';

export type SaleState = 'NOT_STARTED' | 'OPEN' | 'CLOSED';

/**
 * Anonymous/guest join body. FE-NEED gap O1 (exact anonymous shape unconfirmed) — modeled
 * here from the current contract's `JoinRequest`; mock adapter honors it until BE confirms.
 */
export interface QueueJoinRequest {
  buyerNik: string;
  email: string;
  emailConfirmation: string;
  consentNik: true;
}

export interface QueueEntry {
  entryId: string;
  seq: number;
  status: QueueEntryStatus;
  queueToken?: string;
  visitorToken?: string;
  statusUrl?: string;
  claimDeadline?: string;
  joinedAt: string;
  /** ISO-8601 server time for `ServerClock` offset sync. */
  serverTime: string;
}

export interface QueueEntryStatusDetail {
  entryId: string;
  seq: number;
  status: QueueEntryStatus;
  exactPosition?: number;
  zone?: QueueZone;
  claimDeadline?: string;
  reason?: string;
  redirect?: string;
}

/** CDN-cacheable status document; drives adaptive polling (honor `nextPollAfterMs`). */
export interface QueueStatusDocument {
  eventId: string;
  saleState: SaleState;
  servingSeq?: number;
  guaranteedUntilSeq?: number;
  possibleUntilSeq?: number;
  soldOut?: boolean;
  remainingTickets?: number;
  admissionRatePerMin?: number;
  nextPollAfterMs?: number;
}

export interface QueueClaimResponse {
  /** One-time admission token, TTL ~60s. */
  admissionToken: string;
  bookingUrl: string;
}

// ---------------------------------------------------------------------------
// Payment Service (contract: "4. Payment Service API")
// ---------------------------------------------------------------------------

export type PaymentMethod =
  | 'VA_BCA'
  | 'VA_BNI'
  | 'VA_BRI'
  | 'VA_PERMATA'
  | 'QRIS'
  | 'GOPAY';

export type PaymentAttemptStatus =
  | 'CREATED'
  | 'PENDING'
  | 'UNKNOWN'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'REFUND_REQUIRED'
  | 'REFUNDED';

export interface PaymentAttempt {
  attemptNo: number;
  method: PaymentMethod;
  status: PaymentAttemptStatus;
  bookingVersion?: number;
  expiresAt?: string;
  /** SNAP URL the FE opens after an attempt is created. */
  redirectUrl?: string;
  successReturnUrl?: string;
  failedReturnUrl?: string;
}

/** View model for the FE payment page (web + WebView). */
export interface PaymentPage {
  bookingId: string;
  methods: PaymentMethod[];
  /** Minor-unit IDR; the UI renders this verbatim (no FE-computed fees). */
  amountMinor: number;
  paymentExpiresAt: string;
  serverTime: string;
  currentAttempt?: PaymentAttempt | null;
  canEdit: boolean;
  editableUntil?: string;
}

export interface PaymentStatus {
  bookingId: string;
  bookingStatus: string;
  orderId?: string;
  paymentExpiresAt: string;
  attempt?: PaymentAttempt | null;
  serverTime: string;
}

/** One-time token for the mobile WebView page-token handoff. */
export interface PaymentPageToken {
  pageToken: string;
  pageUrl: string;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Notification Service (contract: "5. Notification Service API")
// ---------------------------------------------------------------------------

export type PushPlatform = 'ANDROID' | 'IOS' | 'WEB';

export interface PushSubscription {
  eventId: string;
  platform: PushPlatform;
  pushToken: string;
}
