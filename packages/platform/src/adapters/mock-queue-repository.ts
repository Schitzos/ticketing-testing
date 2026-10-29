/**
 * RBT-004 — Mock QueueRepository adapter.
 *
 * Implements the SAME `QueueRepository` port the real REST adapter will (Liskov). Keeps the
 * FE fully buildable behind the FE-NEED gaps (O1) until BE delivers. Returns contract-shaped
 * data; the richer fixture set lands with RBT-014 (`@rbt/test-fixtures`). This adapter is
 * deliberately self-contained so the composition root can bind it with no fixture dependency.
 *
 * Outer adapter (platform layer) — it may hold in-memory state; the domain never sees it.
 */
import type {
  Clock,
  QueueClaimResponse,
  QueueEntry,
  QueueEntryStatusDetail,
  QueueJoinRequest,
  QueueRepository,
  QueueStatusDocument,
} from '@rbt/domain';

export class MockQueueRepository implements QueueRepository {
  private seq = 0;

  constructor(private readonly clock: Clock) {}

  private nowIso(): string {
    return new Date(this.clock.now()).toISOString();
  }

  join(eventId: string, _body: QueueJoinRequest): Promise<QueueEntry> {
    this.seq += 1;
    const now = this.nowIso();
    return Promise.resolve({
      entryId: `mock-entry-${eventId}-${this.seq}`,
      seq: this.seq,
      status: 'WAITING',
      queueToken: `mock-queue-token-${this.seq}`,
      statusUrl: `/api/v1/queue-status/${eventId}`,
      joinedAt: now,
      serverTime: now,
    });
  }

  getStatus(eventId: string): Promise<QueueStatusDocument> {
    return Promise.resolve({
      eventId,
      saleState: 'OPEN',
      servingSeq: Math.max(0, this.seq - 1),
      guaranteedUntilSeq: this.seq + 50,
      possibleUntilSeq: this.seq + 100,
      soldOut: false,
      remainingTickets: 500,
      admissionRatePerMin: 120,
      nextPollAfterMs: 5000,
    });
  }

  getMyEntry(_eventId: string): Promise<QueueEntryStatusDetail> {
    return Promise.resolve({
      entryId: `mock-entry-${this.seq}`,
      seq: this.seq,
      status: 'WAITING',
      exactPosition: 1,
      zone: 'GUARANTEED',
    });
  }

  claim(entryId: string): Promise<QueueClaimResponse> {
    return Promise.resolve({
      admissionToken: `mock-admission-${entryId}`,
      bookingUrl: `/checkout/mock-session-${entryId}`,
    });
  }

  leave(_entryId: string): Promise<void> {
    // no-op in the mock
    return Promise.resolve();
  }
}
