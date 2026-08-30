import { createHash } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../../shared/AppError.js';
import { env } from '../../config/env.js';

/**
 * Listing photographs.
 *
 * Images go to Cloudinary and documents go to Drive, and the split is deliberate: Drive has
 * no image transformations and enforces aggressive download quotas on shared files, so a
 * listing page pulling ten photographs from it would be slow for buyers and would burn the
 * 15 GB account's bandwidth. Cloudinary resizes on delivery, which is what a phone browsing
 * on mobile data actually needs.
 *
 * Uploads go straight from the browser. This endpoint only signs them — the bytes never
 * pass through our process, so a broker uploading eight photographs from a field does not
 * occupy a server connection for the duration.
 */

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES_PER_PROPERTY = 20;

/** The folder every listing image lands in, so the account stays navigable by a human. */
const FOLDER = 'locatex/properties';

export const signImageUploadSchema = z
  .object({
    propertyId: z.string().trim().min(1).max(40).optional(),
  })
  .strict();

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  uploadUrl: string;
  maxBytes: number;
}

/**
 * A signature Cloudinary will accept, valid for about an hour.
 *
 * Signed rather than unsigned: an unsigned preset lets anybody who reads the page source
 * upload anything to the account, and the first anyone would notice is the bill. Signing
 * means only a request this server approved can land, and the parameters — the folder, the
 * allowed formats — are fixed here rather than trusted from the browser.
 */
export function signImageUpload(propertyId?: string): UploadSignature {
  const config = env();

  if (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET) {
    throw new AppError(
      'STORAGE_UNAVAILABLE',
      'Image hosting is not configured yet. Paste a link to a photograph instead.',
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = propertyId ? `${FOLDER}/${propertyId}` : FOLDER;

  // Cloudinary signs the parameters sorted by key, joined as `k=v` with `&`, with the API
  // secret appended — not as a separate HMAC key. Getting either detail wrong produces a
  // signature that is refused with no explanation of which part was wrong.
  const signed: Record<string, string> = {
    folder,
    timestamp: String(timestamp),
  };

  const payload = Object.keys(signed)
    .sort()
    .map((key) => `${key}=${signed[key]}`)
    .join('&');

  const signature = createHash('sha1')
    .update(payload + config.CLOUDINARY_API_SECRET)
    .digest('hex');

  return {
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    apiKey: config.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/image/upload`,
    maxBytes: MAX_IMAGE_BYTES,
  };
}

/**
 * Turns what Cloudinary returns into the URL we store.
 *
 * The delivered URL carries transformation instructions rather than pointing at the
 * original: a 4 MB photograph from a phone becomes a ~120 KB image sized for a listing
 * card. Storing the raw URL instead would mean every buyer downloads the full file, which
 * on Indian mobile data is the difference between a page that loads and one that does not.
 */
export function deliveryUrl(publicId: string, cloudName: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_1600,c_limit/${publicId}`;
}

export const cloudinaryConfigured = (): boolean => Boolean(env().CLOUDINARY_CLOUD_NAME);
