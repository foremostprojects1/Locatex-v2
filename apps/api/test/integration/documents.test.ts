import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, resetDatabase, type Harness } from '../helpers/harness.js';
import { registerAndVerify, signIn } from '../helpers/actors.js';
import { InMemoryDocumentStorage } from '../../src/application/ports/documentStorage.js';

let app: Express;
let harness: Harness;
let storage: InMemoryDocumentStorage;

const stubGeocoder = {
  lookupPincode: vi.fn(async () => ({
    lat: 22.8117,
    lng: 70.8319,
    radiusMetres: 9_400,
    source: 'nominatim' as const,
  })),
};

beforeAll(async () => {
  harness = await startHarness();
  app = harness.app;

  const { setGeocoder, setDocumentStorage } = await import('../../src/container.js');
  setGeocoder(stubGeocoder);
  storage = new InMemoryDocumentStorage();
  setDocumentStorage(storage);

  const indiaPost = await import('../../src/infrastructure/geo/indiaPost.js');
  vi.spyOn(indiaPost, 'lookupPostalPincode').mockResolvedValue(null);

  const { seedReferenceData } = await import('../../scripts/seed-reference.js');
  await seedReferenceData();
}, 180_000);

afterAll(async () => {
  const { setGeocoder, setDocumentStorage } = await import('../../src/container.js');
  setGeocoder(undefined);
  setDocumentStorage(undefined);
  await stopHarness();
});

beforeEach(async () => {
  await resetDatabase({ keepReference: true });
  storage.clear();
});

async function actor(role: 'buyer' | 'broker' | 'admin') {
  const account = await registerAndVerify(app, harness.outbox);
  if (role !== 'buyer') {
    const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
    await UserModel.updateOne({ _id: account.userId }, { $set: { role } });
  }
  const session = await signIn(app, { identifier: account.email, password: account.password });
  return { ...session, account };
}

const listing = () => ({
  title: 'Fertile farmland with borewell near Morbi',
  propertyType: 'land',
  listingType: 'rent',
  pricePaise: 72_00_000_00,
  area: { value: 4, unit: 'vigha' },
  location: {
    district: 'morbi',
    taluka: 'morbi',
    pincode: '363641',
    precision: 'approx',
    source: 'pincode',
  },
  contact: { name: 'Ramesh Patel', email: 'ramesh@example.com', phone: '9876543210' },
});

const sha256 = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');

/**
 * Superagent only buffers responses it recognises as text, and a document is served as a
 * PDF. Without this the body arrives as `undefined` and an assertion about the streamed
 * bytes silently checks nothing.
 */
function binaryParser(res: unknown, callback: (error: Error | null, body: Buffer) => void): void {
  const stream = res as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
  stream.on('end', () => callback(null, Buffer.concat(chunks)));
}

/**
 * The whole three-step upload, as a browser performs it: ask, send the bytes straight to
 * storage, confirm. Step two never touches our API, which is the point of the design.
 */
async function upload(
  broker: Awaited<ReturnType<typeof actor>>,
  propertyId: string,
  bytes: Buffer,
  category = 'doc_712',
  fileName = 'satbara.pdf',
) {
  const session = await broker
    .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
    .send({ category, fileName, mimeType: 'application/pdf', sizeBytes: bytes.byteLength })
    .expect(201);

  await storage.receiveBytes(session.body.data.uploadUrl, bytes);

  const confirmed = await broker
    .post(`/api/v1/documents/${session.body.data.documentId}/confirm`)
    .send({ checksum: sha256(bytes), sizeBytes: bytes.byteLength });

  return { session: session.body.data, confirmed };
}

async function aListing(broker: Awaited<ReturnType<typeof actor>>) {
  const created = await broker.post('/api/v1/properties').send(listing()).expect(201);
  return created.body.data.id as string;
}

