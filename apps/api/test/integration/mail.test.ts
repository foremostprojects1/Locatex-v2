import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Express } from 'express';
import { startHarness, stopHarness, resetDatabase, type Harness } from '../helpers/harness.js';
import { registerAndVerify, signIn } from '../helpers/actors.js';
import type { RenderedEmail } from '../../src/infrastructure/mail/templates.js';

let app: Express;
let harness: Harness;

/** A transport that records instead of sending, and can be told to fail. */
class RecordingTransport {
  readonly sent: Array<{ to: string; from: string; rendered: RenderedEmail }> = [];
  failNext = false;

  async send(message: { to: string; from: string; rendered: RenderedEmail }) {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('the mail server was unreachable');
    }
    this.sent.push(message);
    return { messageId: `<${this.sent.length}@test>`, accepted: [message.to], rejected: [] };
  }
}

let transport: RecordingTransport;

beforeAll(async () => {
  harness = await startHarness();
  app = harness.app;
}, 120_000);

afterAll(async () => {
  await stopHarness();
});

beforeEach(async () => {
  await resetDatabase();
  transport = new RecordingTransport();
});

async function admin() {
  const account = await registerAndVerify(app, harness.outbox);
  const { UserModel } = await import('../../src/infrastructure/db/models/User.js');
  await UserModel.updateOne({ _id: account.userId }, { $set: { role: 'admin' } });
  const session = await signIn(app, { identifier: account.email, password: account.password });
  return { ...session, account };
}

/** Writes the log row the worker would find, without needing Redis for these tests. */
async function queueOne(overrides: Record<string, unknown> = {}) {
  const { EmailLogModel } = await import('../../src/infrastructure/db/models/EmailLog.js');
  const record = await EmailLogModel.create({
    to: 'ramesh@example.com',
    template: 'property-approved',
    subject: 'placeholder',
    status: 'queued',
    ...overrides,
  });
  return record.id as string;
}

describe('delivering a queued message', () => {
  it('sends it, records the provider’s id, and does not send it twice', async () => {
    const { deliverQueuedEmail } = await import('../../src/application/mail/mailer.js');
    const { EmailLogModel } = await import('../../src/infrastructure/db/models/EmailLog.js');

    const logId = await queueOne();
    const first = await deliverQueuedEmail(
      { logId, to: 'ramesh@example.com', template: 'property-approved', data: { title: 'Farmland' } },
      transport,
    );

    expect(first.delivered).toBe(true);
    expect(transport.sent).toHaveLength(1);
    expect(transport.sent[0]?.rendered.subject).toContain('Farmland');

    const record = await EmailLogModel.findById(logId).lean();
    expect(record?.status).toBe('sent');
    expect(record?.providerMessageId).toBe('<1@test>');
    expect(record?.sentAt).toBeTruthy();

    // A queue that delivers a job twice — and they all eventually do — must not email twice.
    const second = await deliverQueuedEmail(
      { logId, to: 'ramesh@example.com', template: 'property-approved', data: {} },
      transport,
    );
    expect(second.delivered).toBe(false);
    expect(transport.sent).toHaveLength(1);
  });

  it('records a failure and rethrows, so the queue retries it', async () => {
    const { deliverQueuedEmail } = await import('../../src/application/mail/mailer.js');
    const { EmailLogModel } = await import('../../src/infrastructure/db/models/EmailLog.js');

    const logId = await queueOne();
    transport.failNext = true;

    await expect(
      deliverQueuedEmail(
        { logId, to: 'ramesh@example.com', template: 'property-approved', data: {} },
        transport,
      ),
    ).rejects.toThrow('unreachable');

    const failed = await EmailLogModel.findById(logId).lean();
    expect(failed?.status).toBe('failed');
    expect(failed?.error).toContain('unreachable');
    expect(failed?.attempts).toBe(1);

    // The retry succeeds and the row ends up telling the truth.
    await deliverQueuedEmail(
      { logId, to: 'ramesh@example.com', template: 'property-approved', data: {} },
      transport,
    );
    const recovered = await EmailLogModel.findById(logId).lean();
    expect(recovered?.status).toBe('sent');
    expect(recovered?.attempts).toBe(2);
  });
});

describe('the daily ceiling', () => {
  it('stops ordinary mail once the day’s limit is reached', async () => {
    const { deliverQueuedEmail } = await import('../../src/application/mail/mailer.js');
    const { EmailLogModel } = await import('../../src/infrastructure/db/models/EmailLog.js');
    const { resetEnvForTests } = await import('../../src/config/env.js');

    process.env.EMAIL_DAILY_LIMIT = '2';
    resetEnvForTests();

    try {
      // Two already sent today.
      await EmailLogModel.create([
        { to: 'a@example.com', template: 'property-approved', subject: 's', status: 'sent', sentAt: new Date() },
        { to: 'b@example.com', template: 'property-approved', subject: 's', status: 'sent', sentAt: new Date() },
      ]);

      const logId = await queueOne();
      const result = await deliverQueuedEmail(
        { logId, to: 'c@example.com', template: 'property-approved', data: {} },
        transport,
      );

      expect(result.delivered).toBe(false);
      expect(result.reason).toContain('daily limit');
      expect(transport.sent).toHaveLength(0);

      const suppressed = await EmailLogModel.findById(logId).lean();
      expect(suppressed?.status).toBe('suppressed');
      expect(suppressed?.suppressedReason).toContain('2');
    } finally {
      delete process.env.EMAIL_DAILY_LIMIT;
      resetEnvForTests();
    }
  });

  it('sends a password reset anyway, because someone is locked out', async () => {
    const { deliverQueuedEmail } = await import('../../src/application/mail/mailer.js');
    const { EmailLogModel } = await import('../../src/infrastructure/db/models/EmailLog.js');
    const { resetEnvForTests } = await import('../../src/config/env.js');

    process.env.EMAIL_DAILY_LIMIT = '1';
    resetEnvForTests();

    try {
      await EmailLogModel.create({
        to: 'a@example.com',
        template: 'property-approved',
        subject: 's',
        status: 'sent',
        sentAt: new Date(),
      });

      const logId = await queueOne({ template: 'reset-password' });
      const result = await deliverQueuedEmail(
        {
          logId,
          to: 'locked-out@example.com',
          template: 'reset-password',
          data: { fullName: 'Ramesh', url: 'https://locatex.in/reset-password?token=abc' },
        },
        transport,
      );

      // Locking someone out of their own account to protect a quota is the wrong trade.
      expect(result.delivered).toBe(true);
      expect(transport.sent[0]?.to).toBe('locked-out@example.com');
    } finally {
      delete process.env.EMAIL_DAILY_LIMIT;
      resetEnvForTests();
    }
  });
});

