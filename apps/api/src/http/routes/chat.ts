import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { reportThreadSchema, startThreadSchema } from '@locatex/contracts';
import {
  listThreads,
  openThread,
  readThread,
  reportThread,
  sendMessage,
  setBlocked,
  unreadTotal,
} from '../../application/chat/chat.js';
import { publishMessage } from '../../infrastructure/realtime/gateway.js';
import { requireUser, userOf } from '../middleware/authenticate.js';

/**
 * Chat over plain HTTP.
 *
 * This is the whole feature, not a fallback bolted on afterwards. The socket layer is an
 * accelerator that pushes what these endpoints already do; if it never connects — a
 * corporate proxy, a bad mobile network, a browser with websockets disabled — the client
 * polls these and the conversation still works. Building it the other way round produces a
 * chat that is broken for exactly the people on the worst connections.
 */
export const chatRouter: ExpressRouter = Router();

chatRouter.use(requireUser);

chatRouter.get('/threads', async (req, res, next) => {
  try {
    res.json({ data: await listThreads(userOf(req)) });
  } catch (error) {
    next(error);
  }
});

/** The badge in the header. Small and cheap, because it is asked for constantly. */
chatRouter.get('/unread', async (req, res, next) => {
  try {
    res.json({ unread: await unreadTotal(userOf(req).id) });
  } catch (error) {
    next(error);
  }
});

/** A buyer opens the conversation about a listing; a broker replies to it. */
chatRouter.post('/threads', async (req, res, next) => {
  try {
    const user = userOf(req);
    const { propertyId, body } = startThreadSchema.parse(req.body);

    const thread = await openThread(user.id, propertyId);
    if (body) {
      const message = await sendMessage(thread.id, user, { body });
      publishMessage(message);
    }

    res.status(201).json({ data: { id: thread.id, propertyId: thread.propertyId } });
  } catch (error) {
    next(error);
  }
});

chatRouter.get('/threads/:id/messages', async (req, res, next) => {
  try {
    const { limit, before } = z
      .object({
        limit: z.coerce.number().int().positive().max(100).optional(),
        before: z.string().max(40).optional(),
      })
      .strict()
      .parse(req.query);

    const result = await readThread(String(req.params.id), userOf(req), { limit, before });

    res.json({
      data: result.messages.map((message) => ({
        id: String(message._id),
        senderId: message.senderId,
        body: message.body,
        clientId: message.clientId,
        readAt: message.readAt,
        createdAt: message.createdAt,
      })),
      nextBefore: result.nextBefore,
      markedRead: result.markedRead,
    });
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/threads/:id/messages', async (req, res, next) => {
  try {
    const message = await sendMessage(String(req.params.id), userOf(req), req.body);
    // Pushed to whoever is listening; the reply below is what actually matters.
    publishMessage(message);

    res.status(201).json({
      data: {
        id: message.id,
        senderId: message.senderId,
        body: message.body,
        clientId: message.clientId,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/threads/:id/block', async (req, res, next) => {
  try {
    const { blocked } = z.object({ blocked: z.boolean() }).strict().parse(req.body);
    await setBlocked(String(req.params.id), userOf(req), blocked);
    res.json({ blocked });
  } catch (error) {
    next(error);
  }
});

chatRouter.post('/threads/:id/report', async (req, res, next) => {
  try {
    const { reason, detail } = reportThreadSchema.parse(req.body);
    await reportThread(String(req.params.id), userOf(req), reason, detail);
    res.json({
      reported: true,
      message: 'Thank you. Our team will look at this, and you will not hear from them again.',
    });
  } catch (error) {
    next(error);
  }
});
