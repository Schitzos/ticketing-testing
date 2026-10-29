/**
 * RBT-004 — Platform adapters barrel.
 *
 * Concrete implementations of the domain ports. The composition root (@rbt/config) imports
 * these to bind the mock set; real BE/native adapters land alongside them (same interfaces)
 * in later stories and swap in at the root via the env toggle.
 */
export * from './system-clock';
export * from './mock-queue-repository';
export * from './mock-payment-repository';
export * from './mock-notification-port';
export * from './mock-file-share-port';
