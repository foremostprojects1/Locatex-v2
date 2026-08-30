import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startHarness, stopHarness, resetDatabase, type Harness } from '../helpers/harness.js';
import { registerAndVerify, signIn } from '../helpers/actors.js';

let app: Express;
let harness: Harness;

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
  const { setGeocoder } = await import('../../src/container.js');
  setGeocoder(stubGeocoder);
  const indiaPost = await import('../../src/infrastructure/geo/indiaPost.js');
  vi.spyOn(indiaPost, 'lookupPostalPincode').mockResolvedValue(null);
  const { seedReferenceData } = await import('../../scripts/seed-reference.js');
  await seedReferenceData();
}, 180_000);

afterAll(async () => {
  const { setGeocoder } = await import('../../src/container.js');
  setGeocoder(undefined);
  await stopHarness();
});

beforeEach(async () => {
  await resetDatabase({ keepReference: true });
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

const listing = (overrides: Record<string, unknown> = {}) => ({
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
  ...overrides,
});

async function publish(
  broker: Awaited<ReturnType<typeof actor>>,
  admin: Awaited<ReturnType<typeof actor>>,
) {
  const created = await broker.post('/api/v1/properties').send(listing()).expect(201);
  const id = created.body.data.id as string;
  await broker.post(`/api/v1/properties/${id}/status`).send({ action: 'submit' }).expect(200);
  await admin.post(`/api/v1/properties/${id}/status`).send({ action: 'approve' }).expect(200);
  return id;
}

/** A buyer, a broker, an approved listing and an open conversation. */
async function conversation() {
  const broker = await actor('broker');
  const admin = await actor('admin');
  const buyer = await actor('buyer');
  const propertyId = await publish(broker, admin);

  const opened = await buyer
    .post('/api/v1/chat/threads')
    .send({ propertyId, body: 'Is the borewell working?' })
    .expect(201);

  return { broker, admin, buyer, propertyId, threadId: opened.body.data.id as string };
}

describe('starting a conversation', () => {
  it('is opened by the buyer and reaches the broker', async () => {
    const { broker, buyer, threadId } = await conversation();

    const brokerInbox = await broker.agent.get('/api/v1/chat/threads').expect(200);
    expect(brokerInbox.body.data).toHaveLength(1);
    expect(brokerInbox.body.data[0].id).toBe(threadId);
    expect(brokerInbox.body.data[0].unread).toBe(1);
    expect(brokerInbox.body.data[0].lastMessagePreview).toContain('borewell');

    // The sender has nothing unread — they are not waiting on themselves.
    const buyerInbox = await buyer.agent.get('/api/v1/chat/threads').expect(200);
    expect(buyerInbox.body.data[0].unread).toBe(0);
  });

  it('opens the same conversation twice rather than splitting the history', async () => {
    const { buyer, propertyId, threadId } = await conversation();

    const again = await buyer
      .post('/api/v1/chat/threads')
      .send({ propertyId, body: 'Also, is there road access?' })
      .expect(201);

    expect(again.body.data.id).toBe(threadId);

    const messages = await buyer.agent
      .get(`/api/v1/chat/threads/${threadId}/messages`)
      .expect(200);
    expect(messages.body.data).toHaveLength(2);
  });

  it('will not let a broker message themselves about their own listing', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const propertyId = await publish(broker, admin);

    await broker
      .post('/api/v1/chat/threads')
      .send({ propertyId, body: 'Talking to myself here.' })
      .expect(409);
  });

  it('will not open a conversation about something nobody can see', async () => {
    const broker = await actor('broker');
    const buyer = await actor('buyer');
    const draft = await broker.post('/api/v1/properties').send(listing()).expect(201);

    await buyer
      .post('/api/v1/chat/threads')
      .send({ propertyId: draft.body.data.id, body: 'How much for this one?' })
      .expect(404);
  });
});

describe('reading and replying', () => {
  it('marks messages read simply by reading them', async () => {
    const { broker, buyer, threadId } = await conversation();

    const read = await broker.agent
      .get(`/api/v1/chat/threads/${threadId}/messages`)
      .expect(200);
    expect(read.body.markedRead).toBe(1);

    const after = await broker.agent.get('/api/v1/chat/threads').expect(200);
    expect(after.body.data[0].unread).toBe(0);

    // And the buyer can see it was read.
    const buyerView = await buyer.agent
      .get(`/api/v1/chat/threads/${threadId}/messages`)
      .expect(200);
    expect(buyerView.body.data[0].readAt).not.toBeNull();
  });

  it('carries a reply back the other way', async () => {
    const { broker, buyer, threadId } = await conversation();

    await broker
      .post(`/api/v1/chat/threads/${threadId}/messages`)
      .send({ body: 'Yes, the borewell runs all year. Visit any morning.' })
      .expect(201);

    const unread = await buyer.agent.get('/api/v1/chat/unread').expect(200);
    expect(unread.body.unread).toBe(1);

    const messages = await buyer.agent
      .get(`/api/v1/chat/threads/${threadId}/messages`)
      .expect(200);
    expect(messages.body.data).toHaveLength(2);
    // Oldest first, which is the order a conversation is read in.
    expect(messages.body.data[0].body).toContain('borewell working');
    expect(messages.body.data[1].body).toContain('runs all year');
  });

  it('leaves a phone number exactly as it was typed', async () => {
    const { broker, buyer, threadId } = await conversation();

    // Masking was explicitly ruled out: a pattern that hides phone numbers also hides
    // survey numbers, khaata numbers and prices.
    await broker
      .post(`/api/v1/chat/threads/${threadId}/messages`)
      .send({ body: 'Call me on 98250 12345. Survey 85/2, khaata 412.' })
      .expect(201);

    const messages = await buyer.agent
      .get(`/api/v1/chat/threads/${threadId}/messages`)
      .expect(200);
    expect(messages.body.data[1].body).toContain('98250 12345');
    expect(messages.body.data[1].body).toContain('85/2');
  });

  it('echoes the client’s own id so a sender does not draw the message twice', async () => {
    const { broker, threadId } = await conversation();

    const sent = await broker
      .post(`/api/v1/chat/threads/${threadId}/messages`)
      .send({ body: 'On my way.', clientId: 'local-42' })
      .expect(201);

    expect(sent.body.data.clientId).toBe('local-42');
  });

  it('refuses an empty message', async () => {
    const { broker, threadId } = await conversation();
    await broker
      .post(`/api/v1/chat/threads/${threadId}/messages`)
      .send({ body: '   ' })
      .expect(400);
  });
});

describe('who can see a conversation', () => {
  it('is nobody but the two people in it', async () => {
    const { threadId } = await conversation();
    const stranger = await actor('buyer');
    const nosyAdmin = await actor('admin');

    // A 404, not a 403: whether a conversation exists is itself private.
    await stranger.agent.get(`/api/v1/chat/threads/${threadId}/messages`).expect(404);
    await nosyAdmin.agent.get(`/api/v1/chat/threads/${threadId}/messages`).expect(404);

    await stranger
      .post(`/api/v1/chat/threads/${threadId}/messages`)
      .send({ body: 'Butting in.' })
      .expect(404);
  });

  it('is not open to a visitor at all', async () => {
    await request(app).get('/api/v1/chat/threads').expect(401);
  });
});

describe('blocking and reporting', () => {
  it('stops the blocker receiving, and does not announce it', async () => {
    const { broker, buyer, threadId } = await conversation();

    await broker.post(`/api/v1/chat/threads/${threadId}/block`).send({ blocked: true }).expect(200);

    // The other side is not told — it still succeeds.
    await buyer
      .post(`/api/v1/chat/threads/${threadId}/messages`)
      .send({ body: 'Hello? Are you there?' })
      .expect(201);

    const inbox = await broker.agent.get('/api/v1/chat/threads').expect(200);
    expect(inbox.body.data[0].unread).toBe(0);
    expect(inbox.body.data[0].blocked).toBe(true);

    // Unblocking restores the whole history — nothing was thrown away.
    await broker.post(`/api/v1/chat/threads/${threadId}/block`).send({ blocked: false }).expect(200);
    const messages = await broker.agent
      .get(`/api/v1/chat/threads/${threadId}/messages`)
      .expect(200);
    expect(messages.body.data).toHaveLength(2);
  });

  it('will not let someone send into a conversation they blocked', async () => {
    const { broker, threadId } = await conversation();
    await broker.post(`/api/v1/chat/threads/${threadId}/block`).send({ blocked: true }).expect(200);

    await broker
      .post(`/api/v1/chat/threads/${threadId}/messages`)
      .send({ body: 'Actually, one more thing.' })
      .expect(403);
  });

  it('blocks as well as reports, so nobody has to act twice', async () => {
    const { broker, threadId } = await conversation();

    const response = await broker
      .post(`/api/v1/chat/threads/${threadId}/report`)
      .send({ reason: 'spam', detail: 'Advertising a loan company.' })
      .expect(200);

    expect(response.body.reported).toBe(true);

    const inbox = await broker.agent.get('/api/v1/chat/threads').expect(200);
    expect(inbox.body.data[0].blocked).toBe(true);
  });
});

describe('the 24-hour unread reminder', () => {
  it('emails only about messages that have gone a day without being read', async () => {
    const { broker, threadId } = await conversation();
    const { sendUnreadDigests } = await import('../../src/application/chat/unreadDigest.js');
    const { ChatThreadModel } = await import('../../src/infrastructure/db/models/Chat.js');

    // Nothing is a day old yet.
    expect(await sendUnreadDigests(harness.outbox)).toMatchObject({ people: 0 });

    // Age the conversation.
    await ChatThreadModel.updateOne(
      { _id: threadId },
      { $set: { lastMessageAt: new Date(Date.now() - 26 * 60 * 60 * 1000) } },
    );

    const first = await sendUnreadDigests(harness.outbox);
    expect(first.people).toBe(1);

    const mail = harness.outbox.outbox().find((m) => m.template === 'chat-unread-digest');
    expect(mail?.to).toBe(broker.account.email);
    expect(mail?.data.count).toBe('1');

    // A week of silence is one email, not seven.
    harness.outbox.clear();
    expect(await sendUnreadDigests(harness.outbox)).toMatchObject({ people: 0 });
    expect(harness.outbox.outbox()).toHaveLength(0);
  });

  it('does not remind the person who sent the last message', async () => {
    const { buyer, threadId } = await conversation();
    const { sendUnreadDigests } = await import('../../src/application/chat/unreadDigest.js');
    const { ChatThreadModel } = await import('../../src/infrastructure/db/models/Chat.js');

    await ChatThreadModel.updateOne(
      { _id: threadId },
      { $set: { lastMessageAt: new Date(Date.now() - 26 * 60 * 60 * 1000) } },
    );

    harness.outbox.clear();
    await sendUnreadDigests(harness.outbox);

    const digests = harness.outbox
      .outbox()
      .filter((m) => m.template === 'chat-unread-digest');
    expect(digests).toHaveLength(1);
    // The buyer wrote it; they are not waiting on themselves.
    expect(digests[0]?.to).not.toBe(buyer.account.email);
  });

  it('gathers everything one person is ignoring into a single email', async () => {
    const broker = await actor('broker');
    const admin = await actor('admin');
    const { sendUnreadDigests } = await import('../../src/application/chat/unreadDigest.js');
    const { ChatThreadModel } = await import('../../src/infrastructure/db/models/Chat.js');

    // Two buyers, two listings, two conversations — all landing on one broker.
    for (let index = 0; index < 2; index += 1) {
      const buyer = await actor('buyer');
      const propertyId = await publish(broker, admin);
      await buyer
        .post('/api/v1/chat/threads')
        .send({ propertyId, body: `Question number ${index} about this land.` })
        .expect(201);
    }

    await ChatThreadModel.updateMany(
      {},
      { $set: { lastMessageAt: new Date(Date.now() - 26 * 60 * 60 * 1000) } },
    );

    harness.outbox.clear();
    const result = await sendUnreadDigests(harness.outbox);

    expect(result.people).toBe(1);
    expect(result.threads).toBe(2);

    const digests = harness.outbox
      .outbox()
      .filter((m) => m.template === 'chat-unread-digest');
    // One email saying "2", not two emails saying "1".
    expect(digests).toHaveLength(1);
    expect(digests[0]?.data.count).toBe('2');
  });

  it('says nothing about a conversation that was blocked', async () => {
    const { broker, threadId } = await conversation();
    const { sendUnreadDigests } = await import('../../src/application/chat/unreadDigest.js');
    const { ChatThreadModel } = await import('../../src/infrastructure/db/models/Chat.js');

    await broker.post(`/api/v1/chat/threads/${threadId}/block`).send({ blocked: true }).expect(200);
    await ChatThreadModel.updateOne(
      { _id: threadId },
      { $set: { lastMessageAt: new Date(Date.now() - 26 * 60 * 60 * 1000), 'unread.dummy': 0 } },
    );

    harness.outbox.clear();
    await sendUnreadDigests(harness.outbox);

    // Blocking stopped the unread count moving, so there is nothing to be reminded of.
    expect(
      harness.outbox.outbox().filter((m) => m.template === 'chat-unread-digest'),
    ).toHaveLength(0);
  });
});