describe('uploading a document', () => {
  it('goes through the three steps and records what landed', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);
    const bytes = Buffer.from('a scanned 7/12 extract');

    const { confirmed } = await upload(broker, propertyId, bytes);
    expect(confirmed.status).toBe(201);
    expect(confirmed.body.data.status).toBe('uploaded');

    const documents = await broker.agent
      .get(`/api/v1/properties/${propertyId}/documents`)
      .expect(200);

    expect(documents.body.data).toHaveLength(1);
    expect(documents.body.data[0]).toMatchObject({
      category: 'doc_712',
      fileName: 'satbara.pdf',
      version: 1,
      sizeBytes: bytes.byteLength,
    });
  });

  it('refuses a file that arrived truncated rather than recording it as fine', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);
    const intended = Buffer.from('the whole document, all of it');

    const session = await broker
      .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
      .send({
        category: 'doc_712',
        fileName: 'satbara.pdf',
        mimeType: 'application/pdf',
        sizeBytes: intended.byteLength,
      })
      .expect(201);

    // The connection dropped: only part of the file reached storage.
    await storage.receiveBytes(session.body.data.uploadUrl, intended.subarray(0, 10));

    const confirmed = await broker
      .post(`/api/v1/documents/${session.body.data.documentId}/confirm`)
      .send({ checksum: sha256(intended), sizeBytes: intended.byteLength })
      .expect(409);

    expect(confirmed.body.error.message).toContain('incomplete');

    // Nothing is listed, and the partial file was cleaned out of storage rather than
    // left as an orphan nobody could ever identify.
    const documents = await broker.agent
      .get(`/api/v1/properties/${propertyId}/documents`)
      .expect(200);
    expect(documents.body.data).toHaveLength(0);
    expect((await storage.quota())?.usedBytes).toBe(0);
  });

  it('leaves a record when the file never arrives at all', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);
    const bytes = Buffer.from('never sent');

    const session = await broker
      .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
      .send({
        category: 'doc_8a',
        fileName: '8a.pdf',
        mimeType: 'application/pdf',
        sizeBytes: bytes.byteLength,
      })
      .expect(201);

    await broker
      .post(`/api/v1/documents/${session.body.data.documentId}/confirm`)
      .send({ checksum: sha256(bytes), sizeBytes: bytes.byteLength })
      .expect(503);

    // v1's failure mode was leaving nothing at all behind. There is a row here saying why.
    const { PropertyDocumentModel } = await import(
      '../../src/infrastructure/db/models/Document.js'
    );
    const record = await PropertyDocumentModel.findById(session.body.data.documentId).lean();
    expect(record?.status).toBe('failed');
    expect(record?.error).toContain('never arrived');
  });

  it('keeps one copy when the same file is uploaded twice', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);
    const bytes = Buffer.from('the same bytes both times');

    const first = await upload(broker, propertyId, bytes);
    const second = await upload(broker, propertyId, bytes, 'doc_712', 'satbara-copy.pdf');

    expect(second.confirmed.status).toBe(200);
    expect(second.confirmed.body.data.status).toBe('duplicate');
    expect(second.confirmed.body.data.documentId).toBe(first.confirmed.body.data.documentId);

    const documents = await broker.agent
      .get(`/api/v1/properties/${propertyId}/documents`)
      .expect(200);
    expect(documents.body.data).toHaveLength(1);
  });

  it('supersedes the old version instead of destroying it', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);

    await upload(broker, propertyId, Buffer.from('the 2024 extract'));
    await upload(broker, propertyId, Buffer.from('the re-issued 2026 extract'));

    const current = await broker.agent
      .get(`/api/v1/properties/${propertyId}/documents`)
      .expect(200);
    expect(current.body.data).toHaveLength(1);
    expect(current.body.data[0].version).toBe(2);

    // The old one is still there: it is what a buyer saw last week.
    const history = await broker.agent
      .get(`/api/v1/properties/${propertyId}/documents?history=true`)
      .expect(200);
    expect(history.body.data).toHaveLength(2);
    expect(history.body.data.find((row: { version: number }) => row.version === 1)).toBeTruthy();
  });

  it('refuses a file type nobody can review and one that is too big', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);

    await broker
      .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
      .send({
        category: 'other',
        fileName: 'macro.xlsm',
        mimeType: 'application/vnd.ms-excel.sheet.macroEnabled.12',
        sizeBytes: 1000,
      })
      .expect(400);

    await broker
      .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
      .send({
        category: 'doc_712',
        fileName: 'enormous.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 40 * 1024 * 1024,
      })
      .expect(400);
  });

  it('stops at ten documents', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);

    for (let index = 0; index < 10; index += 1) {
      await upload(broker, propertyId, Buffer.from(`document number ${index}`), 'other', `f${index}.pdf`);
    }

    const eleventh = await broker
      .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
      .send({
        category: 'other',
        fileName: 'one-too-many.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 100,
      })
      .expect(409);

    expect(eleventh.body.error.message).toContain('10 documents');
  });
});

