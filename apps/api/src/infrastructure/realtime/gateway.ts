import type { Server as HttpServer } from 'node:http';
import { Server as SocketServer, type Socket } from 'socket.io';
import { verifyAccessToken } from '../auth/tokens.js';
import { UserModel } from '../db/models/User.js';
import { ACCESS_COOKIE } from '../../http/cookies.js';
import { logger } from '../observability/logger.js';
import { env } from '../../config/env.js';

/**
 * Real-time delivery for chat.
 *
 * Deliberately thin. Every message is written and read through the REST endpoints; this
 * only pushes a copy to whoever happens to be connected, so a client that never manages a
 * socket — a corporate proxy, a bad mobile network, websockets disabled — polls instead and
 * loses nothing but immediacy.
 *
 * Authentication reuses the session cookie rather than inventing a socket token. The
 * handshake carries cookies like any other request to the same origin, so there is one way
 * to be signed in and one place it can go wrong.
 */

let io: SocketServer | undefined;

/** `new URL()` throws on a malformed value; config validation already guards these. */
const safeOrigin = (value: string): string => {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
};

/** Each person joins a room named after their own id; messages are sent to that room. */
const roomFor = (userId: string): string => `user:${userId}`;

export function attachRealtime(server: HttpServer): SocketServer {
  const config = env();

  // The app's own origin has to be on this list. In single-deployment mode the page is
  // served from the API's origin, and `CORS_ORIGINS` is configured for *other* origins —
  // so relying on it alone refused the socket from the very page that opened it.
  const allowedOrigins = [
    ...config.CORS_ORIGINS,
    safeOrigin(config.APP_BASE_URL),
    safeOrigin(config.API_BASE_URL),
  ];

  io = new SocketServer(server, {
    path: '/api/v1/realtime',
    cors: { origin: allowedOrigins, credentials: true },
    // Polling first, then upgrade. A network that blocks websockets still gets messages.
    transports: ['polling', 'websocket'],
  });

  io.use(async (socket, next) => {
    try {
      const user = await identify(socket);
      if (!user) return next(new Error('unauthenticated'));
      socket.data.userId = user.id;
      socket.join(roomFor(user.id));
      return next();
    } catch (error) {
      logger.debug({ err: error }, 'socket handshake refused');
      return next(new Error('unauthenticated'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug({ userId: socket.data.userId }, 'socket connected');
    socket.on('disconnect', () => logger.debug({ userId: socket.data.userId }, 'socket gone'));
  });

  return io;
}

/**
 * Tells the recipient a message arrived.
 *
 * Never awaited by the caller and never allowed to throw: the message is already saved, and
 * a failure to push it must not turn a successful send into an error.
 */
export function publishMessage(message: {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  recipientId: string;
}): void {
  if (!io || !message.recipientId) return;

  try {
    io.to(roomFor(message.recipientId)).emit('message', {
      id: message.id,
      threadId: message.threadId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
    });
  } catch (error) {
    logger.warn({ err: error, threadId: message.threadId }, 'could not push a message');
  }
}

export function closeRealtime(): void {
  io?.close();
  io = undefined;
}

/**
 * Reads one cookie out of a raw `Cookie` header.
 *
 * Written here rather than pulled from a package: the handshake gives us the raw header,
 * this is the only place in the API that needs it, and a five-line function beats a
 * dependency whose major versions keep changing shape.
 */
function cookieValue(header: string, name: string): string | undefined {
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    return decodeURIComponent(part.slice(index + 1).trim());
  }
  return undefined;
}

async function identify(socket: Socket): Promise<{ id: string } | null> {
  const header = socket.handshake.headers.cookie;
  if (!header) return null;

  const token = cookieValue(header, ACCESS_COOKIE);
  if (!token) return null;

  const claims = await verifyAccessToken(token);
  const user = await UserModel.findOne({ _id: claims.sub, deletedAt: null })
    .select('status tokenVersion')
    .lean();

  // The same checks the HTTP middleware makes: a suspended account or a token from before
  // a password change must not hold a live socket open.
  if (!user || user.status !== 'active' || user.tokenVersion !== claims.ver) return null;

  return { id: String(user._id) };
}
