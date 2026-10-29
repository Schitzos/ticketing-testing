/**
 * RBT-004 — FileSharePort.
 *
 * The e-ticket save/share capability behind one port (RBT-071). Native saves via
 * `expo-file-system` + shares via `expo-sharing`/OS share sheet; web downloads a Blob or
 * prints. Both adapters implement the SAME interface so the ticket use case is platform-
 * neutral (ARCHITECTURE §6.2).
 *
 * Framework-free: content is passed as a string payload + mime type; the adapter owns the
 * actual filesystem / Blob / share-sheet mechanics. The QR payload must never embed a raw
 * NIK or payment secret (RULES.md security).
 */
export interface ShareableFile {
  /** Suggested file name, e.g. `ticket-{orderId}.png`. */
  fileName: string;
  /** MIME type, e.g. `image/png`, `image/svg+xml`, `application/pdf`. */
  mimeType: string;
  /** File contents (base64 for binary, raw text for svg/text). */
  content: string;
  /** True when `content` is base64-encoded. */
  base64?: boolean;
}

export interface FileSharePort {
  /** Persist/download the file to the platform's storage. Returns a locator (path/url). */
  save(file: ShareableFile): Promise<string>;

  /** Open the platform share sheet / print dialog for the file. */
  share(file: ShareableFile): Promise<void>;
}
