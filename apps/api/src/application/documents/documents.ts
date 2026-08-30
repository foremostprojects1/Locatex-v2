import mongoose from 'mongoose';
import {
  MAX_DOCUMENTS_PER_PROPERTY,
  MAX_IMAGES_PER_PROPERTY,
  PAPERWORK_CATEGORIES,
  confirmUploadSchema,
  readQuota,
  requestUploadSchema,
  type RequestUploadInput,
} from '@locatex/contracts';
import {
  PropertyDocumentModel,
  StorageAccountModel,
  UploadSessionModel,
} from '../../infrastructure/db/models/Document.js';
import { PropertyModel } from '../../infrastructure/db/models/Property.js';
import { recordAudit } from '../../infrastructure/db/models/AuditEvent.js';
import { logger } from '../../infrastructure/observability/logger.js';
import { actorFor, type StatusActor } from '../../domain/property/status.js';
import { AppError } from '../../shared/AppError.js';
import type { DocumentStorage } from '../ports/documentStorage.js';

/**
 * Uploading the papers behind a listing.
 *
 * The flow is three calls, not one: ask for a session, send the bytes straight to the
 * storage provider, then confirm. That shape exists because a 25 MB scan from a phone on a
 * village connection must not travel through our process — holding it in memory, doubling
 * the bandwidth, and blocking the event loop for the length of a slow upload.
 *
 * The consequence is that the server never sees the bytes, so it verifies them afterwards:
 * the provider reports the size and checksum of what actually landed, and a mismatch fails
 * the document rather than recording a truncated file as fine.
 */

const ROOT_FOLDER_NAME = 'LocateX Property Documents';

async function ownedProperty(propertyId: string, user: StatusActor) {
  const property = await PropertyModel.findOne({ _id: propertyId, deletedAt: null })
    .select('_id brokerId status')
    .lean();

  if (!property) throw AppError.notFound('Listing');
  if (!actorFor(property, user)) {
    throw new AppError('NOT_OWNER', 'This listing belongs to another broker.');
  }
  return property;
}

/**
 * Step one: reserve a document row and ask storage for somewhere to put the file.
 *
 * The row is written before the bytes exist so a failed upload leaves a trace — the exact
 * failure mode that destroyed v1's documents was one that left nothing behind at all.
 */
export async function requestUpload(
  propertyId: string,
  user: StatusActor,
  input: RequestUploadInput,
  storage: DocumentStorage,
): Promise<{ documentId: string; uploadUrl: string; expiresAt: Date }> {
  const data = requestUploadSchema.parse(input);
  // Called for the ownership check it performs, which throws if this is not the caller's.
  await ownedProperty(propertyId, user);

  if (!(await storage.isConnected())) {
    throw new AppError(
      'STORAGE_UNAVAILABLE',
      'Document storage is not connected yet. Our team has been told.',
    );
  }

  await assertRoomInStorage(storage);

  // Photographs and paperwork have separate allowances. Sharing one would mean a broker
  // choosing between showing the land and proving the title.
  const isPhoto = data.category === 'photo';
  const limit = isPhoto ? MAX_IMAGES_PER_PROPERTY : MAX_DOCUMENTS_PER_PROPERTY;

  const live = await PropertyDocumentModel.countDocuments({
    propertyId,
    category: isPhoto
      ? 'photo'
      : mongoose.trusted({ $in: [...PAPERWORK_CATEGORIES] }),
    status: mongoose.trusted({ $ne: 'deleted' }),
    deletedAt: null,
  });

  if (live >= limit) {
    throw new AppError(
      'CONFLICT',
      isPhoto
        ? `A listing can carry ${limit} photographs. Remove one first.`
        : `A listing can carry ${limit} documents. Remove one first.`,
    );
  }

  const rootId = await rootFolder(storage);
  // Named by the listing's id, never by its title: titles are edited, and a folder found
  // by name is a folder that will one day be the wrong one.
  const folderId = await storage.ensureFolder(`PROP-${propertyId}`, rootId);

  // A re-issued document supersedes the previous one rather than replacing it: the old
  // 7/12 is what a buyer saw last week, and losing it loses the record of the sale.
  const previous = await PropertyDocumentModel.findOne({
    propertyId,
    category: data.category,
    status: 'uploaded',
    deletedAt: null,
  })
    .sort({ version: -1 })
    .lean();

  const document = await PropertyDocumentModel.create({
    propertyId,
    uploadedBy: user.id,
    category: data.category,
    fileName: data.fileName,
    mimeType: data.mimeType,
    sizeBytes: data.sizeBytes,
    folderId,
    status: 'pending',
    version: (previous?.version ?? 0) + 1,
  });

  const session = await storage.createUploadSession({
    folderId,
    fileName: `${data.category}-v${document.version}-${data.fileName}`,
    mimeType: data.mimeType,
    sizeBytes: data.sizeBytes,
  });

  await UploadSessionModel.create({
    documentId: document.id,
    propertyId,
    createdBy: user.id,
    uploadUrl: session.uploadUrl,
    externalId: session.externalId,
    expiresAt: session.expiresAt,
  });

  return {
    documentId: document.id,
    uploadUrl: session.uploadUrl,
    expiresAt: session.expiresAt,
  };
}

