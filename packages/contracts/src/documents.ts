import { z } from 'zod';

/**
 * The papers that prove a plot is what a listing says it is.
 *
 * These are the documents Gujarat land actually turns on: the 7/12 extract, the 8A, the
 * utarotar (chain of ownership) and the NA order where the land has been converted. v1
 * offered an upload field for them and lost every file to a schema mismatch, which is why
 * this is a first-class part of the model rather than an attachment bolted on.
 */
export const DOCUMENT_CATEGORIES = [
  'doc_712',
  'doc_8a',
  'utarotar',
  'na_order',
  'map_sketch',
  /**
   * A listing photograph.
   *
   * The same upload machinery as the paperwork, because everything now goes to Drive — but
   * a photograph is the one kind that is *public*, so it is served from its own endpoint
   * rather than the authorised document viewer.
   */
  'photo',
  'other',
] as const;
export const documentCategorySchema = z.enum(DOCUMENT_CATEGORIES);
export type DocumentCategory = z.infer<typeof documentCategorySchema>;

export const DOCUMENT_CATEGORY_LABEL: Record<DocumentCategory, string> = {
  doc_712: '7/12 extract (સાતબાર)',
  doc_8a: '8A extract',
  utarotar: 'Utarotar (chain of ownership)',
  na_order: 'NA order',
  map_sketch: 'Map or sketch',
  photo: 'Photograph',
  other: 'Something else',
};

/** What a reviewer is looking for in each one, shown under the field in the wizard. */
export const DOCUMENT_CATEGORY_HINT: Record<DocumentCategory, string> = {
  doc_712: 'The current extract showing the survey number and the holder’s name.',
  doc_8a: 'The account extract for the same holder.',
  utarotar: 'How ownership reached the present holder.',
  na_order: 'Only if the land has been converted to non-agricultural use.',
  map_sketch: 'A boundary sketch, if you have one.',
  photo: 'Shown publicly on the listing.',
  other: 'Anything else that helps a buyer trust the listing.',
};

/**
 * Nothing is mandatory (decision D2 — v1 required none, and adding a requirement the
 * client never had would strand every migrated listing). But an administrator reviews
 * faster when these are present, and the wizard says so.
 */
export const DOCUMENTS_ENCOURAGED: readonly DocumentCategory[] = ['doc_712', 'doc_8a'];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/** A photograph has to be an image — a PDF cannot go on a listing card. */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const MAX_DOCUMENTS_PER_PROPERTY = 10;

/**
 * Photographs are capped lower and counted separately.
 *
 * A phone camera produces 3–5 MB an image, and a listing wants several — sharing the
 * ten-document allowance between paperwork and photographs would mean choosing between
 * them.
 */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGES_PER_PROPERTY = 12;

/** Paperwork categories — everything a reviewer reads, as opposed to what a buyer sees. */
export const PAPERWORK_CATEGORIES: readonly DocumentCategory[] = [
  'doc_712',
  'doc_8a',
  'utarotar',
  'na_order',
  'map_sketch',
  'other',
];

export const UPLOAD_SESSION_STATUSES = ['open', 'completed', 'expired', 'aborted'] as const;
export const DOCUMENT_STATUSES = ['pending', 'uploaded', 'failed', 'deleted'] as const;

export const requestUploadSchema = z
  .object({
    category: documentCategorySchema,
    fileName: z.string().trim().min(1).max(200),
    mimeType: z.enum(ALLOWED_DOCUMENT_TYPES, {
      errorMap: () => ({ message: 'Upload a PDF or a photograph (JPEG, PNG or WebP)' }),
    }),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .max(MAX_DOCUMENT_BYTES, 'That file is larger than 25 MB'),
  })
  .strict();

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;

export const confirmUploadSchema = z
  .object({
    /** SHA-256 of the bytes the client actually sent, so a truncated upload is caught. */
    checksum: z.string().regex(/^[a-f0-9]{64}$/, 'That is not a SHA-256 checksum'),
    sizeBytes: z.number().int().positive().max(MAX_DOCUMENT_BYTES),
  })
  .strict();

/**
 * Storage headroom.
 *
 * The client declined a Google One upgrade, so the whole system lives inside one account's
 * 15 GB. That makes the warning threshold a real operational control rather than a nicety:
 * when Drive fills, uploads stop, and the first anyone would know is a broker's failed
 * upload during a sale.
 */
export const QUOTA_WARN_FRACTION = 0.8;
export const QUOTA_BLOCK_FRACTION = 0.97;

export interface StorageQuota {
  usedBytes: number;
  limitBytes: number;
  fraction: number;
  shouldWarn: boolean;
  shouldBlock: boolean;
}

export function readQuota(usedBytes: number, limitBytes: number): StorageQuota {
  const fraction = limitBytes > 0 ? usedBytes / limitBytes : 0;
  return {
    usedBytes,
    limitBytes,
    fraction,
    shouldWarn: fraction >= QUOTA_WARN_FRACTION,
    // Stop short of full: an upload that fails halfway leaves an orphan in Drive, and a
    // Drive with no room at all is harder to clean up than one with a little.
    shouldBlock: fraction >= QUOTA_BLOCK_FRACTION,
  };
}

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
};
