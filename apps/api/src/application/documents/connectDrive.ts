import { SignJWT, jwtVerify } from 'jose';
import { StorageAccountModel } from '../../infrastructure/db/models/Document.js';
import {
  encryptToken,
  forgetCachedToken,
} from '../../infrastructure/storage/googleDrive.js';
import { logger } from '../../infrastructure/observability/logger.js';
import { AppError } from '../../shared/AppError.js';
import { env } from '../../config/env.js';

/**
 * Connecting the owner's Google Drive.
 *
 * An administrator signs in to Google once; we keep the refresh token, encrypted, and use
 * it from then on. There is no second sign-in and no service account — decision D1 put the
 * documents in a personal Drive because there is no Workspace.
 *
 * The scope asked for is `drive.file`, which is the narrow one: it grants access only to
 * files this application itself created. It cannot read anything else in that Drive, which
 * matters because the account being connected is somebody's own. Asking for `drive` instead
 * would work identically for us and would additionally trigger Google's verification review.
 */

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO = 'https://www.googleapis.com/oauth2/v2/userinfo';
const SCOPE = 'https://www.googleapis.com/auth/drive.file email';

/**
 * Deliberately *not* under `/api/v1/admin`.
 *
 * That prefix is guarded by the admin router, which is mounted first and would reject
 * Google's redirect with a 401 before the public route ever ran — the request arrives from
 * Google as a plain browser GET with no session header to satisfy the guard.
 *
 * This exact URL must also be listed as an authorised redirect URI on the Google OAuth
 * client, or Google refuses the connection with `redirect_uri_mismatch`.
 */
export const redirectUri = (): string =>
  `${env().API_BASE_URL}/api/v1/storage/callback`;

const secret = (): Uint8Array => new TextEncoder().encode(env().JWT_SECRET);

/**
 * Where to send the administrator.
 *
 * `state` is a short-lived signed token naming who started the flow. Without it, anyone
 * could send a logged-in administrator a crafted callback URL and attach *their* Drive to
 * the site — the documents would then flow to a stranger's account, and nothing on screen
 * would look wrong.
 */
export async function driveConsentUrl(adminId: string): Promise<string> {
  const config = env();
  if (!config.GOOGLE_CLIENT_ID) {
    throw new AppError(
      'STORAGE_UNAVAILABLE',
      'No Google client is configured yet, so there is nothing to connect to.',
    );
  }

  const state = await new SignJWT({ purpose: 'drive-connect' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(secret());

  const params = new URLSearchParams({
    client_id: config.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPE,
    // Both are required to be *given* a refresh token: offline asks for one, and consent
    // forces the prompt even for an account that has approved before — without it a
    // reconnection silently returns no refresh token and the connection cannot be renewed.
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export interface ConnectResult {
  accountEmail: string | null;
}

/**
 * Finishes the flow: exchanges the code for tokens and stores the refresh token encrypted.
 *
 * Everything here is verified before anything is written — a callback with a bad state, or
 * one that yields no refresh token, must not half-connect the account and leave the site
 * believing it has storage it cannot use.
 */
export async function completeDriveConnection(
  code: string,
  state: string,
): Promise<ConnectResult> {
  const config = env();

  let adminId: string;
  try {
    const { payload } = await jwtVerify(state, secret());
    if (payload.purpose !== 'drive-connect' || !payload.sub) throw new Error('wrong purpose');
    adminId = payload.sub;
  } catch {
    throw AppError.forbidden('That connection link is not valid or has expired.');
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID ?? '',
      client_secret: config.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    logger.error({ status: response.status, detail }, 'Google refused the authorisation code');
    throw new AppError('STORAGE_UNAVAILABLE', 'Google would not complete the connection.');
  }

  const tokens = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
  };

  if (!tokens.refresh_token) {
    // Google only issues one on the first consent unless `prompt=consent` is sent, which it
    // is. Reaching here means the account was connected in a way we cannot renew, so it is
    // refused rather than stored — a connection that dies in an hour is worse than none.
    throw new AppError(
      'STORAGE_UNAVAILABLE',
      'Google did not return a renewable token. Remove LocateX from your Google account’s ' +
        'third-party access list and try connecting again.',
    );
  }

  // Whose Drive this actually is. Worth recording: the commonest support question later is
  // "which account are the documents in?", and a stored answer beats guessing.
  let accountEmail: string | null = null;
  try {
    const profile = await fetch(USERINFO, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (profile.ok) {
      accountEmail = ((await profile.json()) as { email?: string }).email ?? null;
    }
  } catch {
    // Not worth failing the connection over.
  }

  await StorageAccountModel.updateOne(
    { _id: 'google_drive' },
    {
      $set: {
        connected: true,
        accountEmail,
        refreshTokenCipher: encryptToken(tokens.refresh_token),
        connectedBy: adminId,
        connectedAt: new Date(),
        lastError: null,
        // A different account means a different Drive, so the folder we remembered in the
        // old one is meaningless. Clearing it makes the next upload create a fresh root.
        rootFolderId: null,
      },
    },
    { upsert: true },
  );

  forgetCachedToken();
  logger.info({ accountEmail }, 'google drive connected');

  return { accountEmail };
}

/**
 * Forgets the credential.
 *
 * The files stay in the Drive — they belong to that account, not to us, and deleting
 * somebody's land records because a token was revoked would be indefensible. Reconnecting
 * the same account picks them up again.
 */
export async function disconnectDrive(): Promise<void> {
  await StorageAccountModel.updateOne(
    { _id: 'google_drive' },
    {
      $set: { connected: false, refreshTokenCipher: null, rootFolderId: null },
      $unset: { accountEmail: '' },
    },
  );
  forgetCachedToken();
}