/**
 * Step three: the client says it finished, and we check.
 *
 * The client's claimed checksum is compared against what the provider reports actually
 * arrived. They disagree when an upload was truncated, retried into the wrong session, or
 * quietly failed — and a document recorded as fine when it is half a file is worse than no
 * document, because nobody looks at it again until it matters.
 */
export async function confirmUpload(
  documentId: string,
  user: StatusActor,
  input: unknown,
  storage: DocumentStorage,
): Promise<{ status: 'uploaded' | 'duplicate'; documentId: string }> {
  const claimed = confirmUploadSchema.parse(input);

  const document = await PropertyDocumentModel.findById(documentId);
  if (!document) throw AppError.notFound('Document');
  await ownedProperty(document.propertyId, user);

  const session = await UploadSessionModel.findOne({ documentId, status: 'open' });
  if (!session) {
    throw new AppError('CONFLICT', 'That upload has already been finished or has expired.');
  }

  if (session.expiresAt.getTime() < Date.now()) {
    session.status = 'expired';
    await session.save();
    document.status = 'failed';
    document.error = 'the upload took too long and the session expired';
    await document.save();
    throw new AppError('CONFLICT', 'That upload took too long. Please try again.');
  }

  const stored = await storage.finalizeUpload({
    uploadUrl: session.uploadUrl,
    externalId: session.externalId ?? null,
  });

  if (!stored) {
    document.status = 'failed';
    document.error = 'the file never arrived in storage';
    await document.save();
    session.status = 'aborted';
    await session.save();
    throw new AppError('STORAGE_UNAVAILABLE', 'That upload did not complete. Please try again.');
  }

  if (stored.checksum !== claimed.checksum || stored.sizeBytes !== claimed.sizeBytes) {
    // Remove what landed: a partial file in Drive is an orphan nobody will ever identify.
    await storage.remove(stored.externalId).catch(() => undefined);
    document.status = 'failed';
    document.error = 'the uploaded file did not match what was sent';
    await document.save();
    session.status = 'aborted';
    await session.save();

    throw new AppError(
      'CONFLICT',
      'The upload arrived incomplete. Please try again on a steadier connection.',
    );
  }

  // The same bytes already on this listing: keep one, and say so plainly.
  const duplicate = await PropertyDocumentModel.findOne({
    propertyId: document.propertyId,
    checksum: stored.checksum,
    status: 'uploaded',
    deletedAt: null,
  }).lean();

  if (duplicate) {
    await storage.remove(stored.externalId).catch(() => undefined);
    await document.deleteOne();
    session.status = 'completed';
    await session.save();
    return { status: 'duplicate', documentId: String(duplicate._id) };
  }

  document.externalId = stored.externalId;
  document.folderId = stored.folderId || document.folderId;
  document.checksum = stored.checksum;
  document.sizeBytes = stored.sizeBytes;
  document.status = 'uploaded';
  document.uploadedAt = new Date();
  document.error = null;
  await document.save();

  session.status = 'completed';
  session.completedAt = new Date();
  await session.save();

  // Mark the previous version superseded, without deleting it.
  await PropertyDocumentModel.updateMany(
    {
      propertyId: document.propertyId,
      category: document.category,
      status: 'uploaded',
      version: mongoose.trusted({ $lt: document.version }),
      supersededBy: null,
    },
    { $set: { supersededBy: document.id } },
  );

  await recordAudit({
    actorId: user.id,
    actorRole: user.role,
    action: 'document.upload',
    subjectType: 'property',
    subjectId: document.propertyId,
    metadata: { documentId: document.id, category: document.category, version: document.version },
  });

  return { status: 'uploaded', documentId: document.id };
}