describe('who may touch a document', () => {
  it('is the owning broker and an administrator, and nobody else', async () => {
    const broker = await actor('broker');
    const stranger = await actor('broker');
    const buyer = await actor('buyer');
    const admin = await actor('admin');

    const propertyId = await aListing(broker);
    const { confirmed } = await upload(broker, propertyId, Buffer.from('private land record'));
    const documentId = confirmed.body.data.documentId as string;

    // A buyer never gets near these: a 7/12 names a real person and their survey number.
    await buyer.agent.get(`/api/v1/documents/${documentId}/content`).expect(403);
    await request(app).get(`/api/v1/documents/${documentId}/content`).expect(401);

    // Another broker gets a 404, not a 403 — whether the document exists is not their business.
    await stranger.agent.get(`/api/v1/documents/${documentId}/content`).expect(404);

    const asOwner = await broker.agent
      .get(`/api/v1/documents/${documentId}/content`)
      .buffer(true)
      .parse(binaryParser)
      .expect(200);

    expect(asOwner.headers['content-type']).toContain('application/pdf');
    expect(asOwner.headers['cache-control']).toContain('no-store');
    // The bytes that come back are the bytes that went in.
    expect(Buffer.from(asOwner.body).toString('utf8')).toBe('private land record');

    // The reviewer has to be able to read it; that is the point of the queue.
    await admin.agent.get(`/api/v1/documents/${documentId}/content`).expect(200);
  });

  it('lets the owner remove one without destroying the record', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);
    const { confirmed } = await upload(broker, propertyId, Buffer.from('a mistaken upload'));
    const documentId = confirmed.body.data.documentId as string;

    await broker.del(`/api/v1/documents/${documentId}`).expect(204);

    const documents = await broker.agent
      .get(`/api/v1/properties/${propertyId}/documents`)
      .expect(200);
    expect(documents.body.data).toHaveLength(0);

    // Soft: the row survives, because sometimes a removal is somebody tidying away an
    // inconvenient extract after a dispute has started.
    const { PropertyDocumentModel } = await import(
      '../../src/infrastructure/db/models/Document.js'
    );
    const record = await PropertyDocumentModel.findById(documentId).lean();
    expect(record?.deletedAt).toBeTruthy();
  });
});

