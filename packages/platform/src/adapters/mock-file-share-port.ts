/**
 * RBT-004 — Mock FileSharePort adapter.
 *
 * Implements the SAME `FileSharePort` the native (`expo-file-system` + `expo-sharing`) and
 * web (Blob download / print) adapters will (Liskov). Records the last saved/shared file in
 * memory so e-ticket flow tests can assert without touching a real filesystem or share sheet.
 */
import type { FileSharePort, ShareableFile } from '@rbt/domain';

export class MockFileSharePort implements FileSharePort {
  lastSaved?: ShareableFile;
  lastShared?: ShareableFile;

  save(file: ShareableFile): Promise<string> {
    this.lastSaved = file;
    return Promise.resolve(`mock://saved/${file.fileName}`);
  }

  share(file: ShareableFile): Promise<void> {
    this.lastShared = file;
    return Promise.resolve();
  }
}
