import { Readable } from 'node:stream';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';
import { StorageAccountModel } from '../db/models/Document.js';
import { logger } from '../observability/logger.js';
import { env } from '../../config/env.js';
import type {
  DocumentStorage,
  QuotaReading,
  StoredFile,
} from '../../application/ports/documentStorage.js';

/**
 * Google Drive, through the REST API and a refresh token.
 *
 * Decision D1 put documents in the owner's *personal* Drive rather than a Workspace shared
 * drive, because there is no Workspace. That has consequences this file has to live with:
 * the credential is one human's refresh token, it can be revoked from their account page at
 * any time, and the quota is their 15 GB.
 *
 * The token is encrypted at rest and never leaves this module. Access tokens are short
 * lived and kept in memory only, so a process restart re-mints one rather than persisting
 * a second credential.
 *
 * ⚠️ **This adapter has never run against Google.** No account has been connected, so every
 * path below is written from the API documentation and is unverified. The in-memory
 * implementation is what the test suite exercises. Treat the first real connection as the
 * thing that finds the bugs, and connect it against a throwaway account first.
 */

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_ABOUT = 'https://www.googleapis.com/drive/v3/about';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

const FOLDER_MIME = 'application/vnd.google-apps.folder';

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

let cached: CachedToken | undefined;

export class GoogleDriveStorage implements DocumentStorage {
  async isConnected(): Promise<boolean> {
    const account = await StorageAccountModel.findById('google_drive')
      .select('+refreshTokenCipher connected')
      .lean();
    return Boolean(account?.connected && account.refreshTokenCipher);
  }