export async function listDocuments(propertyId: string, includeSuperseded = false) {
  const filter: Record<string, unknown> = {
    propertyId,
    status: 'uploaded',
    deletedAt: null,
    category: mongoose.trusted({ $in: [...PAPERWORK_CATEGORIES] }),
  };
  if (!includeSuperseded) filter.supersededBy = null;

  const rows = await PropertyDocumentModel.find(filter).sort({ category: 1, version: -1 }).lean();

  return rows.map((row) => ({
    id: String(row._id),
    category: row.category,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    version: row.version,
    supersededBy: row.supersededBy,
    uploadedAt: row.uploadedAt,
  }));
}

/**
 * Deleting is soft, and the bytes stay.
 *
 * A broker removing a document from a live listing is usually correcting a mistake, but
 * occasionally it is someone tidying away an inconvenient extract after a dispute has
 * started. The row and the file both survive; only the listing stops showing it.
 */
export async function removeDocument(
  documentId: string,
  user: StatusActor,
): Promise<void> {
  const document = await PropertyDocumentModel.findById(documentId);
  if (!document) throw AppError.notFound('Document');
  await ownedProperty(document.propertyId, user);

  document.deletedAt = new Date();
  await document.save();

  await recordAudit({
    actorId: user.id,
    actorRole: user.role,
    action: 'document.remove',
    subjectType: 'property',
    subjectId: document.propertyId,
    metadata: { documentId, category: document.category },
  });
}

/** Who may read a document: the broker who owns the listing, and an administrator. */
export async function openDocument(
  documentId: string,
  user: StatusActor,
  storage: DocumentStorage,
) {
  const document = await PropertyDocumentModel.findById(documentId).lean();
  if (!document || document.status !== 'uploaded' || !document.externalId) {
    throw AppError.notFound('Document');
  }

  const property = await PropertyModel.findOne({ _id: document.propertyId })
    .select('brokerId')
    .lean();
  if (!property || !actorFor(property, user)) throw AppError.notFound('Document');

  const stream = await storage.download(document.externalId);
  if (!stream) throw new AppError('STORAGE_UNAVAILABLE', 'That document could not be read.');

  await recordAudit({
    actorId: user.id,
    actorRole: user.role,
    action: 'document.view',
    subjectType: 'property',
    subjectId: document.propertyId,
    metadata: { documentId },
  });

  return { stream, fileName: document.fileName, mimeType: document.mimeType };
}

/** The root folder id, resolved once and remembered. */
async function rootFolder(storage: DocumentStorage): Promise<string> {
  const account = await StorageAccountModel.findById('google_drive');
  if (account?.rootFolderId) return account.rootFolderId;

  const id = await storage.ensureFolder(ROOT_FOLDER_NAME);
  await StorageAccountModel.updateOne(
    { _id: 'google_drive' },
    { $set: { rootFolderId: id } },
    { upsert: true },
  );
  return id;
}

/**
 * Refuses an upload when the Drive is nearly full.
 *
 * The client declined a storage upgrade, so 15 GB is the whole system. Stopping at 97%
 * rather than at 100% is deliberate: an upload that fails partway leaves an orphan, and a
 * Drive with no room at all is harder to clear than one with a little.
 */
