import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { WIZARD_STEPS, completedSteps, isDraftComplete, type PropertyDraftData } from '@locatex/contracts';
import {
  completeDraft,
  deleteDraft,
  getDraft,
  listDrafts,
  saveDraft,
  startDraft,
} from '../../application/property/drafts.js';
import { serializeProperty } from '../../domain/property/serialize.js';
import { recordAudit } from '../../infrastructure/db/models/AuditEvent.js';
import { requireRole, userOf } from '../middleware/authenticate.js';
import type { PropertyDraftDoc } from '../../infrastructure/db/models/PropertyDraft.js';

/**
 * The submit wizard's endpoints. Every one of them is a broker acting on their own draft,
 * so the router is guarded once here rather than in each handler.
 */
export const propertyDraftRouter: ExpressRouter = Router();

propertyDraftRouter.use(requireRole('broker', 'admin'));

const view = (draft: PropertyDraftDoc) => {
  const data = (draft.data ?? {}) as PropertyDraftData;
  return {
    id: draft.id as string,
    propertyId: draft.propertyId,
    step: draft.step,
    data,
    steps: WIZARD_STEPS,
    completed: completedSteps(data),
    isComplete: isDraftComplete(data),
    lastSavedAt: draft.lastSavedAt,
    updatedAt: draft.updatedAt,
  };
};

propertyDraftRouter.get('/', async (req, res, next) => {
  try {
    const drafts = await listDrafts(userOf(req).id);
    res.json({ data: drafts.map(view) });
  } catch (error) {
    next(error);
  }
});

propertyDraftRouter.post('/', async (req, res, next) => {
  try {
    const { propertyId } = z
      .object({ propertyId: z.string().min(1).max(40).optional() })
      .strict()
      .parse(req.body ?? {});

    const draft = await startDraft(userOf(req).id, propertyId);
    res.status(201).json({ data: view(draft) });
  } catch (error) {
    next(error);
  }
});

propertyDraftRouter.get('/:id', async (req, res, next) => {
  try {
    const draft = await getDraft(String(req.params.id), userOf(req));
    res.json({ data: view(draft) });
  } catch (error) {
    next(error);
  }
});

/**
 * Autosave. Answers with the progress the server now believes in, so the wizard's rail is
 * driven by the saved state rather than by what the browser hopes was saved.
 */
propertyDraftRouter.put('/:id', async (req, res, next) => {
  try {
    const draft = await saveDraft(String(req.params.id), userOf(req), req.body);
    res.json({ data: view(draft) });
  } catch (error) {
    next(error);
  }
});

propertyDraftRouter.delete('/:id', async (req, res, next) => {
  try {
    await deleteDraft(String(req.params.id), userOf(req));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

propertyDraftRouter.post('/:id/complete', async (req, res, next) => {
  try {
    const user = userOf(req);
    const property = await completeDraft(String(req.params.id), user);

    await recordAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'property.draft-completed',
      subjectType: 'property',
      subjectId: property.id,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.status(201).json({ data: serializeProperty(property, 'owner') });
  } catch (error) {
    next(error);
  }
});