  async ensureFolder(name: string, parentId?: string): Promise<string> {
    const token = await accessToken();

    // Search by name *within a known parent*, and only to avoid creating a duplicate on a
    // retry. Nothing else in the system ever finds a folder by name — ids are recorded.
    const query = [
      `name = '${name.replace(/'/g, "\\'")}'`,
      `mimeType = '${FOLDER_MIME}'`,
      'trashed = false',
      parentId ? `'${parentId}' in parents` : null,
    ]
      .filter(Boolean)
      .join(' and ');

    const found = await request<{ files?: Array<{ id: string }> }>(
      `${DRIVE_FILES}?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const existing = found?.files?.[0]?.id;
    if (existing) return existing;

    const created = await request<{ id: string }>(`${DRIVE_FILES}?fields=id`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME,
        ...(parentId ? { parents: [parentId] } : {}),
      }),
    });

    if (!created?.id) throw new Error('Drive did not return a folder id');
    return created.id;
  }

  /**
   * A resumable session. The browser PUTs the bytes to the returned URL and can restart
   * from where it stopped, which is the whole point on a connection that drops.
   */
  async createUploadSession(input: {
    folderId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }) {
    const token = await accessToken();

    const response = await fetch(`${DRIVE_UPLOAD}?uploadType=resumable&fields=id`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': input.mimeType,
        'X-Upload-Content-Length': String(input.sizeBytes),
      },
      body: JSON.stringify({ name: input.fileName, parents: [input.folderId] }),
    });

    if (!response.ok) {
      throw new Error(`Drive refused an upload session: ${response.status}`);
    }

    const uploadUrl = response.headers.get('location');
    if (!uploadUrl) throw new Error('Drive returned no upload URL');

    return {
      uploadUrl,
      externalId: null,
      // Google's sessions last a week; we expire ours in an hour so an abandoned upload is
      // swept up the same day rather than sitting in the sweep queue for seven.
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }

  /**
   * Asks the session what actually landed.
   *
   * A zero-length `PUT` with `Content-Range: bytes *\/*` is Drive's way of reporting a
   * resumable session's state: 200/201 means the upload finished, 308 means it did not.
   */
  async finalizeUpload(input: { uploadUrl: string }): Promise<StoredFile | null> {
    const status = await fetch(input.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Range': 'bytes */*' },
    });

    if (status.status === 308) return null; // Still incomplete.
    if (!status.ok) return null;

    const finished = (await status.json().catch(() => null)) as { id?: string } | null;
    const fileId = finished?.id;
    if (!fileId) return null;

    const token = await accessToken();
    const meta = await request<{
      id: string;
      size?: string;
      sha256Checksum?: string;
      parents?: string[];
    }>(`${DRIVE_FILES}/${fileId}?fields=id,size,sha256Checksum,parents`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!meta) return null;

    return {
      externalId: meta.id,
      folderId: meta.parents?.[0] ?? '',
      sizeBytes: Number(meta.size ?? 0),
      // Drive reports sha256 for most files but not all. Falling back to hashing the
      // content we just uploaded would mean downloading it again, so an absent checksum is
      // reported as empty and the caller treats that as a mismatch — refusing the upload
      // rather than recording an unverified file as verified.
      checksum: meta.sha256Checksum ?? '',
    };
  }

  async download(externalId: string): Promise<Readable | null> {
    const token = await accessToken();
    const response = await fetch(`${DRIVE_FILES}/${externalId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok || !response.body) return null;
    return Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]);
  }

  async remove(externalId: string): Promise<void> {
    const token = await accessToken();
    await fetch(`${DRIVE_FILES}/${externalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async quota(): Promise<QuotaReading | null> {
    try {
      const token = await accessToken();
      const about = await request<{
        storageQuota?: { usage?: string; limit?: string };
      }>(`${DRIVE_ABOUT}?fields=storageQuota`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const usage = Number(about?.storageQuota?.usage ?? 0);
      const limit = Number(about?.storageQuota?.limit ?? 0);
      // An account with no limit reported is a Workspace pooled account; treat it as ample
      // rather than as zero, which would block every upload.
      return { usedBytes: usage, limitBytes: limit || Number.MAX_SAFE_INTEGER };
    } catch (error) {
      logger.warn({ err: error }, 'could not read the Drive quota');
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

/**
 * The refresh token, encrypted with AES-256-GCM.
 *
 * GCM rather than CBC because it authenticates as well as encrypts: a tampered ciphertext
 * fails to decrypt instead of producing plausible rubbish that gets sent to Google.
 */
export function encryptToken(plain: string): string {
  const key = tokenKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptToken(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split('.');
  if (!ivPart || !tagPart || !dataPart) throw new Error('the stored token is malformed');

  const decipher = createDecipheriv(
    'aes-256-gcm',
    tokenKey(),
    Buffer.from(ivPart, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}

/** Any passphrase becomes a 32-byte key, so the operator is not made to count characters. */
function tokenKey(): Buffer {
  const secret = env().STORAGE_TOKEN_KEY;
  if (!secret) throw new Error('STORAGE_TOKEN_KEY is not configured');
  return createHash('sha256').update(secret).digest();
}

/** Exchanges the refresh token for an access token, reusing it until it nearly expires. */
async function accessToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.accessToken;

  const account = await StorageAccountModel.findById('google_drive')
    .select('+refreshTokenCipher')
    .lean();

  if (!account?.refreshTokenCipher) {
    throw new Error('no Google account is connected');
  }

  const config = env();
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.GOOGLE_CLIENT_ID ?? '',
      client_secret: config.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: decryptToken(account.refreshTokenCipher),
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    // The usual cause is the owner revoking access from their Google account page. Say so
    // in the record, because otherwise this reads as an outage.
    await StorageAccountModel.updateOne(
      { _id: 'google_drive' },
      { $set: { lastError: `token refresh failed with ${response.status}`, connected: false } },
    );
    throw new Error(`Google refused the refresh token: ${response.status}`);
  }

  const token = (await response.json()) as { access_token: string; expires_in: number };
  cached = {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };
  return cached.accessToken;
}

async function request<T>(url: string, init: RequestInit): Promise<T | null> {
  const response = await fetch(url, init);
  if (!response.ok) {
    logger.warn({ url, status: response.status }, 'a Drive request failed');
    return null;
  }
  return (await response.json()) as T;
}

/** Dropped when the account is reconnected, so a stale token is never reused. */
export function forgetCachedToken(): void {
  cached = undefined;
}