export async function assertRoomInStorage(storage: DocumentStorage): Promise<void> {
  const reading = await storage.quota();
  if (!reading) return;

  const quota = readQuota(reading.usedBytes, reading.limitBytes);

  await StorageAccountModel.updateOne(
    { _id: 'google_drive' },
    {
      $set: {
        lastQuotaBytes: reading.usedBytes,
        lastQuotaLimit: reading.limitBytes,
        lastCheckedAt: new Date(),
      },
    },
    { upsert: true },
  );

  if (quota.shouldBlock) {
    logger.error({ fraction: quota.fraction }, 'document storage is full — uploads refused');
    throw new AppError(
      'STORAGE_QUOTA_EXCEEDED',
      'Document storage is full. Our team has been told; please try again shortly.',
    );
  }

  if (quota.shouldWarn) {
    logger.warn({ fraction: quota.fraction }, 'document storage is nearly full');
  }
}

/** The reading behind the administrator's banner. */
export async function storageStatus(storage: DocumentStorage) {
  const account = await StorageAccountModel.findById('google_drive').lean();
  const reading = await storage.quota();

  if (!reading) {
    return {
      connected: Boolean(account?.connected),
      accountEmail: account?.accountEmail ?? null,
      quota: null,
    };
  }

  return {
    connected: true,
    accountEmail: account?.accountEmail ?? null,
    quota: readQuota(reading.usedBytes, reading.limitBytes),
  };
}

/**
 * Sweeps up uploads that were started and never finished.
 *
 * Without this, every abandoned upload leaves a pending row and possibly bytes in Drive
 * that nothing references — and on a 15 GB account, orphans are the thing that fills it.
 */
export async function sweepAbandonedUploads(
  storage: DocumentStorage,
  now: Date = new Date(),
): Promise<number> {
  const stale = await UploadSessionModel.find({
    status: 'open',
    expiresAt: mongoose.trusted({ $lt: now }),
  }).limit(500);

  for (const session of stale) {
    session.status = 'expired';
    await session.save();

    const document = await PropertyDocumentModel.findById(session.documentId);
    if (document && document.status === 'pending') {
      document.status = 'failed';
      document.error = 'the upload was never finished';
      await document.save();
    }

    if (session.externalId) {
      await storage.remove(session.externalId).catch(() => undefined);
    }
  }

  if (stale.length > 0) logger.info({ count: stale.length }, 'swept abandoned uploads');
  return stale.length;
}


/**
 * The photographs on a listing, in upload order.
 *
 * Separate from `listDocuments` because these are the one kind of upload that is public:
 * a buyer who has not signed in still sees them, so they cannot go through the authorised
 * document viewer.
 */
export async function listPhotos(propertyId: string) {
  const rows = await PropertyDocumentModel.find({
    propertyId,
    category: 'photo',
    status: 'uploaded',
    deletedAt: null,
  })
    .sort({ _id: 1 })
    .lean();

  return rows.map((row) => ({
    id: String(row._id),
    url: `/api/v1/images/${String(row._id)}`,
    fileName: row.fileName,
    sizeBytes: row.sizeBytes,
  }));
}

/**
 * Streams a listing photograph to anyone.
 *
 * The check is on the *listing*, not the viewer: a photograph attached to an approved
 * listing is public, and one attached to a draft is not — otherwise a listing could be
 * previewed by anyone who guessed an id before its broker had submitted it.
 */
export async function openPhoto(documentId: string, storage: DocumentStorage) {
  const document = await PropertyDocumentModel.findOne({
    _id: documentId,
    category: 'photo',
    status: 'uploaded',
    deletedAt: null,
  }).lean();

  if (!document?.externalId) throw AppError.notFound('Photograph');

  const property = await PropertyModel.findOne({ _id: document.propertyId, deletedAt: null })
    .select('status')
    .lean();

  const visible = ['approved', 'sold', 'rented'].includes(String(property?.status));
  if (!visible) throw AppError.notFound('Photograph');

  const stream = await storage.download(document.externalId);
  if (!stream) throw AppError.notFound('Photograph');

  return { stream, mimeType: document.mimeType, fileName: document.fileName };
}
