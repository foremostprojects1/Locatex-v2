import { createHash } from 'node:crypto';
import { Router, type Request, type Response, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import {
  DistrictModel,
  LandAttributeModel,
  PincodeModel,
  TalukaModel,
  VillageModel,
} from '../../infrastructure/db/models/Reference.js';
import { resolvePincode } from '../../infrastructure/geo/pincodeLocation.js';
import { lookupPostalPincode } from '../../infrastructure/geo/indiaPost.js';
import { AppError } from '../../shared/AppError.js';
import { geocoder } from '../../container.js';

/**
 * Reference data: the cascade behind every address field, and the vocabulary a listing is
 * described with. Public, read-only, and stable for months at a time — so each response
 * carries a strong ETag and a long `max-age`, and a repeat visitor's browser answers most
 * of these itself.
 */

const CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800';

function sendCached(req: Request, res: Response, payload: unknown): void {
  const body = JSON.stringify(payload);
  const etag = `W/"${createHash('sha1').update(body).digest('base64url')}"`;

  res.setHeader('Cache-Control', CACHE_CONTROL);
  res.setHeader('ETag', etag);

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }
  res.type('application/json').send(body);
}

export const referenceRouter: ExpressRouter = Router();

referenceRouter.get('/districts', async (_req, res, next) => {
  try {
    const districts = await DistrictModel.find({}).sort({ name: 1 }).lean();
    sendCached(_req, res, {
      data: districts.map((district) => ({
        slug: district._id,
        name: district.name,
        talukaCount: district.talukaCount,
      })),
    });
  } catch (error) {
    next(error);
  }
});

referenceRouter.get('/talukas', async (req, res, next) => {
  try {
    const { district } = z.object({ district: z.string().min(1) }).parse(req.query);
    const talukas = await TalukaModel.find({ districtSlug: district }).sort({ name: 1 }).lean();
    if (talukas.length === 0) throw AppError.notFound('District');

    sendCached(req, res, {
      data: talukas.map((taluka) => ({ slug: taluka.slug, name: taluka.name })),
    });
  } catch (error) {
    next(error);
  }
});

referenceRouter.get('/villages', async (req, res, next) => {
  try {
    const { district, taluka, q } = z
      .object({
        district: z.string().min(1),
        taluka: z.string().min(1),
        q: z.string().trim().max(60).optional(),
      })
      .parse(req.query);

    const filter: Record<string, unknown> = { districtSlug: district, talukaSlug: taluka };
    // A RegExp instance rather than `{ $regex: … }`: Mongoose's `sanitizeFilter` rewrites
    // any plain object whose keys start with `$`, which is what stops a query string from
    // smuggling in an operator. The user's text is escaped before it becomes a pattern.
    if (q) filter.name = new RegExp(`^${escapeRegex(q)}`, 'i');

    const villages = await VillageModel.find(filter).sort({ name: 1 }).limit(500).lean();

    sendCached(req, res, {
      data: villages.map((village) => ({
        slug: village.slug,
        name: village.name,
        pincode: village.pincode,
      })),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * What we know about a pincode: its district and taluka from our own data, the villages
 * that share it, and — resolved on first use — a centroid with a measured radius.
 *
 * India Post is consulted alongside, and any disagreement is reported rather than hidden.
 * Its district names are years out of date (363641 still reads "Rajkot" though Morbi split
 * off in 2013), so the form can warn without silently overwriting the broker's choice.
 */
referenceRouter.get('/pincode/:pincode', async (req, res, next) => {
  try {
    const { pincode } = z
      .object({ pincode: z.string().regex(/^\d{6}$/, 'A pincode is six digits') })
      .parse(req.params);

    const record = await PincodeModel.findById(pincode).lean();
    if (!record) {
      throw new AppError('NOT_FOUND', `We have no record of pincode ${pincode} in Gujarat.`);
    }

    const [villages, location, postal] = await Promise.all([
      VillageModel.find({ pincode }).sort({ name: 1 }).limit(100).lean(),
      resolvePincode(pincode, geocoder()),
      lookupPostalPincode(pincode),
    ]);

    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json({
      pincode,
      district: record.districtSlug,
      taluka: record.talukaSlug,
      villages: villages.map((village) => ({ slug: village.slug, name: village.name })),
      location: location
        ? {
            lat: location.lat,
            lng: location.lng,
            radiusMetres: location.radiusMetres,
            source: location.source,
          }
        : null,
      postal: postal
        ? {
            district: postal.district,
            block: postal.block,
            offices: postal.offices.slice(0, 20),
            /** True when India Post disagrees with our district — usually because it is stale. */
            disagreesWithOurDistrict:
              slugify(postal.district) !== record.districtSlug,
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});

referenceRouter.get('/land-attributes', async (req, res, next) => {
  try {
    const attributes = await LandAttributeModel.find({ isActive: true })
      .sort({ kind: 1, order: 1 })
      .lean();

    sendCached(req, res, {
      amenities: attributes
        .filter((attribute) => attribute.kind === 'amenity')
        .map(toAttribute),
      disadvantages: attributes
        .filter((attribute) => attribute.kind === 'disadvantage')
        .map(toAttribute),
    });
  } catch (error) {
    next(error);
  }
});

// `_id` is declared without a default in the schema, so Mongoose types it as optional even
// though every seeded row has one; String() keeps the response type honest either way.
const toAttribute = (attribute: {
  _id?: string | null;
  label: string;
  group: string;
}) => ({ slug: String(attribute._id), label: attribute.label, group: attribute.group });

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const slugify = (value: string): string =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