describe('storage headroom', () => {
  it('refuses uploads once the Drive is essentially full', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);

    storage.limitBytes = 1_000;
    storage.setUsedBytes(980); // 98%

    const response = await broker
      .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
      .send({
        category: 'doc_712',
        fileName: 'satbara.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
      })
      .expect(503);

    expect(response.body.error.code).toBe('STORAGE_QUOTA_EXCEEDED');
  });

  it('tells an administrator how full it is before it becomes a problem', async () => {
    const admin = await actor('admin');
    storage.limitBytes = 1_000;
    storage.setUsedBytes(850); // 85% — past the warning line, not the blocking one.

    const status = await admin.agent.get('/api/v1/documents/storage').expect(200);

    expect(status.body.data.connected).toBe(true);
    expect(status.body.data.quota.shouldWarn).toBe(true);
    expect(status.body.data.quota.shouldBlock).toBe(false);

    const broker = await actor('broker');
    await broker.agent.get('/api/v1/documents/storage').expect(403);
  });

  it('says plainly when no storage is connected instead of failing oddly', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);
    storage.connected = false;

    const response = await broker
      .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
      .send({
        category: 'doc_712',
        fileName: 'satbara.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 10,
      })
      .expect(503);

    expect(response.body.error.code).toBe('STORAGE_UNAVAILABLE');
  });
});

describe('uploads that were started and abandoned', () => {
  it('are swept up rather than left to fill the Drive', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);

    const session = await broker
      .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
      .send({
        category: 'utarotar',
        fileName: 'chain.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 500,
      })
      .expect(201);

    const { UploadSessionModel, PropertyDocumentModel } = await import(
      '../../src/infrastructure/db/models/Document.js'
    );
    // Age it past its expiry.
    await UploadSessionModel.updateOne(
      { documentId: session.body.data.documentId },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    const { sweepAbandonedUploads } = await import(
      '../../src/application/documents/documents.js'
    );
    expect(await sweepAbandonedUploads(storage)).toBe(1);

    const record = await PropertyDocumentModel.findById(session.body.data.documentId).lean();
    expect(record?.status).toBe('failed');
    expect(record?.error).toContain('never finished');

    // Sweeping again finds nothing: it is not a job that redoes its own work.
    expect(await sweepAbandonedUploads(storage)).toBe(0);
  });

  it('will not accept a confirmation after the session expired', async () => {
    const broker = await actor('broker');
    const propertyId = await aListing(broker);
    const bytes = Buffer.from('too late');

    const session = await broker
      .post(`/api/v1/properties/${propertyId}/documents/upload-session`)
      .send({
        category: 'na_order',
        fileName: 'na.pdf',
        mimeType: 'application/pdf',
        sizeBytes: bytes.byteLength,
      })
      .expect(201);

    const { UploadSessionModel } = await import('../../src/infrastructure/db/models/Document.js');
    await UploadSessionModel.updateOne(
      { documentId: session.body.data.documentId },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );

    await storage.receiveBytes(session.body.data.uploadUrl, bytes);
    const response = await broker
      .post(`/api/v1/documents/${session.body.data.documentId}/confirm`)
      .send({ checksum: sha256(bytes), sizeBytes: bytes.byteLength })
      .expect(409);

    expect(response.body.error.message).toContain('took too long');
  });
});

describe('the encryption around the stored refresh token', () => {
  it('round-trips, and refuses a ciphertext somebody edited', async () => {
    process.env.STORAGE_TOKEN_KEY = 'a-passphrase-long-enough-to-use';
    const { resetEnvForTests } = await import('../../src/config/env.js');
    resetEnvForTests();

    const { encryptToken, decryptToken } = await import(
      '../../src/infrastructure/storage/googleDrive.js'
    );

    const secret = '1//0abcdefghijklmnop-a-google-refresh-token';
    const cipher = encryptToken(secret);

    expect(cipher).not.toContain(secret);
    expect(decryptToken(cipher)).toBe(secret);

    // AES-GCM authenticates as well as encrypts, so a tampered ciphertext fails outright
    // rather than decrypting to plausible rubbish that then gets sent to Google.
    const [iv, tag, data] = cipher.split('.');
    const tampered = [iv, tag, `${data?.slice(0, -4)}AAAA`].join('.');
    expect(() => decryptToken(tampered)).toThrow();

    delete process.env.STORAGE_TOKEN_KEY;
    resetEnvForTests();
  });
});
