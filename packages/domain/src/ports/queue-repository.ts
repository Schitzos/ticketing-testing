/**
 * RBT-004 — QueueRepository port.
 *
 * One focused port for the Queue backend capability (SOLID-I). Maps the Queue Service
 * contract operations the FE calls:
 *   join    → POST /events/{eventId}/queue-entries
 *   status  → GET  /queue-status/{eventId}        (CDN status document, adaptive polling)
 *   myEntry → GET  /queue-entries/me              (exact position near turn)
 *   claim   → POST /queue-entries/{entryId}/claim (one-time admission token)
 *   leave   → DELETE /queue-entries/{entryId}
 *
 * The real REST adapter (RBT-010+) and the mock adapter (RBT-004) implement this SAME
 * interface and are Liskov-substitutable; the composition root binds one of them. Pure
 * TypeScript — no transport, React, or platform types leak through the port.
 */
import type {
  QueueClaimResponse,
  QueueEntry,
  QueueEntryStatusDetail,
  QueueJoinRequest,
  QueueStatusDocument,
} from './dto';

export interface QueueRepository {
  /** Join (or restore) the queue for an event. Idempotent on re-join per D9.3. */
  join(eventId: string, body: QueueJoinRequest): Promise<QueueEntry>;

  /** CDN status document for the event; the caller honors `nextPollAfterMs`. */
  getStatus(eventId: string): Promise<QueueStatusDocument>;

  /** Exact position / zone for the caller's own entry (used near turn). */
  getMyEntry(eventId: string): Promise<QueueEntryStatusDetail>;

  /** Claim the one-time admission token when it is the caller's turn. */
  claim(entryId: string): Promise<QueueClaimResponse>;

  /** Leave the queue (SHOULD). */
  leave(entryId: string): Promise<void>;
}