describe('what the administrator can see', () => {
  it('lists what went out, with the headroom left today', async () => {
    const session = await admin();
    const { EmailLogModel } = await import('../../src/infrastructure/db/models/EmailLog.js');

    await EmailLogModel.create([
      { to: 'a@example.com', template: 'property-approved', subject: 'Live', status: 'sent', sentAt: new Date() },
      { to: 'b@example.com', template: 'property-rejected', subject: 'Needs a change', status: 'failed', error: 'mailbox full' },
    ]);

    const response = await session.agent.get('/api/v1/admin/emails').expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.volume.last24Hours).toBe(1);
    expect(response.body.volume.remaining).toBe(response.body.volume.limit - 1);
    expect(response.body.volume.shouldWarn).toBe(false);

    const failed = await session.agent.get('/api/v1/admin/emails?status=failed').expect(200);
    expect(failed.body.data).toHaveLength(1);
    expect(failed.body.data[0].error).toBe('mailbox full');
  });

  it('warns before the ceiling rather than after it', async () => {
    const session = await admin();
    const { EmailLogModel } = await import('../../src/infrastructure/db/models/EmailLog.js');
    const { resetEnvForTests } = await import('../../src/config/env.js');

    process.env.EMAIL_DAILY_WARN_AT = '2';
    resetEnvForTests();

    try {
      await EmailLogModel.create([
        { to: 'a@example.com', template: 'property-approved', subject: 's', status: 'sent', sentAt: new Date() },
        { to: 'b@example.com', template: 'property-approved', subject: 's', status: 'sent', sentAt: new Date() },
      ]);

      const response = await session.agent.get('/api/v1/admin/emails').expect(200);
      expect(response.body.volume.shouldWarn).toBe(true);
    } finally {
      delete process.env.EMAIL_DAILY_WARN_AT;
      resetEnvForTests();
    }
  });

  it('shows nobody else the mail log', async () => {
    const account = await registerAndVerify(app, harness.outbox);
    const buyer = await signIn(app, { identifier: account.email, password: account.password });
    await buyer.agent.get('/api/v1/admin/emails').expect(403);
  });
});

describe('sending the same thing twice', () => {
  it('is refused by the dedupe key, not by luck', async () => {
    const { EmailLogModel } = await import('../../src/infrastructure/db/models/EmailLog.js');

    await EmailLogModel.createIndexes();
    await EmailLogModel.create({
      to: 'ramesh@example.com',
      template: 'chat-unread-digest',
      subject: 'You have unread messages',
      status: 'sent',
      dedupeKey: '2026-08-24',
      sentAt: new Date(),
    });

    // The same digest, the same day, a second run of the job.
    await expect(
      EmailLogModel.create({
        to: 'ramesh@example.com',
        template: 'chat-unread-digest',
        subject: 'You have unread messages',
        status: 'queued',
        dedupeKey: '2026-08-24',
      }),
    ).rejects.toMatchObject({ code: 11000 });

    // A different day is a different message.
    await expect(
      EmailLogModel.create({
        to: 'ramesh@example.com',
        template: 'chat-unread-digest',
        subject: 'You have unread messages',
        status: 'queued',
        dedupeKey: '2026-08-25',
      }),
    ).resolves.toBeTruthy();
  });
});

// The queue itself is exercised by queue.test.ts; this only proves the mailer puts a job on
// it and logs the row first, so a message is recoverable even if the worker never runs.
describe('queueing', () => {
  it('logs the message before it is handed to the queue', async () => {
    const { QueuedMailer } = await import('../../src/application/mail/mailer.js');
    const { EmailLogModel } = await import('../../src/infrastructure/db/models/EmailLog.js');
    const queues = await import('../../src/infrastructure/queue/queues.js');

    // Typed with its parameters so the assertion on the job options below type-checks.
    const add = vi.fn(
      async (_name: string, _data: unknown, options?: { jobId?: string }) => ({
        id: options?.jobId ?? 'job-1',
      }),
    );
    vi.spyOn(queues, 'getQueue').mockReturnValue({ add } as never);

    try {
      await new QueuedMailer().send({
        to: 'ramesh@example.com',
        template: 'property-approved',
        data: { title: 'Farmland near Morbi' },
      });

      const logged = await EmailLogModel.findOne({ to: 'ramesh@example.com' }).lean();
      expect(logged?.status).toBe('queued');
      expect(logged?.subject).toContain('Farmland near Morbi');

      expect(add).toHaveBeenCalledOnce();
      // The job id is the log id, so a redelivery lands on the same row.
      expect(add.mock.calls[0]?.[2]).toMatchObject({ jobId: String(logged?._id) });
    } finally {
      vi.restoreAllMocks();
    }
  });
});
