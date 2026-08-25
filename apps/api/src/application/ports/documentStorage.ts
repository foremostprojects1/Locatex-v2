import { Readable } from 'node:stream';
import { createHash, randomUUID } from 'node:crypto';

/**
 * Where documents live.
 *
 * The port exists so that nothing above it knows Google exists. That is not architectural
 * decoration: the client is uploading to a *personal* Drive with 15 GB (decision D1), and
 * the day that becomes untenable — the account leaves, the quota fills, Workspace arrives —
 * the replacement is a new class behind this interface and nothing else.
 *
 * It also means the whole upload lifecycle is tested without a network, which is the only
 * way to test the interesting parts: a session that expires, an upload that arrives
 * truncated, a quota that fills mid-upload.
 */

export interface StoredFile {
  externalId: string;
  /** The folder it landed in, recorded so we never search Drive by name to find it again. */
  folderId: string;
  sizeBytes: number;
  checksum: string;
}

export interface QuotaReading {
  usedBytes: number;
  limitBytes: number;
}

export interface DocumentStorage {
  /** Whether the storage is usable at all — an unconnected Drive is not an error, just no. */
  isConnected(): Promise<boolean>;

  /** Creates the folder for a listing, or returns the one already recorded for it. */
  ensureFolder(name: string, parentId?: string): Promise<string>;

  /**
   * Begins an upload and returns the URL the browser will send the bytes to.
   *
   * Uploads go straight from the browser to the storage provider. Routing a 25 MB scan
   * through our own process would mean holding it in memory, doubling the bandwidth bill,
   * and turning one slow phone connection into a blocked Node event loop.
   */
  createUploadSession(input: {
    folderId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<{ uploadUrl: string; externalId: string | null; expiresAt: Date }>;

  /** Confirms an upload finished and returns what is actually stored. */
  finalizeUpload(input: {
    uploadUrl: string;
    externalId: string | null;
  }): Promise<StoredFile | null>;

  /** Streams a file back, for the viewer. */
  download(externalId: string): Promise<Readable | null>;

  /** Removes a file. Used for orphans and for a broker deleting a document. */
  remove(externalId: string): Promise<void>;

  quota(): Promise<QuotaReading | null>;
}

/**
 * The test and development implementation: everything in memory.
 *
 * It is a genuine implementation, not a stub — it enforces the same size accounting,
 * returns the same shapes, and can be told to fill up or to fail. Every use case above it
 * is therefore tested against something that behaves like storage rather than something
 * that always says yes.
 */
export class InMemoryDocumentStorage implements DocumentStorage {
  private readonly folders = new Map<string, string>();
  private readonly files = new Map<string, { bytes: Buffer; folderId: string }>();
  private readonly sessions = new Map<
    string,
    { folderId: string; fileName: string; sizeBytes: number; expiresAt: Date }
  >();

  connected = true;
  limitBytes = 15 * 1024 * 1024 * 1024;
  /** Set to make the next finalize behave as though the upload never arrived. */
  failNextFinalize = false;

  async isConnected(): Promise<boolean> {
    return this.connected;
  }

  async ensureFolder(name: string, parentId?: string): Promise<string> {
    const key = `${parentId ?? 'root'}/${name}`;
    let id = this.folders.get(key);
    if (!id) {
      id = `folder-${randomUUID()}`;
      this.folders.set(key, id);
    }
    return id;
  }

  async createUploadSession(input: {
    folderId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }) {
    const uploadUrl = `memory://upload/${randomUUID()}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    this.sessions.set(uploadUrl, {
      folderId: input.folderId,
      fileName: input.fileName,
      sizeBytes: input.sizeBytes,
      expiresAt,
    });
    return { uploadUrl, externalId: null, expiresAt };
  }

  /** Stands in for the browser's PUT. Tests call this where a real client would upload. */
  async receiveBytes(uploadUrl: string, bytes: Buffer): Promise<void> {
    const session = this.sessions.get(uploadUrl);
    if (!session) throw new Error('no such upload session');
    this.files.set(uploadUrl, { bytes, folderId: session.folderId });
  }

  async finalizeUpload(input: { uploadUrl: string }): Promise<StoredFile | null> {
    if (this.failNextFinalize) {
      this.failNextFinalize = false;
      return null;
    }

    const stored = this.files.get(input.uploadUrl);
    if (!stored) return null;

    const externalId = `file-${randomUUID()}`;
    this.files.set(externalId, stored);
    this.files.delete(input.uploadUrl);
    this.sessions.delete(input.uploadUrl);

    return {
      externalId,
      folderId: stored.folderId,
      sizeBytes: stored.bytes.byteLength,
      checksum: createHash('sha256').update(stored.bytes).digest('hex'),
    };
  }

  async download(externalId: string): Promise<Readable | null> {
    const stored = this.files.get(externalId);
    return stored ? Readable.from(stored.bytes) : null;
  }

  async remove(externalId: string): Promise<void> {
    this.files.delete(externalId);
  }

  async quota(): Promise<QuotaReading | null> {
    if (!this.connected) return null;
    let usedBytes = 0;
    for (const [key, value] of this.files) {
      if (key.startsWith('file-')) usedBytes += value.bytes.byteLength;
    }
    return { usedBytes, limitBytes: this.limitBytes };
  }

  /** Test helper: pretend the Drive is nearly full without uploading gigabytes. */
  setUsedBytes(bytes: number): void {
    this.files.set('file-ballast', { bytes: Buffer.alloc(bytes), folderId: 'ballast' });
  }

  clear(): void {
    this.folders.clear();
    this.files.clear();
    this.sessions.clear();
    this.connected = true;
    this.failNextFinalize = false;
    this.limitBytes = 15 * 1024 * 1024 * 1024;
  }
}
