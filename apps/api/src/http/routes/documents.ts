import { Router, type Router as ExpressRouter } from 'express';
import { pipeline } from 'node:stream/promises';
import {
  confirmUpload,
  listPhotos,
  listDocuments,
  openDocument,
  removeDocument,
  requestUpload,
  storageStatus,
} from '../../application/documents/documents.js';
import { requireRole, userOf } from '../middleware/authenticate.js';
import { documentStorage } from '../../container.js';

/**
 * Uploading, listing and reading the papers behind a listing.
 *
 * Only brokers and administrators get anywhere near these. A document is not part of the
 * public record of a listing — a 7/12 extract carries the holder's name and the survey
 * number, which together identify a real person's land, and publishing that would be a
 * privacy failure regardless of what it does for buyer confidence.
 *
 * Two routers, each on a prefix that is entirely private. A single router mounted at
 * `/api/v1` with a blanket guard would guard everything below that prefix — the mistake
 * that briefly made the public contact form return 401 in Phase 9, and one this file is
 * not going to repeat.
 */
export const documentRouter: ExpressRouter = Router();
/** Mounted under `/api/v1/properties`, alongside the listing routes. */
export const propertyDocumentRouter: ExpressRouter = Router({ mergeParams: true });

documentRouter.use(requireRole('broker', 'admin'));
propertyDocumentRouter.use(requireRole('broker', 'admin'));

/** What an administrator's banner reads: connected, and how full. */
documentRouter.get('/storage', requireRole('admin'), async (_req, res, next) => {
  try {
    res.json({ data: await storageStatus(documentStorage()) });
  } catch (error) {
    next(error);
  }
});

/** The photographs on a listing, for the broker editing it. */
propertyDocumentRouter.get('/:id/photos', async (req, res, next) => {
  try {
    res.json({ data: await listPhotos(String(req.params.id)) });
  } catch (error) {
    next(error);
  }
});

propertyDocumentRouter.get('/:id/documents', async (req, res, next) => {
  try {
    const includeSuperseded = req.query.history === 'true';
    res.json({ data: await listDocuments(String(req.params.id), includeSuperseded) });
  } catch (error) {
    next(error);
  }
});

/** Step one of three. The browser then sends the bytes straight to the returned URL. */
propertyDocumentRouter.post('/:id/documents/upload-session', async (req, res, next) => {
  try {
    const result = await requestUpload(
      String(req.params.id),
      userOf(req),
      req.body,
      documentStorage(),
    );
    res.status(201).json({ data: result });
  } catch (error) {
    next(error);
  }
});

/** Step three. Step two happened between the browser and the storage provider. */
documentRouter.post('/:documentId/confirm', async (req, res, next) => {
  try {
    const result = await confirmUpload(
      String(req.params.documentId),
      userOf(req),
      req.body,
      documentStorage(),
    );
    res.status(result.status === 'duplicate' ? 200 : 201).json({
      data: result,
      message:
        result.status === 'duplicate'
          ? 'That file is already attached to this listing.'
          : 'Uploaded.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * The viewer (P7.2).
 *
 * Streamed through us rather than handed out as a Drive link. A link would either be
 * public — anyone with the URL could read a stranger's land records — or would need the
 * viewer to have a Google account. Proxying keeps one authorisation rule: the broker who
 * owns the listing, and an administrator.
 */
documentRouter.get('/:documentId/content', async (req, res, next) => {
  try {
    const { stream, fileName, mimeType } = await openDocument(
      String(req.params.documentId),
      userOf(req),
      documentStorage(),
    );

    res.setHeader('Content-Type', mimeType);
    // `inline` so a reviewer reads a PDF in the browser instead of downloading it, but the
    // filename is quoted and stripped of anything that could break out of the header.
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${fileName.replace(/[^\w.\- ]/g, '_')}"`,
    );
    // Never cached by a shared proxy: this is somebody's land record.
    res.setHeader('Cache-Control', 'private, no-store');

    await pipeline(stream, res);
  } catch (error) {
    next(error);
  }
});

documentRouter.delete('/:documentId', async (req, res, next) => {
  try {
    await removeDocument(String(req.params.documentId), userOf(req));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

