import { Schema, model } from 'mongoose';
import { ulid } from 'ulid';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  UPLOAD_SESSION_STATUSES,
} from '@locatex/contracts';

/**
 * A document attached to a listing, and the upload that put it there.
 *
 * The record is written *before* the bytes arrive, deliberately. v1's controller assigned
 * fields the schema did not declare, Mongoose dropped them in silence, and every uploaded
 * 7/12 was lost with nothing to show it had ever existed. Here the row exists first, so a
 * failed upload leaves evidence rather than nothing.
 */
const propertyDocumentSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },

    propertyId: { type: String, required: true, index: true },
    uploadedBy: { type: String, required: true },
    category: { type: String, enum: DOCUMENT_CATEGORIES, required: true },

    fileName: { type: String, required: true, maxlength: 200 },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },

    storageProvider: { type: String, required: true, default: 'google_drive' },
    /** Recorded so the file is fetched by id — Drive is never searched by name for it. */
    externalId: { type: String, default: null },
    folderId: { type: String, default: null },

    /** SHA-256 of the bytes, which is how a re-upload of the same file is recognised. */
    checksum: { type: String, default: null },

    status: {
      type: String,
      enum: DOCUMENT_STATUSES,
      required: true,
      default: 'pending',
      index: true,
    },
    /**
     * Superseded documents are kept, not overwritten. A 7/12 is re-issued and the old one
     * is what the buyer saw last week — losing it would lose the record of the sale.
     */
    version: { type: Number, required: true, default: 1 },
    supersededBy: { type: String, default: null },

    uploadedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true, strict: 'throw', versionKey: false, collection: 'property_documents' },
);

propertyDocumentSchema.index({ propertyId: 1, category: 1, version: -1 });
// The same bytes uploaded twice to the same listing are one document, not two.
propertyDocumentSchema.index(
  { propertyId: 1, checksum: 1 },
  { unique: true, partialFilterExpression: { checksum: { $type: 'string' } } },
);

const uploadSessionSchema = new Schema(
  {
    _id: { type: String, default: () => ulid() },
    documentId: { type: String, required: true, index: true },
    propertyId: { type: String, required: true },
    createdBy: { type: String, required: true },

    uploadUrl: { type: String, required: true },
    externalId: { type: String, default: null },

    status: {
      type: String,
      enum: UPLOAD_SESSION_STATUSES,
      required: true,
      default: 'open',
      index: true,
    },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: 'throw', versionKey: false, collection: 'upload_sessions' },
);

// Abandoned sessions are swept up by the maintenance job; the index is what finds them.
uploadSessionSchema.index({ status: 1, expiresAt: 1 });

export const PropertyDocumentModel = model('PropertyDocument', propertyDocumentSchema);
export const UploadSessionModel = model('UploadSession', uploadSessionSchema);

/**
 * The connected storage account, and its refresh token.
 *
 * One row, ever. It exists because the token is a long-lived credential belonging to a
 * human's Google account and must not sit in an environment variable where every deploy
 * log and every process listing can see it.
 */
const storageAccountSchema = new Schema(
  {
    _id: { type: String, default: 'google_drive' },
    connected: { type: Boolean, required: true, default: false },
    accountEmail: { type: String, default: null },
    rootFolderId: { type: String, default: null },

    /** Encrypted at rest with `STORAGE_TOKEN_KEY`; never returned by any endpoint. */
    refreshTokenCipher: { type: String, default: null, select: false },

    connectedBy: { type: String, default: null },
    connectedAt: { type: Date, default: null },
    lastQuotaBytes: { type: Number, default: null },
    lastQuotaLimit: { type: Number, default: null },
    lastCheckedAt: { type: Date, default: null },
    lastError: { type: String, default: null },
  },
  { timestamps: true, strict: 'throw', versionKey: false, collection: 'storage_account' },
);

export const StorageAccountModel = model('StorageAccount', storageAccountSchema);
